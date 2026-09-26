<!-- generated-by: gsd-doc-writer -->
# Domain Docs

This repository uses the standing domain contract in `AGENTS.md` plus the SQL schema and TODO guide. Read them before changing domain behavior:

- `../csph_gpl_schema_v6_2.sql` for table names, columns, constraints, and enum values.
- `../TODO.md` for intended workflows and acceptance criteria.
- `AGENTS.md` for frontend structure, security, units, i18n, and verification rules.
- `docs/domain-model.md`, `docs/state-machines.md`, and `docs/workflows.md` for current documentation.

There is no `CONTEXT.md` in the repository root at present, and no requirement to create one before exploring. If domain terminology or an architectural decision changes, record it in the appropriate ADR or domain document rather than silently introducing a synonym.

Use the schema vocabulary in code and docs: `sites` for operational locations, `client_sites` for commercial destinations, `VRAC` in TM, `BOUTEILLES50KG` in btl, and uppercase enum values. The current market fixture has 10 organizations and 204 unassigned/unverified operational sites.

## Exploration order

1. Identify the feature folder and static route.
2. Read its `data/`, `lib/`, and `components/` files.
3. Check shared types and permissions instead of declaring local equivalents.
4. Check scope helpers, settings accessors, API-client actions, query invalidation, i18n resources, and tests.
5. Run the relevant package scripts before claiming completion.

Detailed architectural and workflow guidance is linked from [`docs/README.md`](../README.md).
