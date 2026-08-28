# P3T1 Task 1 Report

Status: complete

Files:
- `packages/types/src/index.ts`
- `packages/mock-data/src/seed/curated/06_delivery_tours.json`
- `C:\Users\DTA_WorkStation\Documents\manga\csph_gpl_schema_v6_2.sql` (external schema annotation)

Valid organization IDs used:
- `org-0002-sctm-0000-000000000001`
- `org-0003-total-0000-000000000001`
- `org-0004-aza--0000-000000000001`
- `org-0005-camg-0000-000000000001`
- `org-0010-translog----000000000001`
- `org-0011-expressgpl--000000000001`

The plan referenced `tc-005-sctm-sahel`, but that organization ID does not exist in the
canonical seed. The fixture uses the valid existing substitution `tc-005-aza-translog` with
`org-0004-aza--0000-000000000001` instead; the nonexistent ID was not introduced.

Fixture lifecycle coverage:
- ACTIVE: `tc-001-sctm-translog`
- PENDINGTRANSPORTERACK: `tc-002-sctm-express`
- EXPIRED: `tc-003-total-translog`
- PENDING: `tc-004-total-express`
- SUSPENDED: `tc-005-aza-translog`
- UPCOMING: `tc-006-camg-translog` (valid CAMGAZ/Transport Logistique pair; proof present,
  transporter accepted, active, starts after 2026-08-18, and ends in the future)
