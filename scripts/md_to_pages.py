"""Render the repo's markdown files into artifact-ready HTML pages."""
import html, pathlib, re, sys
import markdown

REPO = pathlib.Path("/home/user/Jac-Personal-brand")
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")
EXT = ["tables", "fenced_code", "toc", "sane_lists", "attr_list"]

CSS = """
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f6f6f3; --surface:#ffffff; --ink:#16181b; --muted:#5d636b; --line:#dcdcd6;
  --accent:#0b6e74; --accent-soft:#e3f0f0; --mark:#fff4c2; --code:#eeeee9;
  color-scheme: light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#111315; --surface:#181b1e; --ink:#e7e8e6; --muted:#9aa1a8; --line:#2c3035;
    --accent:#5fc2c7; --accent-soft:#16302f; --mark:#4a4220; --code:#22262a; color-scheme: dark;
  }
}
:root[data-theme="dark"]{
  --bg:#111315; --surface:#181b1e; --ink:#e7e8e6; --muted:#9aa1a8; --line:#2c3035;
  --accent:#5fc2c7; --accent-soft:#16302f; --mark:#4a4220; --code:#22262a; color-scheme: dark;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.62 "IBM Plex Sans",system-ui,sans-serif;}
.wrap{max-width:1180px;margin:0 auto;padding-block:40px 96px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));
  display:grid;grid-template-columns:minmax(0,1fr);gap:40px}
@media (min-width:1000px){.wrap.has-toc{grid-template-columns:240px minmax(0,1fr)}}
header.top{border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:8px}
.kicker{font:500 12px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.meta{color:var(--muted);font-size:14px;margin-top:10px}
nav.toc{font-size:14px}
@media (max-width:999px){nav.toc{border:1px solid var(--line);border-radius:6px;background:var(--surface);padding:12px 14px}nav.toc details summary{margin:0}nav.toc details[open] summary{margin-bottom:8px}}
@media (min-width:1000px){nav.toc{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow:auto}}
nav.toc details summary{cursor:pointer;font-weight:600;margin-bottom:8px}
nav.toc ul{list-style:none;margin:0;padding:0}
nav.toc li{margin:0}
nav.toc a{display:block;padding:5px 10px;border-left:2px solid var(--line);color:var(--muted);text-decoration:none}
nav.toc a:hover{color:var(--ink);border-left-color:var(--accent)}
nav.toc ul ul a{padding-left:22px;font-size:13px}
article{min-width:0;max-width:820px}
h1,h2,h3{font-family:"Newsreader",Georgia,serif;font-weight:600;line-height:1.2;letter-spacing:-.01em}
h1{font-size:clamp(30px,5vw,44px);margin:12px 0 0}
h2{font-size:27px;margin:56px 0 14px;padding-top:12px;border-top:1px solid var(--line)}
h3{font-size:20px;margin:32px 0 10px}
h4{font-size:15px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
h2,h3,h4{scroll-margin-top:16px}
p,ul,ol{margin:0 0 14px}
li{margin:4px 0}
a{color:var(--accent);text-underline-offset:2px;overflow-wrap:anywhere}
strong{font-weight:600}
blockquote{margin:20px 0;padding:14px 18px;background:var(--accent-soft);border-left:3px solid var(--accent);border-radius:0 6px 6px 0}
blockquote p:last-child{margin:0}
code{font:400 .88em "IBM Plex Mono",monospace;background:var(--code);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
pre{background:var(--code);padding:14px 16px;border-radius:6px;overflow-x:auto;line-height:1.45}
pre code{background:none;padding:0;overflow-wrap:normal}
hr+h2{border-top:0;margin-top:24px}
hr{border:0;border-top:1px solid var(--line);margin:36px 0}
.table{overflow-x:auto;margin:16px 0 22px;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.5}
th,td{text-align:left;vertical-align:top;padding:9px 12px;border-bottom:1px solid var(--line);min-width:110px}
th{font-weight:600;background:var(--bg);white-space:nowrap}
tr:last-child td{border-bottom:0}
details.note{border:1px solid var(--line);border-radius:6px;background:var(--surface);margin:10px 0}
details.note>summary{cursor:pointer;padding:12px 16px;list-style:none;display:flex;gap:12px;justify-content:space-between;align-items:baseline}
details.note>summary::-webkit-details-marker{display:none}
details.note>summary .t{font-weight:600}
details.note>summary .c{color:var(--muted);font-size:13px;white-space:nowrap}
details.note[open]>summary{border-bottom:1px solid var(--line)}
details.note .body{padding:4px 18px 10px}
details.note .body h1{font-size:24px}
details.note .body h2{font-size:21px;margin-top:28px}
.filter{width:100%;padding:11px 14px;font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;margin:18px 0 6px}
.count{color:var(--muted);font-size:13px}
@media (max-width:600px){h2{font-size:23px} details.note>summary{flex-direction:column;gap:2px}}
</style>
"""


def md(text):
    conv = markdown.Markdown(extensions=EXT, extension_configs={"toc": {"toc_depth": "2-3"}})
    body = conv.convert(text)
    body = body.replace("<table>", '<div class="table"><table>').replace("</table>", "</table></div>")
    return body, conv.toc_tokens


def strip_front_matter(text):
    meta = {}
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            for line in text[4:end].splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()
            text = text[end + 4:]
    return meta, text


def toc_html(tokens):
    def walk(items):
        out = "<ul>"
        for t in items:
            name = re.sub(r"<[^>]+>", "", t["name"])
            out += f'<li><a href="#{t["id"]}">{name}</a>'
            if t["children"]:
                out += walk(t["children"])
            out += "</li>"
        return out + "</ul>"
    return f'<nav class="toc"><details open><summary>Contents</summary>{walk(tokens)}</details></nav>'


def page(title, kicker, meta_line, body, tokens=None):
    has_toc = bool(tokens)
    nav = toc_html(tokens) if has_toc else ""
    return (f'<title>{html.escape(title)}</title>\n'
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'{CSS}\n<div class="wrap{" has-toc" if has_toc else ""}">{nav}<article>'
            f'<header class="top"><div class="kicker">{kicker}</div>'
            f'<div class="meta">{meta_line}</div></header>{body}</article></div>\n'
            "<script>if(matchMedia('(max-width:999px)').matches)document.querySelectorAll('nav.toc details').forEach(d=>d.open=false)</script>\n")


def doc(src, out, title, kicker):
    text = (REPO / src).read_text()
    body, tokens = md(text)
    # Drop the H1 from the TOC (it is the page title).
    if len(tokens) == 1 and tokens[0]["level"] == 1:
        tokens = tokens[0]["children"]
    (OUT / out).write_text(page(title, kicker, f"Source: <code>{src}</code> · Aura Miami / Claude advisor", body, tokens))


def library(out):
    groups = [
        ("Repository & track guides", [REPO / "README.md",
            REPO / "training/clothing-brand-ads/README.md",
            REPO / "training/aura-brand-psychology/README.md",
            REPO / "training/ad-editing/README.md"]),
        ("Track A · Meta ads video notes", sorted((REPO / "training/clothing-brand-ads/notes").glob("*.md"))),
        ("Track A · re-watched (lite-model drafts)", sorted((REPO / "training/clothing-brand-ads/notes/_lite").glob("*.md"))),
        ("Track B · brand psychology video notes", sorted((REPO / "training/aura-brand-psychology/notes").glob("*.md"))),
        ("Track C · ad editing video notes", sorted((REPO / "training/ad-editing/notes").glob("*.md"))),
        ("Claude skills", sorted(REPO.glob(".claude/skills/**/*.md"))),
    ]
    parts, tokens, total = [], [], 0
    for gi, (gname, files) in enumerate(groups):
        if not files:
            continue
        gid = f"g{gi}"
        tokens.append({"id": gid, "name": f"{gname} ({len(files)})", "children": [], "level": 2})
        parts.append(f'<h2 id="{gid}">{html.escape(gname)} <span class="count">· {len(files)}</span></h2>')
        for f in files:
            meta, text = strip_front_matter(f.read_text())
            body, _ = md(text)
            title = meta.get("title") or f.relative_to(REPO).as_posix()
            sub = meta.get("channel") or (f.relative_to(REPO).parent.as_posix().replace(".", "repo root") if f.parent == REPO else f.relative_to(REPO).parent.as_posix())
            if meta.get("url"):
                link = html.escape(meta["url"])
                body = f'<p class="meta"><a href="{link}">{link}</a> · watched by {html.escape(meta.get("watched_by","?"))} · {html.escape(meta.get("studied_at",""))}</p>' + body
            search = html.escape((title + " " + sub).lower(), quote=True)
            parts.append(f'<details class="note" data-s="{search}"><summary><span class="t">{html.escape(title)}</span>'
                         f'<span class="c">{html.escape(sub)}</span></summary><div class="body">{body}</div></details>')
            total += 1
    script = """<script>
const q=document.getElementById('q');q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();
document.querySelectorAll('details.note').forEach(d=>{d.style.display=!v||d.dataset.s.includes(v)||d.textContent.toLowerCase().includes(v)?'':'none'})});
</script>"""
    head = ('<h1>Training Notes Library</h1><p>Every per-video study note, track guide and skill file from training week, '
            'in one place. Open any card to read the full note; timestamps cite the source video.</p>'
            '<input id="q" class="filter" type="search" placeholder="Filter by title, channel or any word in the notes">')
    (OUT / out).write_text(page("Training Notes Library", "Aura Miami · Training week",
                                f"{total} files · rendered from the repository", head + "".join(parts) + script, tokens))


if __name__ == "__main__":
    doc("strategy/AURA-Q4-2026-PLAN.md", "q4-plan.html", "Aura Q4 Plan", "Aura Miami · Q4 2026 strategy")
    doc("training/clothing-brand-ads/PLAYBOOK-DRAFT.md", "meta-ads-playbook.html", "Meta Ads Playbook", "Aura Miami · Track A")
    doc("training/aura-brand-psychology/BRAND-PLAYBOOK.md", "brand-playbook.html", "Aura Brand Playbook", "Aura Miami · Track B")
    doc("training/aura-brand-psychology/web-notes.md", "brand-research.html", "Brand Research Notes", "Aura Miami · Track B sources")
    library("notes-library.html")
    for p in sorted(OUT.glob("*.html")):
        print(p.name, p.stat().st_size)
