---
url: https://www.youtube.com/watch?v=CGjPQmC6ttY
video_id: CGjPQmC6ttY
title: I Used A Screenshot and Claude Code to Build A New Shopify Theme
channel: BitBranding
why_studied: playlist 6/13
watched_by: gemini-3.6-flash
studied_at: 2026-10-27 02:06 UTC
---

## Title & channel
- **Channel**: BitBranding [[00:38](https://youtu.be/S4qP2-v1E_o?t=38), [19:50](https://youtu.be/S4qP2-v1E_o?t=1190)]
- **Presenter**: Christian Piñón (Co-Founder, BitBranding) [[00:38](https://youtu.be/S4qP2-v1E_o?t=38)]
- **Video Title / Topic**: Recreating a luxury streetwear Shopify store theme (Represent brand aesthetic) using Claude AI (Claude Design & Claude Code via Shopify MCP Connectors).

---

## One-line thesis
Integrating Anthropic’s Claude Design and Claude Code with Shopify via Model Context Protocol (MCP) connectors allows brands to visually prototype and build custom, responsive Shopify themes from screenshots in hours rather than 4–6 weeks at $15k–$50k agency rates [[00:09](https://youtu.be/S4qP2-v1E_o?t=9), [00:33](https://youtu.be/S4qP2-v1E_o?t=33), [01:13](https://youtu.be/S4qP2-v1E_o?t=73), [17:27](https://youtu.be/S4qP2-v1E_o?t=1047)].

---

## Method (ordered, step by step)

1. **Setup Shopify MCP Connector in Claude Desktop** [[02:06](https://youtu.be/S4qP2-v1E_o?t=126) – [03:25](https://youtu.be/S4qP2-v1E_o?t=205)]
   - Open the Claude Desktop App. Navigate to **Code / Customization** -> **Connectors** -> **Browse Connectors Directory** -> Select **Shopify** [[02:32](https://youtu.be/S4qP2-v1E_o?t=152)].
   - Authenticate your store domain (`represent-claude.myshopify.com`) and install the `Shopify Claude Connector App` in your Shopify Admin [[02:44](https://youtu.be/S4qP2-v1E_o?t=164) – [03:14](https://youtu.be/S4qP2-v1E_o?t=194)].
   - Set permissions for interactive tools to "Always allow" to permit Claude to read/write backend store data [[03:22](https://youtu.be/S4qP2-v1E_o?t=202)].

2. **Verify API Connection via Claude Code** [[03:33](https://youtu.be/S4qP2-v1E_o?t=213) – [04:25](https://youtu.be/S4qP2-v1E_o?t=265)]
   - Run prompt in Claude Code: `"Get list of themes in my shop"` [[03:38](https://youtu.be/S4qP2-v1E_o?t=218)].
   - Confirm output lists store themes (e.g., `Test data`, `Horizon`, `Default vintage theme`) directly pulled via Shopify Admin GraphQL API [[03:54](https://youtu.be/S4qP2-v1E_o?t=234)].

3. **Run Single-Section Code Test (Trust Badges)** [[04:48](https://youtu.be/S4qP2-v1E_o?t=288) – [06:50](https://youtu.be/S4qP2-v1E_o?t=410)]
   - Publish target test theme (`Horizon`) in Shopify Admin [[05:48](https://youtu.be/S4qP2-v1E_o?t=348)].
   - Input prompt to generate a section: `"on the Horizon theme, on the Homepage add a 3 column section with shipping, returns, and secure payment options with an icon for each column"` [[04:59](https://youtu.be/S4qP2-v1E_o?t=299)].
   - Inspect output in Shopify Theme Customizer: confirm `Trust Badges` section appears with editable color schemes, width settings, and mobile vertical stacking [[06:07](https://youtu.be/S4qP2-v1E_o?t=367) – [06:41](https://youtu.be/S4qP2-v1E_o?t=401)].

4. **Replicate Homepage Layout from Screenshot via Claude Code** [[07:13](https://youtu.be/S4qP2-v1E_o?t=433) – [09:17](https://youtu.be/S4qP2-v1E_o?t=557)]
   - Take a full-page screenshot of the target brand homepage (`representclo.com`) [[07:17](https://youtu.be/S4qP2-v1E_o?t=437)].
   - Upload screenshot to Claude Code with prompt: `"we want to redesign the homepage to match the layout of Represent. Screenshot attached."` [[07:39](https://youtu.be/S4qP2-v1E_o?t=459)].
   - Respond to Claude’s interactive clarifying questions:
     - Featured collections: Select `All New Arrivals`, `Hoodies`, `T-Shirts`, `Bottoms` [[07:52](https://youtu.be/S4qP2-v1E_o?t=472)].
     - Hero/Product section pairs: `4 pairs` [[08:00](https://youtu.be/S4qP2-v1E_o?t=480)].
     - Trust Badges section: `No, remove it` [[08:05](https://youtu.be/S4qP2-v1E_o?t=485)].
   - Claude Code automatically creates missing collections in the Shopify backend via API and writes 8 alternating hero/product-grid sections into `index.json` (~8 minute build time) [[08:19](https://youtu.be/S4qP2-v1E_o?t=499) – [08:34](https://youtu.be/S4qP2-v1E_o?t=514)].

5. **Replicate Footer & Auto-Create Backend Navigation/Pages** [[09:39](https://youtu.be/S4qP2-v1E_o?t=579) – [11:37](https://youtu.be/S4qP2-v1E_o?t=697)]
   - Capture screenshot of target footer [[09:42](https://youtu.be/S4qP2-v1E_o?t=582)].
   - Prompt: `"I want to mimic this footer as close as possible. [...] keep the floating chat button out on the corner. If the pages are not existing please create them on the backend."` [[09:51](https://youtu.be/S4qP2-v1E_o?t=591) – [10:06](https://youtu.be/S4qP2-v1E_o?t=606)].
   - Claude Code creates 18+ missing store pages (e.g., *About, Careers, Contact, Press, Shipping, Returns, Terms & Conditions, Student Discount*) and configures menu structures automatically (~15 minute build time) [[10:35](https://youtu.be/S4qP2-v1E_o?t=635) – [10:48](https://youtu.be/S4qP2-v1E_o?t=648)].

6. **Visual Prototyping Workflow via Claude Design -> Claude Code Handoff** [[12:11](https://youtu.be/S4qP2-v1E_o?t=731) – [17:09](https://youtu.be/S4qP2-v1E_o?t=1029)]
   - Open Claude Design (`claude.ai/design`) in browser [[12:26](https://youtu.be/S4qP2-v1E_o?t=746)].
   - Input structured visual prompt + screenshot to build an interactive canvas UI preview [[12:29](https://youtu.be/S4qP2-v1E_o?t=749) – [13:13](https://youtu.be/S4qP2-v1E_o?t=793)].
   - Click **Share** -> **Export as ZIP** (`represent-homepage.zip`) containing `homepage.html`, `components/`, and `styles/` [[13:40](https://youtu.be/S4qP2-v1E_o?t=820), [15:03](https://youtu.be/S4qP2-v1E_o?t=903)].
   - Upload ZIP files directly into Claude Code terminal session [[15:15](https://youtu.be/S4qP2-v1E_o?t=915)].
   - Prompt Claude Code to process handoff: `"Pass go ahead and attach the ZIP file. Redo your last homepage V2 or v3 implementation on Represent v2 theme."` [[15:15](https://youtu.be/S4qP2-v1E_o?t=915)].
   - Claude Code compiles the ZIP into a single, fully customizable Liquid section (`Represent Homepage`) with complete schema controls in the Shopify Theme Editor (~20 minute build time) [[15:28](https://youtu.be/S4qP2-v1E_o?t=928) – [16:20](https://youtu.be/S4qP2-v1E_o?t=980)].

---

## Meta ads specifics
- Account structure, campaign objective, budgets, bidding, targeting, placements, testing cadence, scaling rules, kill rules, attribution: **none shown**.

---

## Creative specifics
- **Visual Style & Aesthetics**: Dark grey/black luxury streetwear minimalism inspired by Represent [[00:01](https://youtu.be/S4qP2-v1E_o?t=1), [12:30](https://youtu.be/S4qP2-v1E_o?t=750)]. High-contrast product imagery on clean background slates [[00:02](https://youtu.be/S4qP2-v1E_o?t=2)].
- **Mobile Responsive Design**: Ensure all multi-column grids (e.g., 3-column trust badges or 4-product grids) automatically stack vertically on mobile device previews [[06:41](https://youtu.be/S4qP2-v1E_o?t=401)].
- Additional Meta creative ad specs: **none shown**.

---

## Claude / AI workflow (skills, prompts, connectors, data inputs, outputs — quote prompts verbatim where shown)

### AI Tools Used
- **Claude Desktop App & Claude Code Terminal** [[01:38](https://youtu.be/S4qP2-v1E_o?t=98), [02:29](https://youtu.be/S4qP2-v1E_o?t=149)]
- **Claude Design** (`claude.ai/design`) [[01:19](https://youtu.be/S4qP2-v1E_o?t=79), [12:26](https://youtu.be/S4qP2-v1E_o?t=746)]
- **Model**: Claude 3.5 Sonnet / Sonnet 4.6 Hi [[05:55](https://youtu.be/S4qP2-v1E_o?t=355)]
- **Integration**: Shopify AI Toolkit via MCP Connectors [[02:06](https://youtu.be/S4qP2-v1E_o?t=126)]
- **Store Connected**: `represent-claude.myshopify.com` [[04:04](https://youtu.be/S4qP2-v1E_o?t=244)]

### Data Inputs
- Store themes: `Test data`, `Horizon`, `Default vintage theme` [[03:54](https://youtu.be/S4qP2-v1E_o?t=234)].
- Screenshots: `Screenshot.png` (Represent Homepage) [[07:39](https://youtu.be/S4qP2-v1E_o?t=459)], Footer Screenshot [[09:42](https://youtu.be/S4qP2-v1E_o?t=582)].
- Files: `represent-homepage.zip` (exported from Claude Design) [[15:03](https://youtu.be/S4qP2-v1E_o?t=903)].

### Verbatim Prompts
1. **Theme Verification Prompt** [[03:38](https://youtu.be/S4qP2-v1E_o?t=218)]:
   > `"Get list of themes in my shop"`

2. **Section Generation Prompt (Trust Badges)** [[04:59](https://youtu.be/S4qP2-v1E_o?t=299)]:
   > `"on the Horizon theme, on the Homepage add a 3 column section with shipping, returns, and secure payment options with an icon for each column"`

3. **Homepage Redesign Prompt** [[07:39](https://youtu.be/S4qP2-v1E_o?t=459)]:
   > `"we want to redesign the homepage to match the layout of Represent. Screenshot attached."`

4. **Footer Replication Prompt** [[09:51](https://youtu.be/S4qP2-v1E_o?t=591) – [10:06](https://youtu.be/S4qP2-v1E_o?t=606)]:
   > `"I want to mimic this footer as close as possible. [...] keep the floating chat button out on the corner. If the pages are not existing please create them on the backend."`

5. **Claude Design Handoff Command** [[14:03](https://youtu.be/S4qP2-v1E_o?t=843)]:
   > `"Fetch this design file, read its contents, and implement the relevant aspects of the design (https://claude.ai/...): implement: Homepage.html"`

6. **ZIP Upload Command in Claude Code** [[15:15](https://youtu.be/S4qP2-v1E_o?t=915)]:
   > `"Pass go ahead and attach the ZIP file. Redo your last homepage V2 or v3 implementation on Represent v2 theme."`

---

## Offer, product, landing page & Shopify CRO

- **Hero Banner**: Full-width, edge-to-edge campaign image with left-aligned headline typography and single CTA button [[00:03](https://youtu.be/S4qP2-v1E_o?t=3), [08:22](https://youtu.be/S4qP2-v1E_o?t=502)].
- **Trust Badges Section**: 3-column trust builder placed directly below hero banner featuring *Free Shipping (orders over $50)*, *Easy Returns (30-day policy)*, and *Secure Payment* [[05:00](https://youtu.be/S4qP2-v1E_o?t=300), [06:10](https://youtu.be/S4qP2-v1E_o?t=370)].
- **Alternating Collection Layout**: Sequential Hero Banner + 4-Product Grid pairs for core categories (*New Arrivals, Hoodies, T-Shirts, Bottoms*) [[08:22](https://youtu.be/S4qP2-v1E_o?t=502), [16:15](https://youtu.be/S4qP2-v1E_o?t=975)].
- **Footer Architecture**:
  - Multi-column navigation grid containing Loyalty (*Join Prestige*), Client Services (*Live Chat, Support Hub, Track Order, Make a Return, Store Locator, Student Discount*), Company (*About, Careers, Press, Shipping, Returns*), Social links (*Instagram, Facebook, TikTok, YouTube*), Country/Currency selector, App download link, and a corner floating chat widget [[10:45](https://youtu.be/S4qP2-v1E_o?t=645), [15:43](https://youtu.be/S4qP2-v1E_o?t=943)].
  - Automatic creation of 18 legal/navigational backend pages to eliminate broken links [[10:45](https://youtu.be/S4qP2-v1E_o?t=645)].

---

## Metrics & benchmarks quoted (with numbers)

- **Agency Custom Theme Build Cost**: $40,000 – $50,000+ [[00:09](https://youtu.be/S4qP2-v1E_o?t=9)] or $15,000 – $50,000 [[17:27](https://youtu.be/S4qP2-v1E_o?t=1047)].
- **Standard Agency Build Timeline**: 4 to 6 weeks [[00:33](https://youtu.be/S4qP2-v1E_o?t=33)].
- **AI Theme Build Timeline**: A few hours / single session [[00:36](https://youtu.be/S4qP2-v1E_o?t=36), [00:57](https://youtu.be/S4qP2-v1E_o?t=57)].
- **BitBranding Portfolio Experience**: 800+ clothing brands served [[00:45](https://youtu.be/S4qP2-v1E_o?t=45)].
- **Claude Code Homepage Section Execution Time**: ~8 minutes [[08:23](https://youtu.be/S4qP2-v1E_o?t=503)].
- **Claude Code Footer & Navigation Execution Time**: ~15 minutes [[10:39](https://youtu.be/S4qP2-v1E_o?t=639)].
- **Claude Code ZIP Handoff Theme Processing Time**: ~20 minutes [[15:28](https://youtu.be/S4qP2-v1E_o?t=928)].
- **Backend Pages Auto-Generated by Claude**: 18+ store pages [[10:45](https://youtu.be/S4qP2-v1E_o?t=645)].

---

## Mistakes / warnings called out

1. **Do NOT Directly Clone and Ship Competitor Websites**: Cloning another brand’s design word-for-word makes your brand look generic and exposes you to legal action/lawsuits [[04:31](https://youtu.be/S4qP2-v1E_o?t=271) – [04:38](https://youtu.be/S4qP2-v1E_o?t=278)].
   - *Fix*: Study competitor structure, spacing, typography, and hierarchy, then apply your brand’s unique assets and positioning [[04:41](https://youtu.be/S4qP2-v1E_o?t=281)].
2. **Never Let AI Scripts Edit Live Production Themes**: Writing code directly to an active theme via MCP can cause broken liquid schemas or require manual theme publishing [[05:10](https://youtu.be/S4qP2-v1E_o?t=310) – [05:40](https://youtu.be/S4qP2-v1E_o?t=340)].
   - *Fix*: Duplicate your primary theme (e.g., `Horizon V2` / `Horizon V3`) and test changes on a draft copy [[05:28](https://youtu.be/S4qP2-v1E_o?t=328), [14:28](https://youtu.be/S4qP2-v1E_o?t=868)].
3. **Avoid Relying Solely on Terminal Tools (Claude Code) for UI**: Pure code prompt loops lack real-time visual feedback, requiring tedious cycles of re-prompting and page refreshes [[10:53](https://youtu.be/S4qP2-v1E_o?t=653) – [11:40](https://youtu.be/S4qP2-v1E_o?t=700)].
   - *Fix*: Prototype visually in Claude Design (`claude.ai/design`) first, then export the validated ZIP into Claude Code [[11:48](https://youtu.be/S4qP2-v1E_o?t=708), [16:34](https://youtu.be/S4qP2-v1E_o?t=994)].

---

## Claims vs. evidence

- **Claim**: Claude AI can compress a $40k–$50k custom theme build into hours from a screenshot [[00:09](https://youtu.be/S4qP2-v1E_o?t=9), [00:26](https://youtu.be/S4qP2-v1E_o?t=26)].
  - **Evidence shown**: Presenter connects Shopify MCP, uploads a screenshot of `representclo.com`, and Claude generates Liquid code, populates 4 collections, creates 18 backend pages, and builds custom theme customizer controls on screen [[03:54](https://youtu.be/S4qP2-v1E_o?t=234) – [16:20](https://youtu.be/S4qP2-v1E_o?t=980)].
- **Claim**: Claude Code can construct complete backend pages and menus without manual setup [[10:06](https://youtu.be/S4qP2-v1E_o?t=606)].
  - **Evidence shown**: Shopify Theme Customizer and Admin menus confirm 18 newly generated store pages (*About, Careers, Contact, Shipping, Returns, etc.*) and populated navigation menus [[10:38](https://youtu.be/S4qP2-v1E_o?t=638) – [11:30](https://youtu.be/S4qP2-v1E_o?t=690)].
- **Claim**: Exporting a Claude Design ZIP into Claude Code creates editable Shopify customizer controls [[13:40](https://youtu.be/S4qP2-v1E_o?t=820), [15:57](https://youtu.be/S4qP2-v1E_o?t=957)].
  - **Evidence shown**: Shopify Theme Customizer displays a new `Represent Homepage` section with editable fields for images, headline text, collection selectors, and campaign blocks [[15:42](https://youtu.be/S4qP2-v1E_o?t=942) – [16:20](https://youtu.be/S4qP2-v1E_o?t=980)].

---

## Top 5 takeaways for a clothing brand media buyer

1. **Reduce Structural Theme Costs to Zero**: Replace $15k–$50k initial custom Liquid builds with Claude Design + Claude Code workflows to construct custom Shopify theme infrastructure in a single afternoon [[00:09](https://youtu.be/S4qP2-v1E_o?t=9), [17:27](https://youtu.be/S4qP2-v1E_o?t=1047)].
2. **Reallocate Savings to Core Revenue Drivers**: Shift saved web development capital directly into ad spend, creative/photography production, brand strategy, and conversion rate testing [[17:36](https://youtu.be/S4qP2-v1E_o?t=1056)].
3. **Adopt a Visual-First Handoff Workflow**: Use Claude Design to visually model site changes alongside your creative team before exporting ZIP packages to Claude Code for backend Shopify Liquid compilation [[12:26](https://youtu.be/S4qP2-v1E_o?t=746), [16:34](https://youtu.be/S4qP2-v1E_o?t=994)].
4. **Isolate AI Code Execution on Draft Themes**: Always test MCP prompt scripts on duplicate/draft themes (e.g., `Horizon V2`) to protect your live conversion flow from liquid errors [[05:28](https://youtu.be/S4qP2-v1E_o?t=328), [14:28](https://youtu.be/S4qP2-v1E_o?t=868)].
5. **Study Industry Winners for CRO Layouts**: Extract layout hierarchy, mobile vertical stacking, and navigation depth from top streetwear brands (e.g., Represent) while populating the site with your own brand’s imagery and messaging [[04:31](https://youtu.be/S4qP2-v1E_o?t=271) – [04:45](https://youtu.be/S4qP2-v1E_o?t=285)].
