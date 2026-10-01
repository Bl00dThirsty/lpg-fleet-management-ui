# Subagent-Driven Development Progress Ledger

Branch: `fix/cleanup-corrigee`
Plan series: `docs/superpowers/plans/2026-08-14-{1..8}-*.md`
Spec: `docs/superpowers/specs/2026-08-14-scope-workflow-forms-security-design.md`

## Plan 1: Site-Level Scoping (2026-08-14-1-site-level-scoping.md)

- [x] Task 1: complete (commits 786942c..1718f43, review clean — Minor: site_ids optionality, test email coupling)
- [x] Task 2: complete (commits 1718f43..02d5674, review clean — 20 assignments / 16 users)
- [x] Task 3: complete (commits 02d5674..e3f23da, review clean — Minor: unnecessary `as any` cast on typed collection)
- [x] Task 4: complete (commits e3f23da..5ec777e, review clean — Minor: scope.ts doc claims created_by branch, coverage wording)
- [x] Task 5: complete (commits 5ec777e..d071df1, review fixed: Important org-name-visibility resolved via d071df1; Minor: AUTRE label English)
- [x] Task 6: complete (commits d071df1..1f9fc74, review clean)
- [x] Task 7: complete (commit 7a940da, full unit suite 79 files/374 tests green; typecheck clean)
- [x] Task 8: complete (commits 604cb30..8eb4339, review clean)
- [x] Task 9: content applied to ../TODO.md (lines 376/441/452/491) — file is outside this git repo, cannot commit; recorded only
- [x] **Plan 1 COMPLETE**

## Plan 2: Soft-Delete Alignment (2026-08-14-2-soft-delete.md)

- [x] Task 1: complete (commits 8eb4339..5794561, review clean — deviation coll.some() justified; Minor: GET-by-id guard untested, empty-collection edge)
- [x] Task 2: complete (no restore endpoint verified; comment 519b61e)
- [x] Task 3: complete (delete UX confirmed — AlertDialog+toast+invalidation already present; no change)
- [x] Task 4: complete (commits 519b61e..5f988ee, AGENTS.md soft-delete rule)
- [x] **Plan 2 COMPLETE**

## Plan 3: Security Enforcement (2026-08-14-3-security-enforcement.md)

- [x] Task 1: complete (commits 5f988ee..8e97d7c, review clean — deviation: negative test swapped to trucks.create, verified)
- [x] Task 2: complete (commits 8e97d7c..afd33ab, review clean — ACTION_PERMISSION shared via tour-machine, site access deferred to Plan 5; Minor: LIVREUR fallback fail-open noted for final review)
- [x] Task 3: complete (commits afd33ab..29798b1, review clean — AGENT denied verified, site-scope denial covered)
- [x] Task 4: complete (commits 29798b1..dd36292, review clean — scope check generalized to all scoped roles, documented; Minor: updateUser unguarded noted)
- [x] Task 5: complete (commits dd36292..f6de545, review clean — JSON-array mfa setting parsing correctly handled)
- [x] Task 6: complete (commit 7208f71 + MFA-format fix 24f686f)
- [x] **Plan 3 COMPLETE**

## Plan 4: Cache & Queue Wiring (2026-08-14-4-cache-and-queue.md)

- [x] Task 1: complete (commit c24cdf6 — committed before workflow change)
- [x] Task 2: complete (working tree; loop-fix: re-dispatch ws:notify instead of ws:event)
- [x] Task 3: complete (working tree; WsBridge in main.tsx)
- [x] Task 4: complete (working tree; mock-ws with window guard, emits in tours/pickups stores)
- [x] Task 5: complete (working tree; use-report with injected getStatus callback)
- [x] Task 6: complete (working tree; optimistic rollback in stores)
- [x] Task 7: complete (working tree; AGENTS.md cache/queue rules)
- [x] **Plan 4 COMPLETE (all in working tree, awaiting single final commit)**

## Plan 5: Tournee Wizard & Workflow (2026-08-14-5-tournee-wizard-workflow.md)

- [x] Task 1: complete (working tree; validateTour extended via options.checkpoints; @lpg/types Checkpoint +expected_quantity)
- [x] Task 2: complete (working tree; contract-active check, ended_at intentionally ignored per seed)
- [x] Task 3: complete (working tree; applyAction patch param, org-validated crew)
- [x] Task 4: complete (working tree; 4-step wizard RHF+zod)
- [x] Task 5: complete (working tree; transporter crew-assignment ack dialog)
- [x] Task 6: complete (working tree; action buttons wired, tour-detail.tsx deleted)
- [x] Task 7: complete (working tree; AGENTS.md tournee workflow rule)
- [x] **Plan 5 COMPLETE (working tree, single final commit pending)**

## Plan 6: Create Forms Overhaul (2026-08-14-6-create-forms-overhaul.md)

- [x] Task 1: complete (working tree; field-schema builder, zod v4 nuances)
- [x] Task 2: complete (working tree; EntityForm → RHF+zod, contract preserved, entity-form.test.ts added)
- [x] Task 3: complete (working tree; form-ui SubmitButton/FormSection/Spinner)
- [x] Task 4: complete (working tree; pickups wizard → RHF+zod inline errors)
- [x] Task 5: complete (working tree; user + certificate sheets → RHF+zod)
- [x] Task 6: complete (working tree; AGENTS.md form rules)
- [x] **Plan 6 COMPLETE**

## Plan 7: Overview Landing & Dashboards (2026-08-14-7-overview-dashboards.md)

- [x] Task 1: complete (working tree; buildDashboardView(role, scope), viewRole threaded)
- [x] Task 2: complete (working tree; LANDING_BY_ROLE all → /overview, route-access.test updated 20/20)
- [x] Task 3: complete (working tree; sidebar title links landingPathFor(activeRole))
- [x] Task 4: complete (working tree; OverviewPage revived + scoped dashboard metrics, /overview route renders it)
- [x] Task 5: complete (working tree; rolePanelVisibility gates panels, useMemo dep fixed, per-role routes already pass role+internal scope)
- [x] Task 6: complete (working tree; AGENTS.md §5 landing + dashboard rules)
- [x] **Plan 7 COMPLETE**

## Plan 8: Toasts, Notifications & README (2026-08-14-8-toasts-notifications-readme.md)

- [x] Task 5: complete (working tree; AGENTS.md notification rules)
- [x] **Plan 8 COMPLETE**
- [x] **ALL 8 PLANS COMPLETE — final commit 835e0bc (49 files, +3327/−742). Verified: 427 unit tests, typecheck clean, turbo lint 0 errors, turbo build OK. Working tree clean (only git-ignored .superpowers scratch).**
- [x] **WHOLE-BRANCH REVIEW COMPLETE — review fixes 77b7ba6..905410c (6 commits): C1 scope AGENT fix, I1 createTour site guard, I2 axios French toasts, I5 pickups wizard scoping, M3 created_by, M4 crew clear on mode change, M5 source site persist. Final: 434/434 tests, typecheck clean, lint 0 errors.**
- Remaining follow-ups (Minor, recorded for later): trucks/users/anomalies/sites builders unscoped (AGENTS.md wording over-promises — soften doc or extend); MFA gate + useReport + runMutation shipped-but-unwired (dead code); pickup emits tour:update (wrong event); own-mutation ws:notify badge/sound noise; updateUser unguarded; scopeWithOrgId org-add for LIVREUR/AGENT; getTourActivityById unscoped; TourActions patch-less ack; wizard mode switch now clears crew (fixed); EXTERNAL with stray marketeur vehicle (validateTour has no rule).
- **FOLLOW-UP WAVE 1 COMPLETE — commit 9c4058a (10 files, +93/−11):** trucks org-scoped + tour-tracking detail scoped; updateUser guard (patch-only role/org change); pickup ws event removed; MFA gate mounted; extractErrorMessage adopted in tour wizard; AGENTS.md scoping claim softened. Verified: 434/434 tests, typecheck clean, lint 0 errors.
- Remaining (Minor, still open): useReport/createReportAndPoll + runMutation still unwired (dead code); sites/users/anomalies builders unscoped (AGENTS.md now names the scoped set); own-mutation ws:notify badge/sound noise; scopeWithOrgId org-add weakens LIVREUR/AGENT isolation; TourActions patch-less ack bypasses crew path; EXTERNAL tour with stray marketeur vehicle (no validateTour rule).
- **HARDENING WAVE COMPLETE — commit d6b9bdc (10 files, +100/−45):** EXTERNAL pre-ack crew rejection (chk_tournee_external_crew, state-aware); acknowledge requires transporter crew (store gate + no bare ack in TourActions); runMutation/describeFeedback removed (YAGNI), extractErrorMessage adopted; ws events tagged with actor id, notification center ignores self-triggered events. Verified: 436/436 tests, typecheck clean, lint 0 errors.
- Remaining (Minor, still open): sites/users/anomalies builders unscoped (AGENTS.md now names the scoped set); scopeWithOrgId org-add weakens LIVREUR/AGENT isolation; useReport/createReportAndPoll unwired (waiting for reports feature).
- **SCOPE HARDENING COMPLETE — commit 60954e4 (3 files, +43/−6):** `scopeWithOrgId` now adds the org id only for site/transporter views; AGENT/LIVREUR never match org-wide rows. Tests for agent/livreur/transporter added; AGENTS.md semantics documented. Verified: 439/439 tests, typecheck clean, lint 0 errors.
- Remaining (Minor, still open): sites/users/anomalies builders unscoped (AGENTS.md now names the scoped set); useReport/createReportAndPoll unwired (waiting for reports feature).

## Environment notes

- vitest browser mode fails with `EACCES` in this sandbox. Use `--browser=false` / `test:unit` (already excludes browser tests).
- Plan/spec files are git-ignored (superpowers scratch) — they are working docs only.
- **WORKFLOW CHANGE (2026-08-14, after P4T1): user instructed to STOP per-task commits. Implement all remaining work as one block, then commit ONCE at the end.**

## Minor findings (carried forward)

- (none yet)

## Plan series 2026-08-17 (CRUD + contracts + permissions)

Spec: `docs/superpowers/specs/2026-08-17-crud-contracts-permissions-design.md`
Plans: `docs/superpowers/plans/2026-08-17-{1..4}-*.md`
Per-task commits authorized (subagent-driven). Base: `60954e4`.

- [x] Plan 1 Task 1 (contracts.* codes + grants) — commit 8209c42, review clean. Minor: manage→suspend implication lets MARKETEUR pass contracts.suspend (store must gate suspend to regulateurs in P3T3); commit also carries the earlier uncommitted pickups.validate work (plan-intended, supply=9).
- [ ] Plan 1 Task 2 (table→resource map) — SUPERSEDED by centralization decision: user wants pure-data RBAC in `@lpg/permissions`, not `apps/web/src/config/rbac`. Commit 96d26f5 created the map in the wrong place; will be relocated to the package and the web copy deleted. See P1T2b below.
- [x] Plan 1 Task 2b (relocate map into @lpg/permissions, delete web copy) — commit 273ef6b, review clean (Spec ✅, Approved). Pure data centralized; nav/sidebar stay in web (behavior).
- [ ] Plan 1 Task 3 (nav gating + WS event)
- [ ] Plan 1 Task 4 (sites transition gating)
- [ ] Plan 2 Task 1 (FieldConfig constraints + helpers)
- [ ] Plan 2 Task 2 (zod rules + tests)
- [ ] Plan 2 Task 3 (FileInput + org auto-fill/hide)
- [ ] Plan 2 Task 4 (constraint audit of existing configs)
- [ ] Plan 3 Task 1 (schema/type/fixtures)
- [ ] Plan 3 Task 2 (status machine + tests)
- [ ] Plan 3 Task 3 (contracts store + tests)
- [ ] Plan 3 Task 4 (store-backed page + dialog + actions)
- [ ] Plan 3 Task 5 (EXTERNAL wizard filter)
- [ ] Plan 3 Task 6 (docs sync)
- [ ] Plan 4 Task 1 (zones CRUD)
- [ ] Plan 4 Task 2 (zone→map deep-link)
- [ ] Plan 4 Task 3 (livreurs CRUD)
- [ ] Final whole-branch review
- [x] Plan 1 Task 3 (nav gating + contract:update WS) — commit 1f27fa8, contract changes review clean; existing pickup:update mapping was preserved as prior uncommitted work included in the shared WS file.
- [x] Plan 1 Task 4 (sites transition gating) — commit d5983be, review clean.
- [x] Plan 2 Task 1 (FieldConfig constraints + helpers) — commit cd36fc1, review clean.
- [x] Plan 2 Task 2 (zod rules + tests) — commits a1e91a2/6b03a21/02e1014, final re-review clean; optional number empty-input bug fixed. Minor: plan says pattern RegExp but live API uses string.
- [x] Plan 2 Task 3 (FileInput + org auto-fill/hide) — commits 305c55e/cafb770/01e02ae/549500a, review clean after reset-key hardening.
- [x] Plan 2 Task 4 (constraint audit) — commit f11733b, review clean.
- [x] Plan 3 Task 1 (contract schema/type/fixtures) — commits 75c0a5a/8ae2c0f, final review clean; valid existing ID substitution documented; lifecycle seed covers UPCOMING.
- Workflow override: user instructed no further commits. Continue remaining tasks in working tree only; existing commits remain untouched.
- [x] Plan 3 Task 2 (status machine + tests) — base commit 968e964 plus uncommitted fixes; final review clean. No additional commit per user bulk-commit instruction.
- [x] Plan 3 Task 3 (contracts store + tests) — uncommitted working-tree implementation; final review approved for contract scope. Reviewer noted unrelated pre-existing pickup-store scope gaps, not part of this task.
- [x] Plan 3 Task 4 (store-backed contracts UI + guarded edit/actions) — uncommitted working-tree implementation; final review approved.
- [x] Plan 3 Task 5 (EXTERNAL wizard ACTIVE contract filter) — uncommitted working-tree implementation; review clean.
- [x] Contract integration hardening (tour validation, transporter views, mock API actions, scatafold API docs) — uncommitted; focused tests/typecheck/lint pass. Reviewer found only pre-existing pickup worktree changes; report exists.
- [x] Plan 4 Task 1 (zones CRUD) — uncommitted; final review clean after region-select and distinct map callback fixes.
