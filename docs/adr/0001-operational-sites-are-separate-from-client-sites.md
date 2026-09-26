<!-- generated-by: gsd-doc-writer -->
# Operational `sites` are separate from `client_sites`

The schema and the curated fixtures keep two distinct location tables: `sites` for
operational locations (filling centres, depots, supply points) and `client_sites` for
commercial buyers' premises. They ship as two separate arrays in
`packages/mock-data/src/seed/curated/03_sites_and_client_sites.json` and are exposed as
two separate collections from `@lpg/mock-data` (`sites`, `client_sites`), each with its
own status lifecycle, assignment rules, and React Query key (`sites` vs `client-sites`
in `apps/web/src/lib/api/invalidation.ts`).

## The market import is merged as operational `sites`

The real-world market dataset imported as `market.json` is merged into the **operational
`sites`** collection, never into `client_sites`. The import lands in
`packages/mock-data/src/seed/curated/03_sites_and_client_sites.json` as rows whose id
starts with `site-market-`; the source file itself is not committed. Today that is 204
imported records across 9 source organizations, alongside the hand-authored operational
sites in the same file.

The contract is enforced by `apps/web/src/lib/market-fixture.test.ts`, which pins:

- the exact ten source organization ids and their expected `org_type`;
- the exact per-organization `operational_site_count`;
- exactly 204 `site-market-*` records and zero `client_sites` with that prefix;
- a SHA-256 fingerprint over the six source-backed fields (`org_id`, `region`, `name`,
  `address`, `functions`, `geo_point`) so an unintended edit to an imported row fails;
- the normalized import lifecycle every imported row must carry — `status=UNASSIGNED`,
  `is_verified=false`, `geo_confidence_score=0`, `verified_at`/`verified_by` null,
  `delivery_count=0` — so the dataset enters as unverified operational sites and is
  promoted only by the geo-verification workflow;
- the function assigned by organization type (`POINTAPPROVISIONABLE` for marketeurs,
  `ENTREPOT` for depots) and Cameroon coordinate bounds.

Known source anomalies (duplicated coordinates such as `Alpha AXX Bamendzi` / `AXX Bamendzi 1`,
`Station Tradex Maroua-Djarengol` / `Dépôt SCDP Maroua`) are asserted as-is rather than
silently corrected: they are preserved as review-required data, not normalized away.

## Considered options

- **One polymorphic `locations` table** — rejected: operational sites carry
  `site_functions`, geo-confidence auto-verification, and supply relationships that a
  commercial client site has no meaning for. Merging them would force nullable columns
  and weaken the site verification workflow.
- **Keeping them merged at the UI layer** — rejected: the two collections have different
  scopes, permissions, and state machines, and a tour checkpoint can be either kind.
  Merging them in the view layer loses the distinction that assignments and RBAC depend on.

## Consequences

- Features that display "locations" must state explicitly which collection they read and
  must keep the corresponding query key.
- `user_site_assignments` scopes operational sites; client sites are scoped by their
  owning client/organization.
- A future map view that plots both collections must carry the collection kind on each
  feature, not infer it from the shape of the row.
- Re-importing or editing the market dataset is a breaking change unless it keeps the
  204-record count, the per-organization counts, and the fingerprint in
  `market-fixture.test.ts`. Updating the fingerprint is a deliberate, reviewed act — not
  a way to make a failing test pass.
