# Task 9 Report — `features/map/lib/layers.ts` (+ test) — TDD

**Status: PASS** (typecheck + tests + lint all green)

## Files created

| File | Purpose |
|------|---------|
| `apps/web/src/features/map/lib/layers.ts` | Implementation: `MapLayerKey`, `MapLayerSpec`, `getInitialLayers()`, `buildLayerSpecs()` |
| `apps/web/src/features/map/lib/layers.test.ts` | Vitest test (4 tests, 2 suites) |

## TDD flow

### RED (test fails first)

```log
FAIL  src/features/map/lib/layers.test.ts
Error: Cannot find module './layers' imported from
C:/Users/DTA_WorkStation/Documents/manga/lpg-fleet-management-ui/apps/web/src/features/map/lib/layers.test.ts
Test Files  1 failed (1)
Tests       no tests
```

`layers.ts` did not exist; the import failed as expected.

### GREEN (implementation makes tests pass)

```log
Test Files  1 passed (1)
Tests       4 passed (4)
Duration    5.86s
```

All 4 tests pass.

## Typecheck

```log
> typecheck
> tsc --noEmit -p tsconfig.app.json
```
No errors (exit 0).

## Lint

```log
npx eslint src/features/map/lib/layers.ts src/features/map/lib/layers.test.ts
```
No errors (exit 0, empty output).

## Implementation notes (verified facts applied)

1. **`MapTheme`** imported from `features/map/utils/map-theme.ts` — `mapThemeDefault` does not exist; the test uses `const theme: MapTheme = 'light'`.
2. **`siteMarkerTokens`** imported from `features/sites/utils/site-graphics.ts`, indexed by `SiteType`. Uses `siteMarkerTokens['filling-center']` for the sites layer and `siteMarkerTokens['delivery-point']` for clientSites.
3. **`getSiteIconUrl(type, theme)`** + **`rgbaFromTuple(token.color)`** used for marker icon/color on sites and clientSites layers — matches the `/trucks` reference pattern.
4. **Popup builders** imported from `features/map/utils/popup.tsx` (Task 3): `buildSitePopupContent`, `buildClientSitePopupContent`, `buildZonePopupContent`, `buildRegionPopupContent`, `buildAnomalyPopupContent`, `buildVracPopupContent`.
5. **`NationalMapView`** imported as type from `features/map/data/national-map.ts` (Task 8). The `vrac` layer reads `view.vrac` directly.
6. **Toggle order**: sites, clientSites, zones, regions, anomalies, vrac — 6 layers, 4 enabled by default.

## Concerns

- The `write` tool had a JSON serialization issue with emoji characters in marker icons. Used ASCII text placeholders (`'zone'`, `'region'`, `'anomaly'`, `'vrac'`) instead of emoji glyphs for zones/regions/anomalies/vrac layer markers. This is purely cosmetic — the test only asserts `typeof spec.marker.icon === 'string'`. If emoji icons are preferred for the final UI, they can be substituted later (e.g. via `🟦`/`⚠`/`🛢`) once the serialization issue is resolved.
- No commit performed (per instructions). Continue to Task 10 (nav wiring).
