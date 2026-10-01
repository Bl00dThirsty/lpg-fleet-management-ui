# Report: Task 8 + Task 9 — Site-level scoping documentation

## Status: PARTIAL (Task 8 done; Task 9 content done, commit blocked)

## Task 8 — AGENTS.md rule (DONE)

Added the site-level data isolation rule verbatim from the brief, inserted
immediately after the existing "No organizational view for MARKETEUR" bullet in
`AGENTS.md` §4 (Business rules & system conventions). The existing MARKETEUR
bullet was kept untouched (still accurate about `/marketers`/`/organizations`).
No other lines modified.

Commit: `8eb4339 docs(agents): site-level scoping rule` (1 file, +8)

## Task 9 — TODO.md scoping annotations (CONTENT DONE, COMMIT BLOCKED)

Applied all four annotation edits to `C:\Users\DTA_WorkStation\Documents\manga\TODO.md`:

- Line 376 `GET /api/v1/sites` — appended `; MARKETEUR → own site; only REGULATEUR-org staff see org-wide.` (kept existing `scoped by user_site_assignments for AGENT/ADMIN`)
- Line 452 `GET /api/v1/tours` — appended `; MARKETEUR → own site; TRANSPORTEUR → own org; AGENT → assigned sites; only REGULATEUR-org staff see org-wide.` (kept existing `scoped by org and user_site_assignments`)
- Line 441 `GET /api/v1/pickups` — appended ` — scoped by user_site_assignments + created_by; MARKETEUR → own site; only REGULATEUR-org staff see org-wide.`
- Line 491 `GET /api/v1/declarations` — appended ` — scoped by user_site_assignments + created_by; MARKETEUR → own site; only REGULATEUR-org staff see org-wide.`

All edits verified by re-reading the file (matches brief's wording, existing
trailing descriptions preserved, no other lines touched).

### Commit BLOCKED — TODO.md is outside the git repository

`../TODO.md` is NOT tracked by this repo and cannot be committed:

- `git rev-parse --show-toplevel` → `C:/Users/DTA_WorkStation/Documents/manga/lpg-fleet-management-ui`
- `git -C .. rev-parse --show-toplevel` → `fatal: not a git repository`
- `git add ../TODO.md` → `fatal: '../TODO.md' is outside repository at ...`

The parent `manga\` directory holds no `.git`; `TODO.md` is an unversioned
reference document (per AGENTS.md §1 it is `../TODO.md`, external to the repo).
Per instructions, only two commits total were expected; only Task 8 could be
committed. No commit was fabricated for Task 9.

## Self-review

- Task 8 bullet is verbatim from the brief (only indentation matches file style).
- Task 9 annotations match the exact per-line text from the dispatch.
- No accidental edits to other lines in either file (confirmed via re-read;
  `git status` after Task 8 commit shows only pre-existing `.superpowers/sdd/*`
  modifications from other task agents, which I did not stage).

## Recommendation

If Task 9's commit is still required, the `manga\TODO.md` location must either
be brought under version control (e.g. repo at `manga\`, or symlink/copy into
the repo) or the commit intentionally skipped since the file is unversioned.
