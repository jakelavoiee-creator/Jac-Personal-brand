# Launch Video 01: "Claude + Higgsfield built this website"

**Format:** a remake of the @clovr.guy reel (31.0s) with our own footage. His shoe-ad payoff is replaced by an animated website build.
**North star:** cinematic and calm. A dark walnut desk at golden hour, warm lamp bokeh, no face on camera. Screens are shot at angles, never flat.
**Spec:** 9:16, 1080×1920 master (upscale to 2160×3840 for export), 30fps, 31s total.
**Payoff site:** https://superior-painting-oc.higgsfield.app/

---

## Locked

- Pacing follows his cut points, measured from his file: 1.1 / 2.1 / 3.2 / 3.9 / 4.7 / 6.5 / 8.1 / 11.0 / 12.0 / 13.8 / 16.1 / 18.3 / 20.0 / 24.7.
- Footage is our own: Higgsfield-generated laptop shots plus screen recordings from Jac's account. None of his clips are used.
- CTA: Comment **"SITE"**.

## Overlay type system

- Font: **SF Pro Display Semibold** (CapCut: "Inter Semibold"). White, 4% letter-spacing, soft drop shadow (0, 2px, 12px, 40% black).
- Hook title: 96px, centered, top third (y = 22%).
- Step captions: 54px, bottom third (y = 78%), one line, maximum 5 words.
- Accent color: Higgsfield lime **#D7FF3A** for the single key word in each caption.
- Text animation: 6-frame fade in plus an 8px rise. Hard cut out on the edit.

---

## Shot list

| # | Time | Screen to record | Plate (Higgsfield) | Camera move (in edit) | Overlay text |
|---|------|------------------|--------------------|-----------------------|--------------|
| 1 | 0.0–1.1 | higgsfield.ai home page, static | **Plate 1** (wide 3/4 desk) | Slow push-in, 100→106% | Logos: Higgsfield **+** Claude **= 🔥** (logo row 140px tall, centered at y=30%) |
| 2 | 1.1–2.1 | higgsfield.ai, cursor clicks the **MCP & CLI** tab | **Plate 2** (low macro tilt) | Drift left 40px | *(none, logos fade out)* |
| 3 | 2.1–3.2 | MCP page, cursor clicks the **copy** icon next to `https://mcp.higgsfield.ai/mcp` | Plate 2 | Push-in 100→112% toward the URL | "copy the **MCP link**" |
| 4 | 3.2–3.9 | Switch to claude.ai, "New chat" | Plate 1 | Whip-pan transition (6 frames) | *(none)* |
| 5 | 3.9–4.7 | Claude home ("Welcome, Jac") | Plate 3 (high 3/4, evening) | Static | "open **Claude**" |
| 6 | 4.7–6.5 | Sidebar → **Customize** → **Connectors** | Plate 2 | Drift up 30px | "Customize → **Connectors**" |
| 7 | 6.5–8.1 | **+** → **Add custom connector** | Plate 2 | Push-in to the dropdown | "add **custom connector**" |
| 8 | 8.1–11.0 | Type `Higgsfield` in Name, paste the URL, click **Add** | Plate 1 | Slow push 100→108% | "paste + **Add**" |
| 9 | 11.0–12.0 | Connector list shows **Higgsfield · CUSTOM** | Plate 3 | Static, 4-frame flash on the row | "**connected** ✓" |
| 10 | 12.0–13.8 | New chat, drag the **Superior Painting Google Maps screenshot** into the box | Plate 1 | Push-in toward the thumbnail | "drop **any business**" |
| 11 | 13.8–16.1 | Paste the prompt (first line visible), press **Enter** | Plate 2 | Push-in on the text | "one **prompt**" |
| 12 | 16.1–18.3 | Claude working: tool calls scrolling ("generating hero video…") | Plate 3 | Slow push, slight blur build | "wait for it…" |
| 13 | 18.3–20.0 | **PAYOFF START:** live site loads, hero video autoplaying | Full-screen (no plate) | Hard cut + 2-frame white flash | **"4 minutes."** (hook size, center) |
| 14 | 20.0–24.7 | Slow scroll through the site: hero → parallax layers → services | Full-screen | Scroll in sync with the beat | *(none, let it breathe)* |
| 15 | 24.7–29.0 | Mobile view (Safari responsive mode, iPhone frame): reviews → tap-to-call → Maps directions | Full-screen | Static | "live. **mobile.** ready." |
| 16 | 29.0–31.0 | Black, logo row fades back in | — | — | Comment **"SITE"** (+ small lime tag: **BUILT WITH HIGGSFIELD**) |

---

## Recording instructions (no camera needed)

1. **Mac setup:** Display set to "Default for display" or the highest scaled resolution. Hide the dock. Use a fresh Chrome profile with no bookmarks bar. Dark mode on. Close all other tabs.
2. **Record:** QuickTime → File → New Screen Recording (or Cmd+Shift+5) → **Record Entire Screen**. Turn **Show Mouse Clicks** on in Options.
3. **Cursor pace:** move slowly and deliberately. Pause 0.5s on each target before clicking. Every shot above needs 1s of padding before and after.
4. **One file per shot**, named `shot01.mov`, `shot02.mov` and so on. Shots 13–15 can be one continuous take.
5. **Payoff scroll (shot 14):** use a trackpad with two fingers, steady and slow, about 6 seconds from hero to services. Do two takes.
6. **Mobile (shot 15):** Chrome DevTools → device toolbar → iPhone 15 Pro → zoom 100%.

## Edit assembly

- Each screen recording is corner-pinned onto the green screen of its plate. In CapCut, use **Chroma key** on the plate layer above the recording, then position and skew the recording until it fills the green area. In DaVinci Resolve, use **Corner Positioner**.
- Add a **warm grade** to the screen layer: +8 temperature, −10 highlights, and a soft vignette to match the plates.
- Add a **5% gaussian blur** to the edges of each pinned screen to sell the depth of field.
- **Sound:** lo-fi or ambient trending sound at −14 LUFS, plus a soft keyboard click and a whoosh on each cut (shots 4 and 13).
- **Export:** 1080×1920 master, then upscale to 4K (Higgsfield `upscale_video`, Topaz 2160p) for the final upload.

---

## The on-screen prompt (shot 11)

Paste this into Claude with the Google Maps screenshot attached:

```
Build and deploy a polished, standalone one-page website for the local business described below. Use strong creative judgment to fill gaps without asking questions unless the source is unusable.

Include a hero, about, services/menu, 2–3 verbatim review highlights, hours, location, and contact footer. Make phone numbers tap-to-call and addresses open Google Maps directions. Omit missing factual details; never invent prices, awards, history, or specific claims. Neutral supporting copy may be inferred from the category and reviews.

Create a distinctive, category-appropriate visual identity, including a logo/favicon if needed, custom imagery, typography, colors, and purposeful motion—never placeholders or a generic template.

The hero must feature a bespoke cinematic video generated with the highest-quality model available, at least 1080p and upscaled when useful. Regenerate flawed results. It must autoplay muted, loop seamlessly, and include a poster frame.

Implement smooth, transform-based scroll parallax with 2–3 layered depths, mobile support, and reduced-motion accessibility.

Optimize for mobile, speed, and SEO, including metadata and an OG image. Deploy to a memorable business-based URL, verify the live video, parallax, links, and performance, then return the URL and a three-line design summary.

Google Maps information:
Superior Painting
Category: Painter
Rating: 5.0 (55 Google reviews)
Address: 1801 S Raymond Ave, Anaheim, CA 92801, United States
Hours: Open 24 hours
Phone: +1 714-858-1921
Plus code: V36V+H3 Anaheim, California, USA
```

---

## Caption (Instagram)

```
Claude + Higgsfield built this website from one screenshot 🔥

Google Maps listing → one prompt → live animated site with a cinematic hero video.

Comment "SITE" and I'll send you the exact prompt.

#higgsfield #HiggsfieldCreator #claude #mcp #webdesign #ai
```

Enable Instagram's **"AI info"** label when posting (the laptop shots are AI-generated).
