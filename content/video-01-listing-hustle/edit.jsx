// "Claude + Higgsfield = $" — motion-design tutorial, 16:9, 41s
export default async ({ project, icon }) => {
  const p = await project({ dir: "/home/user/proj_main", size: "1920x1080", fps: 30, background: "#0b0705" });

  // ---------- tokens ----------
  const CREAM = "#FAF7F2", INK = "#1F1B16", MUTED = "#8A8178", LINE = "#E7E0D6";
  const CLAUDE = "#D97757", HF = "#C6F432", RED = "#E5372B", GREEN = "#2FB463", GOLD = "#FFD84D";
  const SANS = "Inter", SERIF = "Playfair Display";
  const SX = 432, SY = 172, SW = 1056, SH = 646; // laptop screen box
  const END = 41;
  const BG = { kind: "radial", stops: [{ offset: 0, color: "#40291a" }, { offset: 0.5, color: "#1b110b" }, { offset: 1, color: "#060403" }] };
  const pop = (d = 0.35) => ({ enter: { from: { scale: 0.6, opacity: 0 }, duration: d, easing: [0.2, 0.9, 0.3, 1] } });
  const fadeUp = (d = 0.4) => ({ enter: { from: { y: 30, opacity: 0 }, duration: d } });

  // ---------- background ----------
  p.compose(<rect x={0} y={0} width={1920} height={1080} fill={BG} />, { at: 0, dur: END, name: "bg" });

  // ---------- laptop body (persistent until money beat) ----------
  const laptopAnim = [
    { property: "offsetY", keyframes: [{ at: 0, value: 520 }, { at: 0.8, value: 0 }, { at: 31.4, value: 0, easing: "house" }, { at: 32.2, value: 760 }] },
  ];
  p.compose(
    <group name="laptopBody" animate={laptopAnim}>
      <rect x={410} y={150} width={1100} height={690} radius={22} fill="#0e0e10" strokeColor="#3a3a3e" strokeWidth={3} shadow={{ x: 0, y: 30, blur: 60, color: "#000000" }} />
      <rect x={SX} y={SY} width={SW} height={SH} radius={6} fill="#141110" />
      <path x={300} y={840} width={1320} height={60} d="M110 0 L1210 0 L1320 44 Q1320 60 1300 60 L20 60 Q0 60 0 44 Z"
        fill={{ kind: "linear", angle: 90, stops: [{ offset: 0, color: "#d6d7db" }, { offset: 1, color: "#6f7076" }] }} />
      <rect x={880} y={840} width={160} height={10} radius={5} fill="#9a9ba0" />
    </group>,
    { at: 0, dur: 32.3, name: "laptop" }
  );

  // Screen helper: a clipped frame on the laptop screen, riding the same rise.
  const Screen = ({ at, dur, bg = CREAM, children, name }) => {
    p.compose(
      <frame name={name} x={SX} y={SY} width={SW} height={SH} layout="none" clip={true} radius={6} background={bg}
        animate={at < 1 ? [{ property: "offsetY", from: 520, to: 0, duration: 0.8, easing: "house" }] : undefined}>
        {children}
      </frame>,
      { at, dur, name }
    );
  };

  // Red hand-drawn arrow pointing down-left to (tx,ty) in screen coords.
  const Arrow = ({ tx, ty, at = 0, flip = false }) => (
    <path x={flip ? tx - 10 : tx - 30} y={ty - 150} width={220} height={160} at={at}
      d={flip ? "M10 10 Q160 -10 190 140 M190 140 L215 95 M190 140 L150 110" : "M210 10 Q60 -10 30 140 M30 140 L5 95 M30 140 L70 110"}
      stroke={{ width: 10, color: RED, cap: "round" }}
      animate={[{ property: "opacity", from: 0, to: 1, duration: 0.15 }, { property: "offsetY", from: -40, to: 0, duration: 0.35, easing: "house" }]} />
  );

  // ---------- captions (word-by-word, lower third) ----------
  const caps = [
    [0.2, "This AI combo"], [0.9, "pays $500", true], [1.6, "per house listing."], [2.4, "Let me show you."],
    [3.2, "3 steps."], [3.8, "Under 5 minutes."],
    [4.6, "Step 1:"], [5.2, "open Higgsfield MCP"], [6.1, "and copy this link."], [7.4, "Now open Claude."],
    [9.0, "Settings → Connectors"], [10.0, "Add custom connector"], [11.0, "Name it Higgsfield"], [12.1, "paste the link"], [13.0, "and hit Connect."],
    [14.1, "Done."], [14.7, "Claude now runs"], [15.5, "Higgsfield for you."],
    [16.6, "Step 2:"], [17.1, "drop in the agency's photos"], [18.6, "paste this prompt"], [20.2, "and send it."], [21.6, "Claude does the rest."],
    [23.6, "Step 3: you get"], [24.4, "a cinematic walkthrough"], [26.6, "retouched listing photos"], [28.9, "and social reels"], [29.9, "ready to post."],
    [31.6, "Sell it to agencies", true], [32.7, "for every listing"], [33.8, "every single week.", true],
    [36.1, "Comment LISTING", true], [37.2, "and I'll DM you"], [38.0, "the exact prompt."], [39.0, "Tag a friend"], [40.0, "who needs this."],
  ];
  caps.forEach(([t, words, hot], i) => {
    const next = i + 1 < caps.length ? caps[i + 1][0] : END;
    p.compose(
      <text x={160} y={928} width={1600} align="center" fontFamily={SANS} fontWeight={900} fontSize={66} color={hot ? GOLD : "#ffffff"}
        letterSpacing={-1} shadow={{ x: 0, y: 6, blur: 18, color: "#000000" }}
        motion={{ by: "word", from: { opacity: 0, y: 26, scale: 0.85 }, duration: 0.22, overlap: 0.08, easing: "ease-out" }}>{words}</text>,
      { at: t, dur: next - t, name: `cap${i}` }
    );
  });

  // ---------- top equation + step progress ----------
  const Tile = ({ x, color, children }) => (
    <frame x={x} y={0} width={84} height={84} radius={20} background={color} layout="none" shadow={{ x: 0, y: 8, blur: 20, color: "#000000" }}>{children}</frame>
  );
  p.compose(
    <frame x={660} y={36} width={600} height={90} layout="none" motion={pop(0.5)}>
      <Tile x={40} color={CLAUDE}>{icon("asterisk", { x: 14, y: 14, size: 56, color: "#ffffff", strokeWidth: 3 })}</Tile>
      <text x={140} y={8} width={60} fontFamily={SANS} fontWeight={900} fontSize={60} color="#ffffff" align="center">+</text>
      <Tile x={216} color="#0d0d0d"><text x={0} y={14} width={84} fontFamily={SANS} fontWeight={900} fontSize={46} color={HF} align="center">H</text></Tile>
      <text x={316} y={8} width={60} fontFamily={SANS} fontWeight={900} fontSize={60} color="#ffffff" align="center">=</text>
      <Tile x={392} color={GREEN}>{icon("dollar-sign", { x: 14, y: 14, size: 56, color: "#ffffff", strokeWidth: 3 })}</Tile>
    </frame>,
    { at: 0.2, dur: 4.4, name: "equation" }
  );
  const Chip = ({ n, label }) => (
    <frame x={760} y={52} width={400} height={64} radius={32} background="#1d140e" layout="none" motion={pop(0.35)}>
      <frame x={8} y={8} width={48} height={48} radius={24} background={RED} layout="none">
        <text x={0} y={6} width={48} align="center" fontFamily={SANS} fontWeight={900} fontSize={30} color="#ffffff">{n}</text>
      </frame>
      <text x={68} y={14} width={320} fontFamily={SANS} fontWeight={700} fontSize={28} color="#ffffff">{label}</text>
    </frame>
  );
  p.compose(<Chip n="1" label="Connect Higgsfield" />, { at: 4.6, dur: 12, name: "chip1" });
  p.compose(<Chip n="2" label="Paste one prompt" />, { at: 16.6, dur: 6.9, name: "chip2" });
  p.compose(<Chip n="3" label="Deliver & get paid" />, { at: 23.5, dur: 8, name: "chip3" });
  // thin progress bar along the very top keeps the viewer oriented
  p.compose(<rect x={0} y={0} width={1920} height={8} fill={RED}
    animate={[{ property: "scaleX", from: 0, to: 1, duration: END - 0.1, easing: "linear" }]} />, { at: 0, dur: END, name: "progress" });

  // ================= SCREENS =================
  // S0 hook: agency listing card with price stamp
  const Photo = ({ x, y, w, h, tone = 0, label }) => (
    <frame x={x} y={y} width={w} height={h} radius={10} layout="none" clip={true}
      background={{ kind: "linear", angle: 135, stops: [{ offset: 0, color: ["#d9c7ad", "#b9c6cf", "#cdbfb2", "#c9d3c4", "#e2cfb8"][tone % 5] }, { offset: 1, color: ["#8c7358", "#6c7f8c", "#86705e", "#7b8b74", "#9b7d5c"][tone % 5] }] }}>
      {icon("house", { x: w / 2 - 28, y: h / 2 - 34, size: 56, color: "#ffffff", strokeWidth: 1.6 })}
      {label ? <text x={0} y={h / 2 + 26} width={w} align="center" fontFamily={SANS} fontWeight={700} fontSize={18} color="#ffffff">{label}</text> : null}
    </frame>
  );
  Screen({
    at: 0, dur: 3.2, name: "s0", children: [
      <text x={40} y={34} width={900} fontFamily={SANS} fontWeight={700} fontSize={34} color={INK}>4 Bed Family Home · Oakville, ON</text>,
      <text x={40} y={84} width={900} fontFamily={SANS} fontWeight={400} fontSize={22} color={MUTED}>Listed by Maple &amp; Co. Realty</text>,
      <Photo x={40} y={130} w={600} h={420} tone={0} label="Living room" />,
      <Photo x={656} y={130} w={360} h={202} tone={1} />,
      <Photo x={656} y={348} w={360} h={202} tone={2} />,
      <frame x={600} y={420} width={420} height={150} radius={18} background={GREEN} layout="none" at={1.0}
        motion={{ enter: { from: { scale: 1.8, opacity: 0, rotation: -14 }, duration: 0.3, easing: "ease-out" }, settle: { to: { rotation: -8 }, duration: 0.2 } }}
        shadow={{ x: 0, y: 10, blur: 30, color: "#000000" }}>
        <text x={0} y={22} width={420} align="center" fontFamily={SANS} fontWeight={900} fontSize={64} color="#ffffff">$500</text>
        <text x={0} y={100} width={420} align="center" fontFamily={SANS} fontWeight={700} fontSize={24} color="#ffffff">per listing video</text>
      </frame>,
    ]
  });

  // S1 overview: 3 steps
  const StepRow = ({ y, n, t, at }) => (
    <frame x={180} y={y} width={700} height={110} layout="none" at={at} motion={fadeUp(0.35)}>
      <frame x={0} y={15} width={80} height={80} radius={40} background={RED} layout="none">
        <text x={0} y={14} width={80} align="center" fontFamily={SANS} fontWeight={900} fontSize={46} color="#ffffff">{n}</text>
      </frame>
      <text x={110} y={30} width={600} fontFamily={SANS} fontWeight={700} fontSize={42} color={INK}>{t}</text>
    </frame>
  );
  Screen({
    at: 3.2, dur: 1.4, name: "s1", children: [
      <StepRow y={120} n="1" t="Connect Higgsfield to Claude" at={0} />,
      <StepRow y={260} n="2" t="Paste one prompt" at={0.25} />,
      <StepRow y={400} n="3" t="Sell the results" at={0.5} />,
    ]
  });

  // S2 Higgsfield MCP page (dark)
  Screen({
    at: 4.6, dur: 4.4, name: "s2", bg: "#0f1012", children: [
      <frame x={40} y={30} width={60} height={60} radius={14} background="#000000" layout="none">
        <text x={0} y={8} width={60} align="center" fontFamily={SANS} fontWeight={900} fontSize={36} color={HF}>H</text>
      </frame>,
      <text x={0} y={150} width={SW} align="center" fontFamily={SANS} fontWeight={900} fontSize={64} color="#ffffff" motion={{ by: "line", from: { opacity: 0, y: 30 }, duration: 0.4 }}>HIGGSFIELD MCP</text>,
      <text x={0} y={236} width={SW} align="center" fontFamily={SANS} fontWeight={400} fontSize={26} color="#9aa0a6">Connect Higgsfield to any AI assistant</text>,
      <frame x={178} y={330} width={700} height={84} radius={16} background="#1c1e22" layout="none" at={0.6} motion={fadeUp(0.35)}>
        <text x={30} y={24} width={480} fontFamily="JetBrains Mono" fontWeight={400} fontSize={28} color="#e8eaed">mcp.higgsfield.ai/mcp</text>
        <frame x={520} y={12} width={168} height={60} radius={12} background={HF} layout="none">
          {icon("copy", { x: 20, y: 16, size: 28, color: "#0d0d0d", strokeWidth: 2.4 })}
          <text x={58} y={14} width={100} fontFamily={SANS} fontWeight={900} fontSize={28} color="#0d0d0d">Copy</text>
        </frame>
        <frame x={520} y={12} width={168} height={60} radius={12} background={GREEN} layout="none" at={2.4} motion={pop(0.3)}>
          {icon("check", { x: 16, y: 16, size: 28, color: "#ffffff", strokeWidth: 3 })}
          <text x={52} y={14} width={110} fontFamily={SANS} fontWeight={900} fontSize={28} color="#ffffff">Copied</text>
        </frame>
      </frame>,
      <Arrow tx={790} ty={340} at={1.5} />,
    ]
  });

  // Claude chrome (sidebar)
  const Sidebar = ({ active }) => (
    <frame x={0} y={0} width={230} height={SH} background="#F1ECE4" layout="none">
      <frame x={24} y={26} width={40} height={40} radius={10} background={CLAUDE} layout="none">{icon("asterisk", { x: 6, y: 6, size: 28, color: "#ffffff", strokeWidth: 3 })}</frame>
      <text x={76} y={30} width={140} fontFamily={SERIF} fontWeight={700} fontSize={28} color={INK}>Claude</text>
      {["New chat", "Chats", "Projects", "Settings"].map((l, i) => (
        <frame x={14} y={100 + i * 52} width={200} height={42} radius={10} layout="none" background={l === active ? "#1F1B16" : "#F1ECE4"}>
          <text x={16} y={9} width={180} fontFamily={SANS} fontWeight={600} fontSize={20} color={l === active ? "#ffffff" : INK}>{l}</text>
        </frame>
      ))}
    </frame>
  );
  const ConnRow = ({ y, name, color, status = "Connect", ok = false, at }) => (
    <frame x={270} y={y} width={740} height={64} radius={12} background="#ffffff" layout="none" at={at} motion={at !== undefined ? fadeUp(0.3) : undefined}>
      <frame x={18} y={16} width={32} height={32} radius={8} background={color} layout="none" />
      <text x={66} y={18} width={400} fontFamily={SANS} fontWeight={700} fontSize={24} color={INK}>{name}</text>
      <text x={560} y={20} width={160} align="right" fontFamily={SANS} fontWeight={700} fontSize={20} color={ok ? GREEN : MUTED}>{status}</text>
    </frame>
  );
  const SettingsHead = (
    <group>
      <text x={270} y={34} width={600} fontFamily={SERIF} fontWeight={700} fontSize={40} color={INK}>Settings</text>
      <text x={270} y={100} width={130} fontFamily={SANS} fontWeight={600} fontSize={22} color={MUTED}>General</text>
      <text x={400} y={100} width={160} fontFamily={SANS} fontWeight={700} fontSize={22} color={INK}>Connectors</text>
      <rect x={400} y={132} width={128} height={4} radius={2} fill={CLAUDE} />
    </group>
  );
  const baseRows = [
    <ConnRow y={170} name="Gmail" color="#EA4335" />,
    <ConnRow y={246} name="Google Drive" color="#1FA463" />,
    <ConnRow y={322} name="Notion" color="#111111" />,
  ];
  // S3 connectors list + add button
  Screen({
    at: 9.0, dur: 2.0, name: "s3", children: [
      <Sidebar active="Settings" />, SettingsHead, ...baseRows,
      <frame x={720} y={88} width={300} height={52} radius={12} background={INK} layout="none">
        <text x={0} y={13} width={300} align="center" fontFamily={SANS} fontWeight={700} fontSize={20} color="#ffffff">+ Add custom connector</text>
      </frame>,
      <Arrow tx={890} ty={98} at={0.8} />,
    ]
  });
  // S4 modal
  Screen({
    at: 11.0, dur: 3.0, name: "s4", children: [
      <Sidebar active="Settings" />, SettingsHead, ...baseRows,
      <rect x={0} y={0} width={SW} height={SH} fill="#000000" opacity={0.45} />,
      <frame x={248} y={110} width={560} height={420} radius={20} background="#ffffff" layout="none" motion={pop(0.3)} shadow={{ x: 0, y: 20, blur: 50, color: "#000000" }}>
        <text x={36} y={32} width={480} fontFamily={SERIF} fontWeight={700} fontSize={32} color={INK}>Add custom connector</text>
        <text x={36} y={100} width={200} fontFamily={SANS} fontWeight={600} fontSize={18} color={MUTED}>Name</text>
        <frame x={36} y={128} width={488} height={56} radius={10} background="#F7F4EF" layout="none">
          <text x={16} y={14} width={440} fontFamily={SANS} fontWeight={600} fontSize={24} color={INK} at={0.2}
            motion={{ by: "character", from: { opacity: 0 }, duration: 0.6, overlap: 0.5, easing: "linear" }}>Higgsfield</text>
        </frame>
        <text x={36} y={204} width={300} fontFamily={SANS} fontWeight={600} fontSize={18} color={MUTED}>Remote MCP server URL</text>
        <frame x={36} y={232} width={488} height={56} radius={10} background="#F7F4EF" layout="none">
          <text x={16} y={15} width={460} fontFamily="JetBrains Mono" fontWeight={400} fontSize={22} color={INK} at={1.1}
            motion={{ by: "word", from: { opacity: 0, x: -20 }, duration: 0.2 }}>https://mcp.higgsfield.ai/mcp</text>
        </frame>
        <frame x={364} y={330} width={160} height={56} radius={12} background={CLAUDE} layout="none">
          <text x={0} y={14} width={160} align="center" fontFamily={SANS} fontWeight={700} fontSize={24} color="#ffffff">Connect</text>
        </frame>
      </frame>,
      <Arrow tx={740} ty={440} at={2.0} />,
    ]
  });
  // S5 connected
  Screen({
    at: 14.0, dur: 2.5, name: "s5", children: [
      <Sidebar active="Settings" />, SettingsHead,
      <ConnRow y={170} name="Higgsfield" color={HF} status="Connected" ok={true} at={0} />,
      <ConnRow y={246} name="Gmail" color="#EA4335" />,
      <ConnRow y={322} name="Google Drive" color="#1FA463" />,
      <frame x={560} y={400} width={400} height={110} radius={14} layout="none" at={0.3}
        motion={{ enter: { from: { scale: 2.2, opacity: 0, rotation: -14 }, duration: 0.28, easing: "ease-in" }, settle: { to: { rotation: -8 }, duration: 0.15 } }}>
        <rect x={0} y={0} width={400} height={110} radius={14} fill="#ffffff00" strokeColor={GREEN} strokeWidth={8} />
        <text x={0} y={26} width={400} align="center" fontFamily={SANS} fontWeight={900} fontSize={54} color={GREEN} letterSpacing={4}>CONNECTED</text>
      </frame>,
    ]
  });

  // S6 chat + photos + prompt
  const prompt = "Use Higgsfield to turn these 5 listing photos into a 30-second cinematic walkthrough, retouched HDR photos and 3 social reels for the agency.";
  Screen({
    at: 16.5, dur: 7.0, name: "s6", children: [
      <Sidebar active="New chat" />,
      <text x={230} y={90} width={826} align="center" fontFamily={SERIF} fontWeight={400} fontSize={46} color={INK}>Good afternoon</text>,
      <frame x={290} y={170} width={706} height={380} radius={22} background="#ffffff" layout="none" shadow={{ x: 0, y: 10, blur: 30, color: "#00000022" }}>
        {[0, 1, 2, 3, 4].map((k) => (
          <frame x={24 + k * 130} y={24} width={116} height={86} layout="none" at={0.5 + k * 0.12} motion={pop(0.3)}>
            <Photo x={0} y={0} w={116} h={86} tone={k} />
          </frame>
        ))}
        <text x={28} y={140} width={650} lineHeight={1.35} fontFamily={SANS} fontWeight={600} fontSize={27} color={INK} at={2.0}
          motion={{ by: "word", from: { opacity: 0 }, duration: 1.8, overlap: 0.9, easing: "linear" }}>{prompt}</text>
        <frame x={630} y={306} width={56} height={56} radius={14} background={CLAUDE} layout="none">
          {icon("arrow-up", { x: 12, y: 12, size: 32, color: "#ffffff", strokeWidth: 3 })}
        </frame>
      </frame>,
      <Arrow tx={940} ty={480} at={4.7} />,
      <frame x={360} y={570} width={560} height={50} radius={25} background="#F1ECE4" layout="none" at={5.4} motion={fadeUp(0.3)}>
        {icon("sparkles", { x: 18, y: 11, size: 28, color: CLAUDE, strokeWidth: 2.2 })}
        <text x={56} y={12} width={500} fontFamily={SANS} fontWeight={600} fontSize={22} color={INK}>Using Higgsfield · generating 9 assets…</text>
      </frame>,
    ]
  });

  // S7 results: walkthrough (Ken Burns through rooms)
  const rooms = ["Living room", "Kitchen", "Primary bedroom", "Bathroom"];
  Screen({
    at: 23.5, dur: 3.0, name: "s7", bg: "#000000", children: [
      ...rooms.map((r, k) => (
        <frame x={0} y={0} width={SW} height={SH} layout="none" at={k * 0.75} duration={k === 3 ? 0.75 : 0.9}
          animate={[{ property: "scale", from: 1.0, to: 1.12, duration: k === 3 ? 0.75 : 0.9, easing: "linear" }, { property: "opacity", from: 0, to: 1, duration: 0.15 }]}>
          <Photo x={0} y={0} w={SW} h={SH} tone={k} label={r} />
        </frame>
      )),
      <frame x={30} y={30} width={460} height={52} radius={26} background="#000000aa" layout="none">
        {icon("play", { x: 16, y: 12, size: 28, color: "#ffffff", strokeWidth: 2.4 })}
        <text x={54} y={12} width={400} fontFamily={SANS} fontWeight={700} fontSize={22} color="#ffffff">Cinematic walkthrough · 0:30</text>
      </frame>,
      <rect x={0} y={SH - 8} width={SW} height={8} fill={HF} animate={[{ property: "scaleX", from: 0, to: 1, duration: 3, easing: "linear" }]} />,
    ]
  });
  // S8 before / after
  Screen({
    at: 26.5, dur: 2.3, name: "s8", bg: "#111111", children: [
      <text x={60} y={36} width={460} align="center" fontFamily={SANS} fontWeight={900} fontSize={34} color="#bbbbbb">BEFORE</text>,
      <text x={536} y={36} width={460} align="center" fontFamily={SANS} fontWeight={900} fontSize={34} color={HF}>AFTER</text>,
      <frame x={60} y={100} width={460} height={440} radius={14} layout="none" clip={true} motion={fadeUp(0.3)}>
        <Photo x={0} y={0} w={460} h={440} tone={0} label="Phone photo" />
        <rect x={0} y={0} width={460} height={440} fill="#1a120a" opacity={0.55} />
      </frame>,
      <frame x={536} y={100} width={460} height={440} radius={14} layout="none" clip={true} reveal={{ from: "left", at: 0.4, duration: 0.7, easing: "house" }}>
        <Photo x={0} y={0} w={460} h={440} tone={4} label="Retouched HDR" />
      </frame>,
    ]
  });
  // S9 reels fan out of laptop
  Screen({ at: 28.8, dur: 2.6, name: "s9", bg: "#1a1410", children: [
    <text x={0} y={280} width={SW} align="center" fontFamily={SANS} fontWeight={900} fontSize={40} color="#ffffff55">Higgsfield · 9 assets ready</text>,
  ] });
  const phones = [-2, -1, 0, 1, 2];
  p.compose(
    <frame x={0} y={0} width={1920} height={1080} layout="none">
      {phones.map((k, i) => (
        <frame x={960 - 120 + k * 230} y={260} width={240} height={480} radius={34} background="#0d0d0d" layout="none" at={i * 0.08}
          motion={{ enter: { from: { y: 300, scale: 0.6, opacity: 0, rotation: 0 }, to: { rotation: k * 7 }, duration: 0.5, easing: [0.2, 0.9, 0.3, 1] } }}
          shadow={{ x: 0, y: 24, blur: 40, color: "#000000" }}>
          <frame x={10} y={10} width={220} height={460} radius={26} layout="none" clip={true}>
            <Photo x={0} y={0} w={220} h={460} tone={i} />
            <text x={14} y={392} width={192} fontFamily={SANS} fontWeight={900} fontSize={19} color="#ffffff">{["Just listed", "Home tour", "$899K", "Open house", "The kitchen"][i]}</text>
          </frame>
        </frame>
      ))}
      <frame x={760} y={770} width={400} height={64} radius={32} background={GREEN} layout="none" at={0.8} motion={pop(0.3)}>
        {icon("check", { x: 24, y: 16, size: 32, color: "#ffffff", strokeWidth: 3 })}
        <text x={68} y={15} width={320} fontFamily={SANS} fontWeight={900} fontSize={28} color="#ffffff">Ready to post</text>
      </frame>
    </frame>,
    { at: 29.0, dur: 2.6, name: "phones" }
  );

  // ---------- money beat ----------
  const Invoice = ({ y, who, amt, at }) => (
    <frame x={560} y={y} width={800} height={130} radius={22} background={CREAM} layout="none" at={at}
      motion={{ enter: { from: { x: 300, opacity: 0, rotation: 4 }, duration: 0.4, easing: "house" } }} shadow={{ x: 0, y: 16, blur: 40, color: "#000000" }}>
      <frame x={28} y={33} width={64} height={64} radius={32} background={GREEN} layout="none">{icon("check", { x: 14, y: 14, size: 36, color: "#ffffff", strokeWidth: 3.2 })}</frame>
      <text x={116} y={30} width={420} fontFamily={SANS} fontWeight={700} fontSize={30} color={INK}>{who}</text>
      <text x={116} y={76} width={420} fontFamily={SANS} fontWeight={600} fontSize={22} color={MUTED}>Invoice paid · listing package</text>
      <text x={500} y={36} width={270} align="right" fontFamily={SANS} fontWeight={900} fontSize={52} color={INK}>{amt}</text>
    </frame>
  );
  p.compose(
    <frame x={0} y={0} width={1920} height={1080} layout="none">
      <Invoice y={180} who="Maple & Co. Realty" amt="$500" at={0} />
      <Invoice y={340} who="Harbor Homes" amt="$750" at={0.5} />
      <Invoice y={500} who="Summit Group" amt="$1,200" at={1.0} />
      <frame x={560} y={680} width={800} height={110} layout="none" at={1.6} motion={pop(0.4)}>
        <frame name="Total" x={0} y={0} width={800} height={110} layout="none"
          motion={{ timeline: { duration: 1.2, easing: "ease-out", targets: [{ target: "Val", counter: { from: 0, to: 2450, prefix: "$", suffix: " this week" } }] } }}>
          <frame name="Val" x={0} y={0} width={800} height={110} layout="none">
            <text x={0} y={10} width={800} align="center" fontFamily={SANS} fontWeight={900} fontSize={84} color={GOLD}>$0 this week</text>
          </frame>
        </frame>
      </frame>
    </frame>,
    { at: 31.8, dur: 4.2, name: "money" }
  );

  // ---------- CTA ----------
  p.compose(
    <frame x={0} y={0} width={1920} height={1080} layout="none">
      <frame x={360} y={150} width={1200} height={150} radius={28} background="#000000" layout="none" motion={pop(0.4)}>
        <text x={0} y={22} width={590} align="right" fontFamily={SANS} fontWeight={900} fontSize={96} color="#ffffff">Comment</text>
        <text x={620} y={22} width={560} align="left" fontFamily={SANS} fontWeight={900} fontSize={96} color={GOLD}>"LISTING"</text>
      </frame>
      <path x={900} y={330} width={120} height={200} d="M60 0 L60 160 M60 160 L20 115 M60 160 L100 115" stroke={{ width: 16, color: RED, cap: "round" }}
        animate={[{ property: "offsetY", keyframes: [{ at: 0, value: 0 }, { at: 0.4, value: 24 }, { at: 0.8, value: 0 }], repeat: 6 }]} />
      <frame x={560} y={560} width={800} height={110} radius={22} background={CREAM} layout="none" at={0.6} motion={fadeUp(0.35)}>
        {icon("send", { x: 30, y: 31, size: 48, color: CLAUDE, strokeWidth: 2.4 })}
        <text x={100} y={30} width={680} fontFamily={SANS} fontWeight={700} fontSize={40} color={INK}>I'll DM you the exact prompt</text>
      </frame>
      <frame x={560} y={690} width={800} height={110} radius={22} background="#1d140e" layout="none" at={2.9} motion={fadeUp(0.35)}>
        {icon("share", { x: 30, y: 31, size: 48, color: GOLD, strokeWidth: 2.4 })}
        <text x={100} y={30} width={680} fontFamily={SANS} fontWeight={700} fontSize={40} color="#ffffff">Tag a friend who needs this</text>
      </frame>
    </frame>,
    { at: 36.0, dur: 5.0, name: "cta" }
  );

  await p.frame(10.5, "renders/chk.png");
  const r = await p.render("renders/final.mp4");
  console.log("RENDER", JSON.stringify(r));
};
