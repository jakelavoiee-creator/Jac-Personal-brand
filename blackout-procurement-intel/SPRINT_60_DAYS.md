# 60-Day Contract Sprint: 13 Nov 2026 → 12 Jan 2027

**Goal:** at least one paid public-sector purchase order (or a government-funded order) by 12 Jan 2027.
**Realistic size:** $5K–$50K. A brand-new supplier with no references wins small, fast and close to the rules' fast lanes first. The big contracts come after the first reference.

---

## Where the openings are

These are legal fast lanes written into procurement rules: exceptions and deadlines where buyers can move quickly and few suppliers are ready. Most new companies miss them because they aren't pre-positioned.

| # | Opening | Why it moves fast | Window | Evidence |
|---|---|---|---|---|
| 1 | **Ontario Community Emergency Preparedness Grant, Round 4 recipients** | About $5M split into $5K–$50K grants for small and medium communities. Recipients must buy equipment, usually within the fiscal year ending **31 Mar 2027** (VERIFY in the 2026-27 guideline). Past recipients bought generators, cots, blankets and food kits for warming centres. | Applications closed 7 Oct 2026; approvals likely Dec–Feb | ontario.ca CEPG page; 2026-27 guideline PDF; data.ontario.ca grant records |
| 2 | **Small-value direct purchases** | Federal: goods under **$25,000** can be bought without competition (Government Contracts Regulations s.6; VERIFY current text). Quebec municipalities: below the public-tender threshold (was $133,800; changed 1 Jan 2026, VERIFY) they can buy by invitation or gré à gré under the new **LCOM** (in force 1 Apr 2026). | Any day | GCR s.6; LCOM (Osler/Blakes summaries) |
| 3 | **Federal fiscal year-end (Jan–Mar)** | Departments spend remaining budget before 31 March, often in small buys. Remote-site departments (ISC, Parks Canada, Coast Guard, RCMP detachments) need outage gear. | Jan → 31 Mar | Normal federal budget cycle |
| 4 | **Declared emergencies** | Both federal rules ("pressing emergency in which delay would be injurious to the public interest") and municipal rules (force majeure) allow immediate purchases. **Buyers call the supplier they already know who can deliver in 48 hours.** | Ice-storm season: Dec–Apr | GCR s.6(a); municipal force-majeure provisions |
| 5 | **Grid-stressed jurisdictions this winter** | Yukon officials warned of possible rotating blackouts in Whitehorse (Jan 2026); the emergency protocol moves public buildings to backup power and opens warming shelters. | Now → Mar 2027 | yukon.ca news releases |
| 6 | **City of Ottawa Extreme Weather Preparedness Grant** | Up to $50K a year per community group; mobile generators and power stations are named as eligible. | Each intake | engage.ottawa.ca |
| 7 | **Live small tenders** | Bid on anything small that fits, even slightly off-thesis, to earn the first reference. | Daily | `tender_scan.py` + SEAO / bids&tenders alerts |

### Not cracks: these end the company

- **Splitting one need into several small orders** to stay under a threshold (*fractionnement*). Illegal in Quebec municipal law and a breach of federal policy.
- Asking officials for non-public information, or offering anything of value.
- Unregistered lobbying of Quebec municipal officials (VERIFY whether registration with the Commissaire au lobbyisme applies before calls that solicit a contract).
- Selling to an Indigenous set-aside without genuine Indigenous ownership and control.
- **Why it matters for speed:** under Canada's Ineligibility and Suspension Policy, a single violation can ban a supplier from federal contracts. A ban is the slowest outcome there is.

---

## Week-by-week

**Week 1 (13–20 Nov): be buyable**
- [ ] Business registered (NEQ in Quebec and/or Ontario BIN); GST/HST and QST numbers.
- [ ] Supplier accounts: CanadaBuys (SAP Ariba), SEAO, bids&tenders, Biddingo, MERX. Saved-search alerts using the keyword list in `tender_scan.py`.
- [ ] General and product liability insurance quote ($2M is the usual municipal minimum: VERIFY).
- [ ] **Two distributor commitments in writing:** wholesale price, stock on hand, **48-hour ship from Canadian stock**, drop-ship, Net-30. This is what makes opening #4 work.
- [ ] Bilingual one-page catalogue with 3 fixed-price kits:
  - **S** about $3,900 (1 power station, lights, charging bar, CO alarms)
  - **M** about $9,500 (see REPORT.md, G01)
  - **L** about $24,000 (multi-room centre)

  All prices are pending supplier quotes.

**Weeks 2–3 (20 Nov–4 Dec): fill the pipeline**
- [ ] Pull the CEPG recipient lists for previous rounds from data.ontario.ca. Previous recipients are likely Round 4 applicants. List 40 small municipalities and First Nations with their Community Emergency Management Coordinators (CEMCs).
- [ ] Call each CEMC. The message: *"If your CEPG equipment is approved, here is a fixed quote you can use, delivered in 2 weeks, and we'll write the load plan for your warming centre."*
- [ ] Quebec: call 15 municipal civil-security coordinators *before* the December budget meetings. Offer a quote under the gré à gré limit for one centre.
- [ ] Yukon: Whitehorse emergency management and 5 rural Yukon communities about warming-shelter power.

**Weeks 3–6 (4 Dec–1 Jan): be on the emergency list**
- [ ] Ask every coordinator you talk to to put you on their emergency supplier contact list, with a 24/7 number and a stock commitment. This is the legitimate way into emergency purchases.
- [ ] Send a "storm-ready" email the moment Environment Canada issues freezing-rain or winter-storm warnings for a region where you have contacts.
- [ ] Bid on every small matching tender the scanner finds.

**Weeks 6–9 (2–12 Jan): close**
- [ ] Federal year-end: send the catalogue to regional procurement contacts at ISC, Parks Canada, the Coast Guard and the RCMP (buys under $25K).
- [ ] Follow up on CEPG approvals; turn quotes into POs.
- [ ] Deliver the first order on time and get a written reference.

---

## Pipeline math (assumptions, not forecasts)

60 conversations → 15 quotes → 2–4 POs → **$15K–$60K in first orders** at 30–40% gross margin.
**Kill or adjust signal:** fewer than 5 quotes requested by 15 Dec means changing the offer, not adding more calls.

## Cash needed

About $3K–$8K: registration, insurance deposit, one demo S-kit. Inventory is ordered only after a PO. **Check that the distributor's payment terms are longer than the buyer's payment time.** Municipalities usually pay in 30–60 days; if the distributor wants payment in 30, you carry the gap.

## A note on the macro view

This sprint does not depend on a banking crisis or a global blackout. Winter outages in Canada happen every year, and the grants and fiscal year-ends above are on fixed calendars. If there is wider instability, the same preparation (48-hour stock commitments and a place on emergency supplier lists) is how you capture it. One practical point if banks are a concern: hold operating cash in a federally insured account under the CDIC limit, and don't depend on a single bank for supplier payments.
