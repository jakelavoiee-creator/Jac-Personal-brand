# Canadian Blackout Procurement Intelligence: First Hunt

**Prepared:** 13 Nov 2026 · **Status:** Stage 1 (Intelligence), first pass
**Companion files:** `database.csv` (scored opportunity database), `build_database.py` (source of truth: edit, then re-run)

> **How to read the numbers.** Every price, margin and contract value is a **pre-quote estimate**. It is a hypothesis to test with suppliers and buyers, not a fact. Items marked **VERIFY** were not confirmed in primary sources during this pass. Financing has **not** been confirmed for anything.

---

## The answer in one paragraph

The whales are well dug in where government **buys hardware as capital**: standby gensets, hospital power, the PSPC portable-generator standing offer (two slots per stream), PPE. The white space is **outage endurance at the edges of the system**: the shelters, small-town service centres, housing blocks, seniors' residences and remote communities that are **required or expected** to keep working without power, but that **have no standard product, no technical buyer and no specialist supplier**. The strongest entry point is Quebec. A provincial regulation already requires every local municipality (1,108 of them) to be able to cope with a power interruption at its designated service and shelter centres. Most of those municipalities are too small to employ anyone who can specify a solution. That is a mandated need, fragmented across a thousand small buyers, below public-tender thresholds, and requiring French documentation. No large contractor is built to serve that.

**North star for the company:** *"The outage-endurance specialist for the places government is required to keep open."*

---

## 1. Blackout dependency map

What fails, and when. Each row is a requirement government already carries.

| Window | What has failed | Human impact | Government operations impact |
|---|---|---|---|
| **0–6 h** | Lighting, elevators, electric heat/AC, card-access doors, Wi-Fi and VoIP, refrigeration starts warming, traffic signals | People trapped in high-rises; dark stairwells; medical-device users on internal batteries | EOCs open; standby gensets start (or fail to transfer: Halifax Water 2024 and 2025) |
| **6–24 h** | **Cell-site backup batteries drain**; phone and laptop batteries die; water pressure drops in buildings with booster pumps; food spoils | Can't call 911 or reach family; home oxygen users run out of battery; first CO poisonings from indoor generators and heaters | Comfort and warming centres open, often without confirmed backup power; outage maps and alerts unreliable |
| **24–72 h** | Gensets need **fuel**; undersized gensets trip; pipes freeze in winter; lift stations overflow | Seniors and disabled tenants stranded on upper floors; mass charging demand; sanitation fails | Shelters need cots, food, charging, lighting and heat at scale; generator fuel and maintenance strain (NS public housing after Fiona) |
| **3–7 days** | Fuel logistics, staff fatigue, supply-chain stockouts | Medical deterioration in seniors' residences (6+ days in parts of Quebec in April 2023); CO deaths | Provinces call on federal help; NESS social-services stock; Red Cross deployment; recovery logistics |

**The pattern:** government plans for *hardware that switches on*. It plans much less for *endurance*: hour 24 to hour 168, fuel, load matching, charging, communications and the vulnerable people who are not in a hospital.

---

## 2. The 20 most mission-critical requirements, and how well government procures them

Coverage: **Strong** = established contracts or standing offers; **Partial** = bought but inconsistent or fragmented; **Weak** = acknowledged need, little procurement found.

| # | Requirement | Main buyer | Procurement coverage | Evidence | Opportunity? |
|---|---|---|---|---|---|
| 1 | Hospital emergency power | Health authorities | **Strong** (code-mandated) | CSA C282/Z32 | No: regulated whale game |
| 2 | LTC home backup power (Ontario) | Operators / province | **Strong** (generator within 3 h) | Globe and Mail; O. Reg. 246/22 | No |
| 3 | **Seniors' residence backup power (Quebec RPAs)** | Private operators, MSSS | **Weak**: 47% have no generator; not required | Radio-Canada/MSSS data 2023 | **Yes (G05)** |
| 4 | **Power at municipal service and shelter centres** | 1,108 Quebec municipalities; all provinces | **Weak/Partial**: legally required in Quebec, no standard product | RLRQ S-2.4 r.1; Fiona comfort centres | **Yes (G01)** |
| 5 | Portable generators (federal) | PSPC / departments | **Strong**: NMSO, 2 slots per stream | PSPC N6115 NMSO | No: whale game |
| 6 | **Generator readiness: fuel, maintenance, sizing** | Housing, municipalities | **Partial**: maintenance bought, endurance not | NS housing post-Fiona | **Yes (G02, G10)** |
| 7 | **Water/wastewater transfer resilience** | Water utilities | **Partial**: gensets exist, transfers fail | Halifax Water 2024 and 2025 | **Yes (G08)** |
| 8 | **High-rise elevator and egress power** | Social housing, landlords | **Weak**: Ontario mandate (Bill 47) defeated | Ottawa derecho coverage | **Yes (G02)** |
| 9 | **Shelter and EOC communications continuity** | Municipal EM, provinces | **Partial**: big cities only; Starlink dependence | CRTC Rogers review; Starlink reconsideration 2025 | **Yes (G07)** |
| 10 | **Public device charging at scale** | Comfort centres | **Weak**: improvised power bars | Fiona comfort centres offered charging | **Yes (inside G01)** |
| 11 | Emergency area lighting in shelters | Municipalities | **Partial** | Fiona / derecho | Inside G01 |
| 12 | **CO poisoning prevention** | Public health, fire services | **Partial**: alarm giveaways, no outage bundle | CO deaths 2013, 2017, 2023 | **Wedge (G06)** |
| 13 | **Electricity-dependent residents at home** (oxygen, CPAP, lifts) | Health authorities | **Weak**: no registry found; utilities can't identify them | Hydro-Québec: RPAs "not easily identifiable" | Long-term (policy) |
| 14 | Cots, blankets, reception-centre kits | NESS, provinces, Red Cross | **Partial**: NESS holds stock; audits critical | NESS evaluation; OAG 2021 | Subcontract only (G09) |
| 15 | Emergency food and water distribution | Provinces, Red Cross | **Partial** | Red Cross HWF agreement ($52.5M, 2023–26) | Monitor |
| 16 | **Remote First Nations preparedness** | ISC, band councils | **Weak**: 3.5x more spent on response than preparedness | OAG 2022 Report 8; OAG 2025 | **Yes (G03)** |
| 17 | Warming and cooling for vulnerable people | Municipalities | **Partial** | Toronto warming-centre capacity | Inside G01 |
| 18 | Community-level (non-profit) preparedness | Municipal and utility grants | **New money, no supplier** | Ottawa $1M grant (2026); Hydro One; ACOA | **Yes (G04)** |
| 19 | Generator fuel supply, days 2–7 | All | **Partial**: shortages reported | NS Fiona | C-tier (G10) |
| 20 | Cell-site power | Carriers (private) | Private; MOU on roaming, no backup-power mandate found | CRTC/ISED TRA, 2022 MOU | Not government procurement |

**Signal versus opportunity.** Items 1, 2 and 5 are well bought, so we stay out. Items 3, 4, 8, 10, 13, 16 and 18 are where government's own documents say "required" or "important" and where purchasing is thin. Those are the hunting grounds.

---

## 3. Top 10 procurement gaps (scored)

Weights follow your model (criticality 20%, value 15%, profit 15%, competition 15%, sourcing 10%, capital 10%, repeat 5%, Canadian advantage 5%, relationships 5%). Factor scores and full fields are in `database.csv`.

| Rank | ID | Gap | Score | Tier | Probability |
|---|---|---|---|---|---|
| 1 | G01 | Quebec municipal shelter and service-centre power-resilience kits | 4.20 | **S** (borderline) | Medium-High |
| 2 | G03 | Remote First Nations outage caches (Indigenous-led JV) | 3.95 | **A** | Medium (with a partner) |
| 3 | G05 | Critical-load battery backup for Quebec RPAs | 3.95 | **A** | Medium |
| 4 | G04 | Grant-ready resilience packs for funded non-profits | 3.70 | **A** (wedge) | High |
| 5 | G02 | Social-housing backup-power readiness | 3.65 | B | Medium |
| 6 | G07 | EOC and shelter multi-path comms pod | 3.65 | B | Low-Medium |
| 7 | G08 | Water/wastewater transfer readiness testing | 3.60 | B | Low-Medium |
| 8 | G06 | CO and generator-safety kits | 3.55 | B (door-opener) | Medium |
| 9 | G09 | NESS social-services VMI (subcontract) | 2.95 | C | Low |
| 10 | G10 | Generator fuel-readiness agreements | 2.90 | C | Low |
| — | N01–N04 | PSPC generator NMSO head-on; commodity lights; hospital and LTC power; NESS PPE | — | **NO-GO** | — |

### Quick profiles for gaps 6–10

| ID | Problem → gap | Why whales skip it | Next action |
|---|---|---|---|
| G07 | Shelters and small-town EOCs lose connectivity when cell sites drain or one provider fails; backup comms exists mainly in big cities | Integrators sell to big EOCs; small sites are not worth a sales cycle | Sell as a G01 add-on after the first 10 kits; watch Telesat Lightspeed (~2027) as a trigger |
| G08 | Generators start but transfers fail and chlorination drops (Halifax, twice) | Dealers sell maintenance, not end-to-end transfer tests under load | Monitor; find a load-bank subcontractor once G01 cash flows |
| G06 | CO deaths in every major ice storm | Too small and low-margin for anyone to bundle | Put in every G01 kit; offer fire departments a fall bundle |
| G09 | NESS committed to "alternative stockpiling models" (2024 plan) | It *is* a whale game: multi-million-dollar 3PL contracts | Read HP45-37/2024 Goal IV; aim at subcontracting to the 3PL prime only |
| G10 | Fuel ran short after Fiona | Fuel is commodity-margin and capital-heavy | Monitor only |

---

## 4. Deep dives: the top 5, end to end

### G01 · Power-resilience kits for Quebec municipal service and shelter centres: **S-tier (borderline 4.20)**

1. **The problem.** In a 24 h to 7-day outage the municipality opens its designated service or shelter centre: a church basement, arena or community hall. Often it is dark, cold, has no charging and has an undersized generator or none at all.
2. **Government evidence.** Quebec's *Règlement sur les procédures d'alerte et de mobilisation et les moyens de secours minimaux* (RLRQ c. S-2.4, r. 1) has applied to every local municipality since **9 November 2019**. It requires municipalities to provide reception, information, lodging, food and clothing services to disaster victims, and to be able to **cope with a power interruption** at those centres. The ministry's guide gives "generator and fuel" as the example. Elsewhere: after Fiona, a designated Cape Breton comfort centre had **no generator** when a councillor arrived, and CBRM moved to pre-designate centres.
3. **Existing procurement.** Standby generators are bought as one-off capital projects. Everything else is bought retail. No packaged, specified "centre resilience kit" was found on SEAO or federal portals.
4. **The gap.** The rule is in force, but there is no standard way to comply and no budget line until someone shows one. Most of the 1,108 municipalities have a part-time civil-security coordinator and no engineer.
5. **Why the whales aren't here.** Each order is $8K–$30K. That is below public-tender thresholds, spread over a thousand buyers, and has to be in French (Charter of the French Language). Generator dealers want $80K+ installs. Big contractors can't make the sales cost work.
6. **Product.** *"Trousse Centre Résilient"* in three sizes (S/M/L by centre capacity). Example M kit: 2 × 2 kWh LiFePO4 power stations (cold-rated), 400 W foldable solar, 6 LED area lights, a 20-port USB-C/A charging bar, 4 CO alarms, rated cords, French/English signage, a laminated deployment card, a load plan for *that* building, and a hard case. Plus a **yearly readiness service**: battery cycling, a test opening, and an update to the municipal civil-security plan annex.
7. **Supplier.** Power stations: a Canadian-assembled LiFePO4 line (e.g. Hybrid Power Solutions, Ontario) or a tier-1 brand through its Canadian distributor. Lighting, cords and CO alarms through a Quebec electrical wholesaler. **VERIFY:** government-account pricing, drop-ship, Net-30/60.
8. **Capital.** $5K–$15K for one demo kit and French documentation. After that it is order-by-order: municipal PO → supplier ships on Net-30 → municipality pays in roughly 30–60 days. **Gap to close:** if the municipality pays slower than our supplier terms, we carry about $5K per kit. BDC purchase-order loans require **12+ months of revenue**, so they are not a year-1 option.
9. **Contract pathway.** Municipal (Quebec), direct or invitation purchases. **Correction:** since 1 April 2026 these are governed by the new *Loi sur les contrats des organismes municipaux* (LCOM) and its regulations, not the Loi sur les cités et villes. The public-tender threshold was $133,800 and changed on 1 Jan 2026 (**VERIFY** the new amount). Scale path: get listed in a **UMQ or FQM group purchase**. The same kit fits Atlantic comfort centres (ACOA-funded) and Ontario.
10. **Relationship pathway.** MRC civil-security coordinators (one call reaches 10–40 municipalities) → municipal coordinators and fire chiefs → UMQ/FQM purchasing staff → regional directorates of the Ministère de la Sécurité publique (for information sessions, not sales).
11. **Timing.** Municipal budgets are adopted Nov–Dec and spending starts in Q1. **Approach now (Nov 2026) for 2027 budgets**, and again in Mar–May before storm season. Any outage is a demand spike: have stock-ready quotes in hand.
12. **Economics (estimate).** Landed cost about $4.5K–$6K per kit, price $8.5K–$11K, gross margin 35–45%, net margin 18–25%. Readiness service $900–$1.5K a year per kit, at high margin. **Year-1 scenario:** 3% of municipalities × 1.5 kits ≈ 50 kits ≈ **$475K revenue, about $100K net**, plus about $50K a year of recurring service.
13. **Competition.** Retail (no specification, no service), local electricians (generator-only), possibly a national safety distributor. No specialist found.
14. **Probability.** Medium-High for the first 5 sales; Medium for a group-purchasing listing.
15. **Next action.** (a) Pull the consolidated r.1 text from Légis Québec and quote the exact article. (b) Build the M-kit bill of materials and request 3 supplier quotes with Net-60 and drop-ship terms. (c) Call 5 MRC coordinators to test whether the need is real. (d) Draft a French one-pager: *"Conformité au règlement S-2.4, r.1: panne électrique au centre d'hébergement."*

### G03 · Remote First Nations outage and evacuation caches: **A-tier (3.95)**

1. **Problem.** Long-line or diesel-grid communities lose power for days; wildfire smoke and evacuations stack on top of outages; winter roads close.
2. **Evidence.** OAG 2022 Report 8: ISC spent about **$828M over 4 years**, **3.5 times more on response than on preparedness**, and was told to use a risk-based approach to invest in preparedness. OAG October 2025: **560+ emergencies and about 150 evacuations** between 2023 and 2025.
3. **Existing procurement.** ISC calls up generators off the PSPC standing offer (e.g. contract 4500481789, May 2025) and tenders generator servicing for 26 remote health facilities.
4. **Gap.** Community-held, maintained preparedness caches. The money is moving toward preparedness, but delivery is fragmented.
5. **Why whales skip it.** Freight, small orders, cold-climate specifications and relationship-heavy community procurement.
6. **Product.** The G01 stack rated for the cold (LiFePO4 that won't charge below 0 °C needs heated or self-heating packs), plus water storage, heating-safe supplies, comms charging, and **local training and yearly rotation**.
7. **Supplier.** Same as G01, plus northern carriers (air and winter road).
8. **Capital.** $10K–$30K. Freight prepayment is the risk; negotiate 30–50% deposits, which are common with band councils.
9. **Pathway.** Band-council purchases funded through ISC; ISC direct; **PSIB set-asides only through a genuine Indigenous-owned and controlled joint venture**. A front company would be fraud. Do not build one.
10. **Relationships.** Tribal-council emergency coordinators; an Indigenous business partner; ISC regional emergency-management offices.
11. **Timing.** Jan–Mar, for April fiscal-year plans and before wildfire season.
12. **Economics (estimate).** $25K–$150K per community; gross margin 30–40%, net 12–20%.
13. **Competition.** Regional general suppliers; generator NMSO holders for gensets only.
14. **Probability.** Medium with a real partner; Low without one.
15. **Next action.** Read Report 8 and the 2025 follow-up in full; shortlist 2–3 Indigenous-owned emergency or logistics businesses for a partnership conversation.

### G05 · Critical-load battery backup for Quebec seniors' residences: **A-tier (3.95)**

1. **Problem.** Some residences were without power for **6+ days** in April 2023. Oxygen concentrators, call bells, lifts and heat fail.
2. **Evidence.** **47% of Quebec RPAs have no emergency generator** (Radio-Canada/MSSS data). RPAs are **not required** to have one (CHSLDs and hospitals are). Quebec said it was *considering* a mandate. Hydro-Québec says RPAs are "not easily identifiable" for priority restoration.
3. **Existing procurement.** No public program found. Precedent: Quebec funded **$70.6M** in sprinkler retrofits for RPAs after the 2014 L'Isle-Verte fire. A generator or backup subsidy would follow the same pattern.
4. **Gap.** Generators are expensive and permit-heavy for a 20–60-unit residence. **Critical-load batteries** (one common room plus medical devices plus emergency lighting) are a right-sized middle option nobody is selling into this segment.
5. **Why whales skip it.** Private buyers, small tickets, and installs that need a local licensed electrician.
6. **Product.** A designed critical-load battery system (Canbat/Victron-class distribution) installed by a licensed Quebec master electrician partner.
7. **Supplier.** Canadian battery distributor plus an electrical contractor (we do not self-perform electrical work).
8. **Capital.** $10K–$25K per install unless we take a deposit; take 30–50%.
9. **Pathway.** Private B2B now, which builds a track record. Subsidy-backed later if the MSSS acts. **VERIFY** whether any post-2023 rule was adopted.
10. **Relationships.** RQRA (the residence association); CISSS/CIUSSS emergency planners.
11. **Timing.** Before each winter, and immediately on any MSSS announcement.
12. **Economics (estimate).** $15K–$60K per residence; gross margin 25–35%.
13. **Competition.** Generator dealers, solar installers.
14. **Probability.** Medium.
15. **Next action.** Search the Gazette officielle and MSSS releases for 2023–2026 RPA power rules; interview 3 small RPA operators.

### G04 · Grant-ready resilience packs for funded non-profits: **A-tier (3.70), the cash-flow wedge**

1. **Problem.** Neighbourhood groups are now funded to prepare, but they buy retail and alone.
2. **Evidence.** The **City of Ottawa's Extreme Weather Preparedness Grant** pilot ($1M over 3 years, up to $50K a year per organization, approved June 2026) names **mobile generators and power stations**. Hydro One community investment lists portable emergency power and warming-centre readiness. ACOA funded comfort-centre generators in Port Hawkesbury, Inverness and Antigonish/Pictou.
3. **Existing procurement.** Retail.
4. **Gap.** No supplier packages equipment to the grant's eligible-cost list.
5. **Why whales skip it.** Tickets of $5K–$50K sold to volunteers.
6. **Product.** Fixed-price packs at $5K, $15K and $50K, with a pre-filled grant budget sheet.
7. **Supplier.** Same as G01.
8. **Capital.** Under $5K; order only after the grant is awarded, with a deposit.
9. **Pathway.** Not government procurement, but government-funded: the fastest first revenue and first references.
10. **Relationships.** Community associations. Talk to grant staff about **eligibility questions only**; never ask them to steer awards.
11. **Timing.** Every intake round; watch engage.ottawa.ca.
12. **Economics (estimate).** Gross margin 35–45%.
13. **Competition.** Retail.
14. **Probability.** High.
15. **Next action.** Get the Ottawa intake dates and eligibility list; build a one-page grant-ready quote.

### G02 · Social-housing backup-power readiness: **B-tier (3.65), the largest recurring contract**

1. **Problem.** Tenants who are elderly or disabled are trapped above the ground floor; generators are undersized or run out of fuel.
2. **Evidence.** Nova Scotia housing department after Fiona: generator **maintenance and supply "a key issue"**; units with **undersized generators**; **fuel a major problem**; about 400 generators across housing authorities. Ontario's Bill 47 (generator mandate for rental high-rises) was **defeated**, so the gap remains unregulated and unbudgeted.
3. **Existing procurement.** Building-by-building generator maintenance; fuel bought separately.
4. **Gap.** *Endurance* is bought by no one: load matching, fuel guarantees, battery egress lighting, tenant check-in kits.
5. **Why whales skip it.** Dealers sell maintenance hours, not outage outcomes.
6. **Product.** A per-building "72-hour readiness" service, delivered by a licensed subcontractor.
7. **Supplier.** Licensed electrical and generator contractor; Canadian emergency-lighting maker.
8. **Capital.** $5K–$20K for insurance and bonding.
9. **Pathway.** Provincial and municipal housing RFPs; or subcontract to the incumbent PM contractor.
10. **Relationships.** Housing facility managers; tenant advocacy organizations.
11. **Timing.** Map existing PM contract expiries and approach **12 months before** each one.
12. **Economics (estimate).** $50K–$400K a year per portfolio; net margin 8–15%.
13. **Competition.** Toromont/Cat and Cummins dealers, local electricians.
14. **Probability.** Medium.
15. **Next action.** Pull 10 historical housing generator contracts (NS, Ottawa Community Housing, OMH Montréal) and log their expiries in the database.

---

## 5. Strategy: borrowing the whales' strength

- **Generator NMSO holders** (e.g. Rock Networks) sell boxes, not outcomes. Offer them our kit, load plan and readiness service as a **subcontracted value-add**. They bring the government relationships; we bring the specialty.
- **3PL primes** on NESS logistics: pitch reception-centre kit assembly and rotation as a subcontract (G09).
- **Licensed electrical contractors:** they need repeatable work; we bring the demand and the specification. That partnership is required for G02, G05 and G08.

---

## 6. The capital plan

| Need | Cash | Source | Status |
|---|---|---|---|
| Demo kit + French documentation | $5K–$15K | Founders | Required |
| Order float (5 kits in flight) | about $25K worst case | Supplier Net-30/60 + municipal payment in 30–60 days | **VERIFY** supplier terms |
| PO financing | — | BDC PO loan needs 12+ months of revenue | **Not available in year 1** |
| Receivables factoring | 2–4% of invoice | Private factors (municipal debtors are strong credit) | VERIFY rates |
| Insurance (product and general liability) | $2K–$5K a year | Broker | Required before first sale |

**Net-profit formula, applied to one M kit (estimate):** $9,500 price − $5,200 product − $300 freight − $150 financing − $100 insurance allocation − $250 compliance and French documentation − $1,000 overhead allocation = **about $2,500 net (26%)** before income tax. Sales taxes (GST/QST) pass through.

---

## 7. Four-stage plan: next 90 days

| Stage | Weeks | Deliverable | Kill criterion |
|---|---|---|---|
| **1 Intelligence** | 1–3 | Confirm the r.1 article text; pull SEAO award history for "génératrice" and "centre d'hébergement"; confirm the RPA rule status; log 10 housing PM contract expiries | Fewer than 2 of 5 MRC coordinators confirm the pain point |
| **2 Relationships** | 2–6 | 15 coordinator conversations (learning, not selling); a UMQ/FQM purchasing contact; 1 Indigenous partner conversation | No interest in a pilot |
| **3 Supply** | 3–8 | 3 supplier quotes with Net-60 + drop-ship; demo kit; French documentation | Landed cost over $6.5K or no supplier terms |
| **4 Contract** | 6–12 | 3 paid pilot kits (municipal or grant-funded); first readiness-service agreement | No PO by week 12, then pivot to G04-only |

**Locked:** the north star (outage endurance for places required to stay open); Quebec municipal as the first market; no head-on bids for the generator NMSO.
**Open:** kit sizes and bill of materials; brand of power station; G03 partner.

---

## 8. Compliance guardrails

- Talk to buyers **before** a solicitation is posted, about needs only. Once a tender is live, use only the official contact named in it.
- Never ask for or accept non-public information, and never offer anything of value to public officials. Quebec's anti-collusion and lobbying rules apply: **register as a lobbyist in Quebec if required before soliciting municipal officials** (VERIFY obligations with the Commissaire au lobbyisme).
- Indigenous set-asides only through genuine Indigenous ownership and control.
- No safety claims beyond certifications: CSA/cUL marks on every electrical item; CSA 6.19 for CO alarms.

---

## 9. Verification backlog (what this pass did NOT confirm)

1. Exact article numbers and current text of RLRQ S-2.4, r.1 (Légis Québec).
2. Current Quebec municipal contract thresholds (gré à gré, invitation, public tender).
3. Whether Quebec adopted any RPA generator or backup rule after April 2023.
4. Second and later holders of the PSPC portable generator NMSO and its expiry.
5. SEAO historical awards for generators, shelter kits and power stations by municipalities (the data pull is the next job).
6. Supplier pricing, MOQ, terms and drop-ship ability (no quotes yet).
7. Status of the Red Cross Humanitarian Workforce agreement after March 2026.
8. Details of the NESS Comprehensive Management Plan (2024) on alternative stockpiling (read the full PDF).

---

## Sources

- OAG 2021 Report 10, PPE and medical devices (NESS): https://www.canada.ca/en/auditor-general/our-work/audit-reports/parl-oag-202105-01-e.html
- PACP report on NESS: https://ourcommons.ca/documentviewer/en/44-1/PACP/report-11/page-33
- NESS overview: https://www.canada.ca/en/public-health/services/emergency-preparedness-response/national-emergency-strategic-stockpile.html
- NESS Comprehensive Management Plan (2024): https://www.canada.ca/en/public-health/services/emergency-preparedness-response/national-emergency-strategic-stockpile/comprehensive-management-plan.html · PDF: https://publications.gc.ca/collections/collection_2024/aspc-phac/HP45-37-2024-eng.pdf
- NESS evaluation (social-services stock): https://www.canada.ca/en/public-health/corporate/mandate/about-agency/office-evaluation/evaluation-reports/evaluation-national-emergency-stockpile-system/executive-summary.html
- PSPC briefing on NESS logistics contracts: https://www.canada.ca/en/public-services-procurement/corporate/transparency/briefing-materials/standing-committee-health/2021-02-05/procurement.html
- OAG 2022 Report 8, Emergency Management in First Nations Communities: https://www.canada.ca/en/auditor-general/our-work/audit-reports/parl-oag-202211-08-e.html
- OAG 2025 follow-up coverage: https://theturtleislandnews.com/index.php/2025/10/24/ottawa-falls-short-on-emergency-response-for-first-nations-as-climate-disasters-climb-audit/
- ISC generator contract record: https://search.open.canada.ca/contracts/record/isc-sac%2CC-2025-2026-Q1-00123
- Quebec regulation reference document: https://www.quebec.ca/securite-situations-urgence/securite-civile/soutien-municipalites/preparation-sinistres/demarche-preparation-municipale/reglement-procedures-alerte
- Quebec guide, Préparer la réponse aux sinistres: https://www.quebec.ca/securite-situations-urgence/securite-civile/soutien-municipalites/preparation-sinistres/generale/guide-reponse-sinistres
- Hydro-Québec post-storm resilience release (May 2023): https://news.hydroquebec.com/en/press-releases/1952/april-2023-ice-storm-hydro-quebec-takes-action-to-increase-system-resilience/
- CBC on 2023 ice storm lessons: https://www.cbc.ca/lite/story/1.6810600
- RPA generators (47%): https://ca.news.yahoo.com/nearly-half-quebec-private-seniors-135141055.html
- West Island seniors, day 6: https://montreal.ctvnews.ca/west-island-seniors-struggling-on-sixth-day-of-power-outage-question-hydro-quebec-priority-system-1.6349986
- RPA sprinkler subsidy precedent: https://montreal.ctvnews.ca/a-decade-after-32-seniors-died-in-a-massive-fire-some-quebec-care-homes-struggle-to-install-sprinklers-1.6734964
- Ontario LTC generator requirement: https://theglobeandmail.com/canada/article-long-term-care-blackadar-ontario/
- City of Ottawa derecho after-action report: https://documents.ottawa.ca/sites/documents/files/sw_event_aar_en.pdf
- Hydro Ottawa After the Storm report: https://hydroottawaholding.com/wp-content/uploads/2022/11/After-storm-report.pdf
- Ontario Bill 47 defeat: https://ottawa.ctvnews.ca/ottawa-area-mpp-disappointed-in-lack-of-support-for-derecho-inspired-generator-bill-1.6285347
- NS public housing generators after Fiona: https://amp.cbc.ca/news/canada/nova-scotia/public-housing-hurricane-fiona-backup-power-electricity-ns-government-1.6606726
- CBRM comfort centres: https://amp.cbc.ca/news/canada/nova-scotia/cbrm-considers-designating-comfort-centres-1.6660536
- Fiona comfort centres (charging): https://www.cbc.ca/lite/story/1.6598516
- ACOA comfort-centre funding: https://www.canada.ca/en/atlantic-canada-opportunities/news/2024/01/port-hawkesbury-receives-federal-investment-to-improve-amenities-at-climate-comfort-centre.html
- Halifax Water after-incident report: https://halifaxwater.ca/sites/default/files/2025-02/J.D.%20KLINE%20WATER%20SUPPLY%20PLANT%20DISINFECTION%20INTERRUPTION%20%E2%80%93%20AFTER%20INCIDENT%20REPORT_0.pdf
- Kawartha Lakes advisory: https://www.kawarthalakes.ca/news-and-notices/posts/boil-water-advisory-issued-for-pinewood-drinking-water-system-in-pontypool/
- CO deaths, 2023 ice storm: https://amp.cbc.ca/lite/story/1.6805319
- CRTC Rogers resiliency assessment: https://crtc.gc.ca/eng/publications/reports/xona2024.htm
- Starlink reconsideration: https://www.ctvnews.ca/business/article/canadian-governments-rely-on-starlink-for-critical-services-some-are-reconsidering/
- PSPC portable generators NMSO: https://www.canada.ca/en/public-services-procurement/services/acquisitions/collaborative-procurement-opportunities-governments-other-eligible-organizations/list-commodities/portable-generators.html
- Rock Networks NMSO record: https://buyandsell.gc.ca/procurement-data/standing-offers-and-supply-arrangements/CW2244102-ACM-162630278
- Red Cross Humanitarian Workforce agreement: https://search.open.canada.ca/grants/record/ps-sp,088-2023-2024-Q1-00074,current
- Ottawa Extreme Weather Preparedness Grant: https://engage.ottawa.ca/pilot-extreme-weather-preparedness-grant-program
- Hydro One community investment: https://www.hydroone.com/about/energizing-life/
- Green Municipal Fund, battery backup for community facilities: https://greenmunicipalfund.ca/resources/battery-back-ups-and-battery-powered-generators-community-facility-resilience
- BDC purchase-order loan: https://www.bdc.ca/en/articles-tools/money-finance/get-financing/purchase-order-financing-flexible-tool-help-fulfil-large-orders
- 72HRS organizational kits (supplier reference): https://72hours.ca/pages/organization-solutions
- Hybrid Power Solutions (Canadian LiFePO4): https://modernoutpost.com/hybrid-power-solutions-canada
- Canbat distribution: https://www.canbat.com/?p=28661
