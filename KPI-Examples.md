# LPG Fleet: Fix Register and KPI Descriptions

**Scope:** every issue visible in your screenshots (overview in the local build, overview on the deployed app, the flow chart, the regional panels, and the map), grouped by type, then a plain description of each KPI so the team can implement it identically.

**Method:** I could not query your database. Every "wrong" below comes from recomputing the numbers on screen (deltas, sums, shares). Items marked *to confirm* need a check against real data.

**Screens:** *Overview-local* (`192.168.1.198:5173`), *Overview* (deployed), *Flow* (12-month chart), *Regions* (bottom panels), *Map* (`/map`).

**Priority:** **P0** = a number on screen is wrong or contradicts another. **P1** = misleading definition or design. **P2** = polish.

## 1. Fix register

### A. Calculation errors (deltas)

| ID | Screen | What we saw | Why it is wrong | Fix | Pri |
| --- | --- | --- | --- | --- | --- |
| F-01 | Overview | Bottles `15.7k` "from 24.1k" with ▲ 3.2% | 15,7k / 24,1k = **−34,9%** | Compute the delta server-side from the same current and previous values | P0 |
| F-02 | Overview | Tournées `128` "from 135" with ▲ 5.1% | 128 / 135 = **−5,2%** | Same as F-01 | P0 |
| F-03 | Overview | A +3,2% change on 24,1k implies ≈24,9k bottles; +5,1% on 135 implies ≈142 tours | The badge and the shown value come from different queries or windows | One query returns `{current, previous, delta}` for one period object | P0 |
| F-04 | Overview | Camions and Conformité deltas are in points (+1,8 / +0,9) while the others are relative % | The two conventions are mixed and unlabelled | Rates: change in **pt**. Volumes and counts: change in **%** | P1 |
| F-05 | Overview | Every badge is green with ▲ | Colour follows direction, not whether the change is good | Colour = good / bad / neutral per KPI (fewer tours is neutral, more anomalies is bad) | P1 |

### B. Data, units and scale

| ID | Screen | What we saw | Why it is wrong | Fix | Pri |
| --- | --- | --- | --- | --- | --- |
| F-06 | Overview-local vs Overview | Vrac `143,8 TM` locally, `1 428,5 TM` deployed, both with +4,8% | +4,8% is consistent with 1 428,5 vs 1 362,8, so the local display was **10× too low** | One shared `kgToTM()` function. Add a unit test. Confirm the local build is patched | P0 |
| F-07 | Overview-local vs Overview | Bottles `1.5k` locally, `15.7k` deployed, previous `24.1k` in both | Same screen, three scales | Single source for bottle counts. Test: bottles × 50 / 1000 = bottle TM | P0 |
| F-08 | Flow + Overview | "12 mois" total `2 569 TM`, but 30 days ≈ 2 214 TM and the region panel (1 month) = 2 151 TM | The 12-month total equals about 1,2 months. Expected is about 25 000 TM | Rebuild the 12-month aggregate. Test: month ≤ 12-month total | P0 |
| F-09 | Flow | Axis runs mai → avr while today is October 2026 | The chart is stale or seeded | Axis ends at the current month. Rolling 12 months | P0 |
| F-10 | Overview | "30 derniers jours" vs picker 09 sept – 06 oct (28 days) | Label and range disagree | Define periods exactly. Show the real dates on every card | P1 |
| F-11 | Overview-local vs Overview | 220 TM delivered locally vs 1 428 TM deployed. 2 151,1 TM regional total is identical in both | Some panels are static or mock | Flag mock rows `is_simulated`. Exclude them from production KPIs. Show an environment banner on non-production builds | P0 |
| F-12 | Regions | "(1 Mois)" panel next to "12 derniers mois" and "30 derniers jours" | Three periods on one page, with no global control | One global period selector drives every panel | P1 |

### C. Definitions and cross-screen consistency

| ID | Screen | What we saw | Why it is wrong | Fix | Pri |
| --- | --- | --- | --- | --- | --- |
| F-13 | Overview + Regions | Conformité `98,6%`, bons conformes `96%` (1 121 / 1 168 = 95,98%), taux moyen `94,9%` | Three "conformity" numbers for the same period | Three distinct KPIs with three names (see section 2.3 to 2.5) | P0 |
| F-14 | Overview | Bar under "1 121 conformes / 1 168 total" is 100% full | At 96% the bar should not look complete | Fill = value, tick = target | P1 |
| F-15 | Overview | Camions tracés `94,2%` with "0/0 camions actifs" | A percentage over zero trucks is undefined | Return `null`, show "n/a". Define the denominator (trucks on an active tour) | P0 |
| F-16 | Overview vs Map | Tours: "0 actives" (deployed), "4 actives" (local), map "1 active" and "4 visibles" | Several definitions of "active" | One status model: planned, active, closed. One query for both screens | P0 |
| F-17 | Regions | Taux moyen `94,9%` | It matches the **volume-weighted** mean (≈95,0%); the simple mean is 91,0%. Not labelled | Label "pondéré par le volume" | P1 |
| F-18 | Regions | Targets differ per region (94, 92, 90, 90, 88, 88, 88, 87, 85, 85) with no source | Unexplained, so users cannot trust the gap | Store in a `kpi_target` table with owner and validity date. Show the source in a tooltip | P1 |
| F-19 | Overview vs Map | TM in motion: `58,4 TM` (Fréquence panel), `33,5 TM` (map, "Volume VRAC suivi"), `18,5 TM` (the only active tour) | Three numbers for "what is moving now" | One definition: Σ loaded TM of active tours. Show scope (all products vs bulk only) | P0 |
| F-20 | Map | Badge "Données temps réel" while the tour panel says "Position simulée" | Contradictory trust signals | Show "Simulé" on the badge, or hide real-time claims until positions are real | P0 |

### D. Visual design

| ID | Screen | What we saw | Why it is wrong | Fix | Pri |
| --- | --- | --- | --- | --- | --- |
| F-21 | Regions | Donut around "Taux moyen 94,9%" | Rates don't sum to 100%, so the segments mean nothing | Sorted dot-on-track with a target tick | P1 |
| F-22 | Regions | Cards show `99,1%` and `Cible: 94%` | The user must subtract mentally | Show the gap (+5,1 pt) and a status colour | P1 |
| F-23 | Flow | Columns without y-axis. Tooltip reads "172 / 172 TMGPL Vrac / 88 TMBouteilles 50 kg" | No scale. Duplicated value and missing spaces | Labelled TM axis. Tooltip: "Vrac 172 TM · 50 kg 88 TM · Total 260 TM" | P1 |
| F-24 | Regions | "58,4 TM en rotation" with \~30 bars and no dates or axis | The bars carry no readable information | Date axis, 7-day average line, and the definition from F-19 | P1 |
| F-25 | Overview | `1 428,5` next to `1 362.8`, `15.7k`, `94.2%` | Two decimal conventions and mixed abbreviations | One locale (fr-CM): `1 428,5`, `15,7 k`, `94,2 %` | P2 |
| F-26 | Overview | "1428,5 TM" wraps onto two lines and pushes the badge | Layout overflow in the first card | Don't wrap value and unit. Shrink the font or abbreviate | P2 |
| F-27 | Overview | "from 24.1k btl", "Tous les marketeurs" in an otherwise French UI | Mixed languages | Translate all strings ("vs 24,1 k btl") | P2 |
| F-28 | Sidebar | Many "soon" items. "Vue d'ensemble" next to "Tableau de bord national" | Noise and unclear overlap | Hide unreleased items. Merge or rename the two dashboards | P2 |

### E. Map

| ID | Screen | What we saw | Why it is wrong | Fix | Pri |
| --- | --- | --- | --- | --- | --- |
| F-29 | Map | Header "Axe Douala – Wouri (Littoral)" | The map is scoped to one axis, not national | National view by default, with a region and axis selector | P1 |
| F-30 | Map | "237 si…" (truncated) next to "Centres & Dépôts: 4 sites" and "Points clients: 4 cuves" | Counts at different scopes with no labels | Label scope ("237 sites nationaux · 4 dans l'axe") | P0 |
| F-31 | Map | Alert "Écart −0,8 TM, Bonabéri" | No percentage, no tolerance, and the sign is undefined. On an 18,5 TM load, 0,8 TM is **4,3%**, far above 0,5% | Show "−0,8 TM (−4,3 %) · tolérance 0,5 %". Define the sign (negative = delivered less than loaded) | P0 |
| F-32 | Map | Simulated positions feed the KPI strip | Simulated data counted as real | Exclude `is_simulated` rows or badge them. Show position age | P0 |
| F-33 | Map | "Tournée en transit: 1 active" vs "4 tournées visibles" | Mixed statuses under one count | "4 tournées (1 active, 3 planifiées)" | P1 |
| F-34 | Map | "Pression cuve 12,4 bars" | No threshold, no reading time | Show last-reading time and alarm threshold. Colour when out of range | P1 |
| F-35 | Map | KPI strip behaviour under filters | Unknown | The strip must recompute for the visible bounds, region and marketer | P1 |

**Totals:** 35 fixes. **P0 = 16**, P1 = 15, P2 = 4. Group A = 5, B = 7, C = 8, D = 8, E = 7.

## 2. Dashboard KPI descriptions

Rules for all cards: one value, one unit, one period label, one delta against the previous equivalent period, a definition tooltip. Display TM with one decimal.

### 2.1 Volume GPL Vrac (card 1)

| Item | Definition |
| --- | --- |
| Question | How much bulk LPG was delivered in the period? |
| Formula | Σ net_kg_delivered (product = bulk) / 1000 |
| Display | `1 428,5 TM`, delta in %, sparkline over 6 periods |
| Good direction | Up (context-dependent, so neutral colour unless a target exists) |
| Alert | Drop of more than X% vs the previous period |
| Drill-down | By region, marketer, depot |

### 2.2 Bouteilles 50 kg livrées (card 2)

| Item | Definition |
| --- | --- |
| Question | How many 50 kg bottles were delivered? |
| Formula | Σ bottles delivered. Equivalent TM = bottles × 50 / 1000 |
| Display | `15,7 k btl` with the TM equivalent underneath, delta in % |
| Check | bottles × 0,05 = bottle TM, always |
| Drill-down | By region, marketer, site |

### 2.3 Tournées hors réseau (card 3)

| Item | Definition |
| --- | --- |
| Question | How many delivery tours ran, and how many are active now? |
| Formula | Count of tours started in the period. Status: planned, active, closed |
| Display | `128`, delta in %, neutral colour, subtitle "1 active · 127 closes" |
| Note | "Active" must come from one status model shared with the map |

### 2.4 Camions tracés en ligne (card 4)

| Item | Definition |
| --- | --- |
| Question | Are the trucks on tour actually reporting their position? |
| Formula | Trucks with a ping ≤ 5 min / trucks on an active tour |
| Display | `94,2 %` with "49 / 52" below, delta in **points** |
| Edge case | No active tour: show "n/a", never 0 or 100 |
| Alert | Below 95% |

### 2.5 Conformité (three distinct KPIs)

| KPI | Formula | Where |
| --- | --- | --- |
| **Conformité de pesée** | Deliveries with abs(gap%) ≤ 0,5 / weighed deliveries | Card 5, headline |
| **Livraisons certifiées** | Deliveries with gap within tolerance **and** no dispute **and** acknowledged / delivered | "Acquittements & bons conformes" panel (the current 1 121 / 1 168) |
| **Taux de livraison conforme** (regional) | Certified deliveries / planned deliveries per region, national = volume-weighted | Regional panel (*definition to confirm with CSPH*) |

The word "conformité" must not appear alone anywhere.

### 2.6 Chart and panel descriptions

| Panel | Question | Representation |
| --- | --- | --- |
| Flux des livraisons | How does delivered volume evolve? | Stacked columns, TM axis, tooltip with total, rolling 12 months ending this month |
| Acquittements & bons conformes | How many deliveries are certified? | Count, rate, bar with target tick |
| Qualité de livraison par région | Which regions miss their target? | Sorted dot-on-track with target tick and gap in points |
| Fréquence & volumes par région | Who carries the volume, and how fast does it rotate? | Horizontal bars in TM (sum = national total) and a dated rotation line |
| Chaîne de traçabilité (new) | Where do deliveries leave the chain? | Stage cards plus an exits chart (non livrées, sans pesée, hors tolérance) |
| À traiter (new) | What needs action today? | Sortable exceptions table linked to the delivery |

## 3. Map KPI descriptions

Rule: every map KPI recomputes for the **visible bounds**, selected region and selected marketer, and states its scope.

### 3.1 Header strip

| KPI | Question | Formula | Fix applied |
| --- | --- | --- | --- |
| Centres & Dépôts | How many depots are in scope? | Active depot sites in scope | State scope next to the total (F-30) |
| Points clients VRAC | How many bulk customer points? | Active customer sites with a tank, and tank count | Distinguish sites from tanks (F-30) |
| Volume VRAC suivi | How much bulk volume is moving now? | Σ loaded TM of active tours in scope | Same definition as the overview's "en rotation" (F-19) |
| Tournée en transit | How many tours are moving? | Active tours / visible tours, plus the current location | "1 active sur 4" (F-33) |
| Alertes & Écarts | What needs attention? | Open anomalies by severity | Show %, tolerance and sign (F-31) |

### 3.2 Tour detail panel

| Field | Definition | Fix |
| --- | --- | --- |
| Volume GPL | Loaded TM of the tour | Add loaded vs delivered once known |
| Distance / Durée | Planned km and ETA | Add actual vs planned |
| Pression cuve | Last tank pressure reading (bar) | Add reading time and alarm threshold (F-34) |
| Transporteur, Citerne & immat. | Carrier, tank and plate | No change |
| Position badge | Data quality of the position | "Simulé" or "Réel", with position age (F-20, F-32) |

### 3.3 Map KPIs to add

| ID | KPI | Formula |
| --- | --- | --- |
| M1 | Trucks by status | moving / stopped / offline, out of trucks on active tours |
| M2 | Late tours | active tours with ETA beyond planned + grace |
| M3 | Route deviation | distance from the planned route, per active truck |
| M4 | Position age | seconds since last ping, per truck |
| M5 | Dormant sites | sites with no delivery in N days in the visible bounds |
| M6 | Region gap to target | delivery-rate gap per region, as a choropleth |

## 4. Implementation order and acceptance tests

### Order

1. **Data layer (F-06, F-07, F-08, F-09, F-11, F-32):** unit function, one source, rolling windows, `is_simulated`.
2. **Delta engine (F-01 to F-05):** one query per KPI returns `{current, previous, delta, unit, status}`.
3. **Definitions (F-13 to F-20, F-30 to F-33):** rename KPIs, one status model, one "TM in motion" definition.
4. **Design (F-21 to F-28, F-34, F-35):** replace the donut, add axes, localise, global filters.

### Acceptance tests (run nightly)

| # | Test |
| --- | --- |
| T1 | Σ region TM = national TM for the same period |
| T2 | Vrac TM + 50 kg TM = total TM |
| T3 | bottles × 50 / 1000 = bottle TM |
| T4 | Month TM ≤ 12-month TM, and Σ monthly = 12-month total |
| T5 | Displayed delta = (current − previous) / previous (or the difference in points) |
| T6 | Chart axis ends at the current month |
| T7 | Active tours (overview) = active tours (map) |
| T8 | TM in motion (overview) = TM in motion (map) |
| T9 | Conformity KPIs each use their own named formula, and numerators ≤ denominators |
| T10 | No `is_simulated` row in production KPIs |
| T11 | Regional weighted rate = national rate, within rounding |
| T12 | Any KPI with denominator 0 returns `null` |