# Design: /map full live-wire + backend seeding

Date: 2026-09-28. Status: approved, pending implementation plan.

## 1. Goal

`/map` (NationalMapPage + 8 ArcGIS layers) renders 100% from
`@lpg/mock-data` today. Rewire it fully to the Spring backend so every
layer, popup, badge, and search item reflects live rows, and seed the
backend so no layer is empty in dev/test/local.

## 2. Non-goals

- No changes to dashboard/i18n work in the dirty tree.
- No road-network routing (straight corridor polylines stay).
- No new backend read endpoints (all required ones exist).

## 3. Slice A — backend fleet-device seeder (csph-fleet-backend)

New `FleetDeviceDataInitializer` (`@Profile dev,test,local`,
`fleet-device-service/.../fleet/config/`), after `TimescaleDbInitializer`:

- Vehicles (6): 2 VRAC + 2 BOUTEILLES50KG linked to seeded orgs
  (MKT-GPL, TRP-ABC), `licensePlate CE-xxxx`, `maxVolume/maxBottleCount`,
  certificate fields set, `isActive=true`.
- Devices (6): GPS trackers, one per vehicle via assign fields
  (`assignedToVehicleId`), `lastLatitude/lastLongitude` on the
  Douala↔Yaoundé corridors, `batteryLevel` 60–95.
- Telemetry (per vehicle, last 24h, 5-min steps): trail from depot
  toward first seeded checkpoint city (Douala cluster 4.0x,9.7x /
  Yaoundé cluster 3.8x,11.5x), `speed` 0–80, `heading` along corridor,
  JTS `Point(lon,lat,4326)`.
- Assign seeded tours' `vehicleId`: update `TourDataInitializer`
  placeholders (`VEH-MKT-GPL-001`) to real seeded vehicle IDs so
  tour→telemetry joins resolve.

Verify: boot `fleet-device-service` on `local`, `GET /vehicles` → 6,
`GET /telemetry/vehicles/{id}/latest` + `?start&end` return trail.

## 4. Slice B — port CSPH api-client (manga repo, packages/api-client)

- `http-adapter`: `resolveBaseURL` fallback `...:18080/api/v1`;
  `LIST_PATH_ALIASES` + `PREFIX_PATH_ALIASES` (no `/scan-events`→`/scans`
  alias — tour-service owns PDA evidence); envelope + error + pagination
  normalization as in CSPH.
- `api.ts`: `tours.*` (lifecycle), `pickups.*`, `recordScan` +
  `bulkScanUpload` (`{ items }` shape), `telemetry.latest(vehicleId)` +
  `telemetry.history(vehicleId,start,end)`, `sites.nearby(lat,lon,radius)`.
- Retire `fake-adapter` on the map path (leave file until no importers).
- `VITE_API_MODE` dead in this repo too — read base URL only.

Verify: `pnpm --filter @lpg/api-client typecheck` (add script if missing).

## 5. Slice C — map live data-layer (apps/web/src/features/map)

- New `data/national-map-live.ts`: async builders per layer via
  `lib/api/use-resources`-style React Query hooks
  (`sitesHooks`, `vehiclesHooks`, `deliveryToursHooks`, devices).
  Cylinder scan reads use a new explicit `scans` resource
  (`/scans`, NOT the `scanEvents` resource which targets tour-service
  writes).
- Joins (client-side, documented): checkpoint `siteId/clientSiteId` →
  site coords via `GET /sites/{id}` cache; truck pin = vehicle +
  `telemetry/latest`; trail = `telemetry?start&end` over tour period;
  client markers = `client-sites` + linked site coords (backend has no
  client geo); visits verification flag joined for client popups;
  GPS-device positions joined where `assignedToVehicleId` matches.
- `national-map.tsx` consumes `NationalMapViewLive | null` + per-layer
  loading/empty states; `[0,0]` null-island guard (drop coords
  `lat===0 && lng===0`); stable heatmap IDs (no `Math.random`).
- Remove mock footer disclaimer when live; wire `entityFilter`,
  `refreshToken`→`refetch`, search covers trucks/anomalies.
- Keep pure helpers + colocated tests (`lib/*`, `getPeriodRange`,
  `toAcronym`); add tests for join/geo-guard logic.

Verify: `npm run typecheck`, `npm run lint`, `npm test` for map scope;
boot web against docker backend, confirm 8 layers populated.

## 6. Conventions compliance (AGENTS.md)

Feature-folder pattern kept; no mock/demo data in shipped code;
VRAC in TM; EN code / FR labels; shared types from `@lpg/types`;
zero redundancy (reuse `use-resources`, stores).

## 7. Commit plan

- Backend repo: `feat(fleet): seed vehicles, devices, telemetry trails
  + link tour vehicles` (fleet-device-service + tour-service seeders).
- Frontend repo: `feat(api-client): port live adapter + tours/pickups/
  telemetry` then `feat(map): live-wire national map layers` —
  map + client files only, dashboard tree untouched.
- PRs to `develop` of each repo's origin repo.
