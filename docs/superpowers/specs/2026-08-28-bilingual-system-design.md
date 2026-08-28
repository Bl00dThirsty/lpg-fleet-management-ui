# Bilingual System (English ↔ French) — Design Spec

Date: 2026-08-28
Status: Approved for implementation (Approach 2 — Namespaced + lazy-loaded)
Scope: `apps/web/src/**` (60+ features), `src/lib/i18n`, `src/components/layout/language-switcher.tsx`, `src/store/preferences-store.ts`, `public/locales/**`, `config/rbac/nav-items.ts`, `config/field-options.ts`, `lib/breadcrumbs.ts`

## 1. Goals

Make the **entire system 100% switchable English ↔ French** by the user at any time, with zero French hardcode remaining in the UI. The switch is instant, persisted, and reflected in:
- All human-visible strings: navigation (`config/rbac/nav-items.ts` 67 labels), page headers, tables (`meta.label`, `KpiTile label`), forms (`Label`, `FormMessage`, zod errors), toasts (`sonner` via `hooks/use-toast-feedback`), dialogs, empty states, charts, command palette
- Formatting: dates (`date-fns` + `Intl.DateTimeFormat`), numbers/currency (`Intl.NumberFormat`), volumes (`TM`/`btl` units per `AGENTS.md §6` — symbols stay, number formatting localizes), percentages, times
- Validation and errors: `zod` error maps, `handle-server-error.ts`, permission denials
- Mirrored switcher in two places: compact **header toggle** (primary) + **Settings > Preferences > Langue et région** (`features/settings/profile.tsx:711-746`). Both write the same source of truth.

First-visit default is **`fr-FR`** (Cameroon primary market). Missing English keys fall back to French (never blank). No URL prefix, no backend sync in v1.

## 2. Non-Goals (v1)

- URL-prefixed routes (`/:lang/...`) — deferred (would touch 81 TanStack Router routes + `routeTree.gen.ts` + breadcrumbs + guards). Follow-up milestone if needed.
- Backend-synced preference (`PATCH /users/:id/preferences`) — deferred; v1 is per-browser `localStorage` (`lpg-user-preferences`).
- Third language, RTL, SSR, SEO hreflang.
- Translating infrastructure logs/Grafana/Prometheus (ops-only, outside web app).

## 3. Context & Graphify Evidence

- Corpus: `graphify detect` on repo root → **774 files / ~409k words**, `apps/web/src` alone **607 files** (374 in `features/`, 85 `components/`, 81 `routes`, 21 `lib`). Warning: large corpus — semantic extraction expensive, hence namespaced incremental migration over single-bucket.
- Prior state: zero i18n library installed (grep `i18n|i18next|react-intl|lingui` → 0 hits besides a comment `// i18n label (kept simple — French by default)` at `config/rbac/nav-items.ts:74`). Grep `label:` → 558 hits in features, 456 `Créer|Modifier|Supprimer|…` literals, `field-options.ts` 20 French maps, `nav-items.ts` 67 labels, `breadcrumbs.ts` `LABEL_MAP` 10+ entries — all hardcoded.
- Existing dead toggle: `store/preferences-store.ts:5-28` has `language: 'fr-FR'|'en-US'` persisted but `features/settings/profile.tsx:664` renders `en-US` as `disabled` `"English — bientôt"` + `"D'autres langues seront ajoutées…"`. Hardcoded formatters: `toLocaleString('fr-FR')` / `Intl.NumberFormat('fr-FR')` / `date-fns/locale fr` in `features/map/utils/format.ts:1`, `features/finance/data/finance.ts:14`, `dashboard/data/dashboard.ts:387`, etc. These are the exact sites to localize.

## 4. Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Library | `react-i18next` + `i18next` (no `i18next-browser-languagedetector`; store is detector) | Standard, works with Zustand, supports namespaces, interpolation, plural, zod mapping; lighter than lingui/formatjs compiler transforms |
| Bundle strategy | Namespaced JSON per domain (`common`, `nav`, `fields`, `errors`, `bills` per `features/<domain>/`), lazy-loaded via `i18next-http-backend` or bundled via `import.meta.glob` (choose bundled in v1 to avoid fetch latency; switch to HTTP lazy if bundle > threshold) | Matches `AGENTS.md §3` — one domain = one feature tree; avoids giant single `common.json` merge conflicts; 60+ domains — per-route payload stays small |
| Source of truth | `usePreferencesStore.language` (`fr-FR`/`en-US`) → `i18n.changeLanguage()` + `document.documentElement.lang` + formatter locale | Reuses existing persisted store; single subscription point; no duplicate detector logic |
| Fallback | `fallbackLng: 'fr'`, `fallbackNS: 'common'`, `returnEmptyString: false` | Missing English keys show French, never empty — shippable during incremental migration |
| Locale mapping | `fr-FR` → `fr` (date-fns `fr`, Intl `fr-FR`), `en-US` → `enUS` (date-fns `enUS`, Intl `en-US`) | `date-fns` locales are `fr` / `enUS`; `Intl` uses BCP-47 |
| Plural/units | ICU plurals handled by `i18next`; units `TM`, `btl`, `XAF` per `AGENTS.md §6` stay symbolic, only number formatting localizes | Preserves domain invariant (TM not liters, never kg) |
| Bulk translation | One-time AI pass `fr→en` to seed `en/*.json`, human review before merge | 1,500+ keys — manual from scratch would block v1 |
| Lint guard | ESLint rule `no-restricted-syntax` for raw French literals (`/Créer|Enregistrer|Supprimer/` heuristics) + CI `scripts/check-i18n-coverage.ts` (missing keys) | Prevents regressions — new features can't re-introduce hardcode |

## 5. Architecture

```
apps/web/
  public/locales/
    fr/
      common.json        # toasts, buttons (Créer/Modifier/Annuler/Enregistrer), generic states, pagination
      nav.json           # 67 nav labels (keys mirror NAV_CATALOG ids: overview, dashboard, marketers…)
      fields.json        # enum label maps (site, tour, pickup, declaration, risk, vehicle, org, device…)
      errors.json        # zod + server error messages, permission denials
      breadcrumbs.json   # LABEL_MAP
      overview.json, dashboard.json, tours.json, pickups.json, declarations.json,
      market… (one file per features/<domain>)
    en/  (mirror, same keys, English values)
  src/lib/i18n/
    index.ts             # createInstance, init, resources, fallbackLng, ns, interpolation
    config.ts            # init options, loadPath / resources, detection wiring
    formatters.ts        # formatDate(date, opts), formatNumber(n), formatTM(n), formatBtl(n), formatXAF(n), formatPercent(n)
                          # each reads language from store or receives locale param; wraps Intl + date-fns with locale map
    zod.ts               # getZodErrorMap(locale) → zod locale map; wired in schemas or at form provider
  src/components/layout/
    language-switcher.tsx  # props: variant='header'|'settings'; uses usePreferencesStore + useTranslation
  src/store/preferences-store.ts  # already persists language — add effect to sync i18n + html lang (or lib/i18n subscribes)
  src/features/settings/profile.tsx # un-disable en-US, wire Select to store+ i18n (remove "bientôt")
  scripts/
    extract-i18n-keys.ts   # scans label:/toast literals → inventory + missing-key diff
    check-i18n-coverage.ts # CI: compares fr/en key sets, fails on missing en keys beyond allowlist
```

Module boundaries:
- `lib/i18n` is the only place that imports `i18next`; features import `useTranslation(ns)` from `react-i18next`, never `i18next` directly (keeps bundle edge thin, testable).
- Pure data builders (`features/*/data/*.ts`) receive `t` as arg or call formatters passed in, rather than importing French strings — keeps them locale-agnostic and unit-testable with stub `t`.

## 6. Data Flow

```
Initial load
  usePreferencesStore (persist: localStorage lpg-user-preferences) defaults language='fr-FR'
  → lib/i18n/index.ts init({ lng: store.language.slice(0,2), fallbackLng:'fr', ns:[...], resources })
  → document.documentElement.lang = language (a11y, spellcheck, html lang)
  → formatters load date-fns locale map { fr, enUS }

User switches FR ↔ EN
  Header LanguageSwitcher (or Settings Select) onValueChange
  → usePreferencesStore.setLanguage(next)  (persisted)
  → effect: i18n.changeLanguage(next.slice(0,2))  // 'fr' | 'en'
  → document.documentElement.lang updated
  → all useTranslation(ns) consumers re-render (react-i18next); formatters re-read language
  No page reload, no route change.

Rendering
  Feature: const { t } = useTranslation('tours')
           <PageHeader title={t('title')} description={t('description')} />
           <DataTable columns={[{ meta:{ label: t('columns.id')}}]} />
  Field options: const { t } = useTranslation('fields')
                 SITE map → t('fields:site.UNASSIGNED') else fallback French
  Dates: formatDate(d, { locale })  where locale = language === 'en-US' ? enUS : fr
  Numbers: new Intl.NumberFormat(language).format(n) + ' TM'  (unit literal from translation or constant)
```

## 7. Components & Touchpoints (files to change)

- `apps/web/package.json` add `i18next@^23`, `react-i18next@^14`, (optional `i18next-http-backend` if lazy)
- `src/lib/i18n/{index,config,formatters,zod}.ts` (new)
- `src/components/layout/language-switcher.tsx` (new), integrate in `components/layout/header.tsx` or `components/layout/main.tsx` / `AppSidebar` header area
- `src/store/preferences-store.ts` — keep type, add sync effect (or `lib/i18n` subscribes to store)
- `src/config/rbac/nav-items.ts` — replace 67 `label: 'French'` with key refs; `toSidebarItem` calls `t('nav:${id}')`; provide helper `getNavLabel(id, t)`
- `src/config/field-options.ts` — replace 20 French maps with `t('fields:...')` lookups; keep `OptionDef` shape
- `src/lib/breadcrumbs.ts` — `LABEL_MAP` → `t('breadcrumbs:${segment}')`
- `src/features/settings/profile.tsx:663-744` — enable `en-US`, drop "bientôt" helper, wire `Select` to `store+i18n`
- `src/features/**` (60+ domains) — per-domain JSON + `useTranslation(domain)` replacements; priority order Phase 2a: `overview` (`src/features/overview`), `dashboard`, `tours`, `pickups`/`pickup-tracking`, `declarations`/`reconciliations`/`redressements`, `marketers`, `transporters`, `sites`, `vehicles`/`devices`, `users`/`permissions` (remaining Phase 2b)
- `src/lib/handle-server-error.ts`, `hooks/use-toast-feedback` (new path), `components/confirm-dialog.tsx`, `features/notifications/**` — error/toast strings via `common`/`errors`
- All `toLocaleString('fr-FR')` / `Intl('fr-FR')` / `date-fns/locale fr` sites → `formatters.ts` wrappers

One file per responsibility preserved (`AGENTS.md §3`); data lives in `data/`, never re-declared at feature root.

## 8. Testing Strategy

- Unit (`vitest run --browser=false`):
  - `lib/i18n/index.test.ts` — init with `fr` vs `en`, missing key falls back to French
  - `lib/i18n/formatters.test.ts` — `formatTM(1234.5)` → `1 234,5 TM` (fr) vs `1,234.5 TM` (en); `formatDate` month names `fr` vs `enUS`; `formatXAF`
  - `config/rbac/nav-items.test.ts` — `buildSidebarFor('SUPERADMIN')` titles in `fr` vs `en`
  - `config/field-options.test.ts` — each enum map translates both locales
  - `features/*/data/*.test.ts` existing tests updated to assert both locales where they assert French labels (e.g. `depots.test.ts: 'labels statuses in French'` → parameterized)
- Integration:
  - `store/preferences-store.test.ts` — `setLanguage('en-US')` persists, reload retains, `i18n.language === 'en'` after effect
  - `language-switcher.test.tsx` — click toggle → store + `document.documentElement.lang` updated
- E2E (`vitest run --browser.headless`):
  - Visit `/overview` → toggle header → assert `h1` `Vue d'ensemble` ↔ `Overview`, `KpiTile` labels, table headers, `Créer` ↔ `Create`, toast `Profil mis à jour` ↔ `Profile updated`, date picker locale months.

## 9. Migration Plan (shippable slices)

- Phase 0 — Scaffold: add deps, create `lib/i18n`, create `fr/*.json` by extracting current French literals (script), seed `en/*.json` via bulk AI translate, add lint+coverage scripts, wire `preferences-store` ↔ `i18n` (no feature string changes yet).
- Phase 1 — Core plumbing: `nav + fields + common + errors + breadcrumbs + formatters` (5 shared files) → validates switch end-to-end.
- Phase 2a — High-traffic domains: `overview`, `dashboard`, `tours`/`tour-tracking`, `pickups`/`pickup-tracking`, `declarations`/`reconciliations`/`redressements`, `marketers`, `transporters`, `sites`, `trucks`/`vehicles`/`devices`.
- Phase 2b — Remaining 50+ domains + notifications + reports + settings internals.
- Each PR is independently shippable (fallbackLng ensures English missing → French, never blank). Script `check-i18n-coverage` runs in CI, allowlist shrinks each phase.

## 10. Acceptance Criteria

- Header toggle + Settings Select both switch language instantly across **all** routes, no reload, persisted after reload, `html[lang]` correct.
- `typecheck && lint && test` green in both locales (`AGENTS.md §8`).
- `scripts/check-i18n-coverage.ts` reports 0 missing `en` keys outside allowlist at Phase 2b gate; `fr` and `en` key sets identical per namespace.
- No remaining hardcoded French literals in `nav-items.ts`, `field-options.ts`, `breadcrumbs.ts`, feature `label:` strings, toasts, or `toLocaleString('fr-FR')` / `Intl('fr-FR')` (all routed through `formatters.ts`).
- Units remain `TM`/`btl` per `AGENTS.md §6`; only number/date formatting localizes.
- Date picker shows `fr` months in French mode, `enUS` in English; numbers show `1 234,5` vs `1,234.5` per formatter tests.

## 11. Risks & Mitigations

- Long English strings overflow: already mitigated by `components/ui` responsive tables; add visual QA on `tours`/`marketers` narrow viewports.
- Bundle bloat from 2× translation files: namespaced load mitigates; measure `dist/` size, switch to `i18next-http-backend` lazy if threshold exceeded.
- 1,500+ key review fatigue: bulk AI + sample-based human review per namespace (owner reviews own domain), fallback keeps product shippable during review.
- Plural/formal register drift: include style note in each `*.json` header (`// Formal, vouvoiement-equivalent tone in FR; neutral professional in EN`).

## 12. Self-Review

- Placeholders: none — all sections concrete (files, counts, keys) derived from codebase grep + graphify detect.
- Consistency: `fallbackLng:'fr'` aligns with FM Cameroon primary + shippable incremental migration; deferred URL prefix noted as follow-up to avoid scope creep.
- Ambiguity: "entire system" resolved to UI + formatting + validation (units invariant per AGENTS.md); explicit fallback behavior defined.
- Scope: fit for one implementation plan with phased PRs — not a single monolithic PR.

---
Approved approach: Approach 2 (namespaced + lazy-capable).
Next: invoke `writing-plans` to create implementation plan.
