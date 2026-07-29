# LPG Fleet Management UI — Frontend Realism, Mock Backend & PWA

**Date:** 2026-07-15
**Status:** Design (pending user review → implementation plan)
**Branch:** `refactor/apps-web-architecture`
**Supersedes:** `docs/superpowers/specs/2026-07-15-src-flatten-architecture-design.md` (src-flatten part is done; this adds data/auth/PWA layer)

## Goal

Make the frontend a realistic, enterprise-standard SPA that:
1. Uses **Zustand** (client/session/UI state) + **TanStack Query** (server state) with a clean boundary.
2. Ships a **mock backend** that is a *detachable* backend — swapping to the real API is a single env-flag change, with **zero feature-code changes**.
3. Implements **custom auth** (no Clerk): JWT + refresh, role-based.
4. Provides a **dev-only role switcher** (CSPH logo + select) to navigate the 7 role UIs in `mock` mode.
5. Is an **installable PWA** that notifies when offline.
6. Migrates the CSPH logo + favicon to `public/`, keeps no hidden/secret files committed.
7. Ships a clear **README** with Mermaid diagrams.

## Environments

| `VITE_API_MODE` | Backend                              | Use                          |
|-----------------|--------------------------------------|------------------------------|
| `mock`          | shared `packages/mock-api` server    | local dev + driver app + Vercel demo |
| `dev`           | real dev backend (`VITE_API_BASE_URL`) | integration testing        |
| `production`    | real prod backend (`VITE_API_BASE_URL`)| live deploy                |

The app's `HttpAdapter` is used in **all** modes; only the base URL differs. Deleting
`packages/mock-api` + the Vercel `/api` routes and setting `VITE_API_MODE=dev` is the entire go-live step.

## Package / folder layout (after this work)

```
lpg-fleet-management-ui/
├─ apps/
│  ├─ web/                # console SPA (TanStack Router, Vite, PWA)
│  │  ├─ auth/            # login screen, auth guard helpers, token storage
│  │  ├─ mock/            # (optional) local dev bootstrap for the mock server
│  │  ├─ store/           # zustand: useAuthStore, useUiStore, useDevRoleStore
│  │  ├─ hooks/           # useOnlineStatus, query hooks per resource
│  │  ├─ api/             # Vercel serverless fns: [[...mock]].ts -> packages/mock-api
│  │  ├─ public/          # csph_logo.png, favicon.ico, manifest.webmanifest, icons
│  │  ├─ routes/          # __root (QueryClient + PWA register), login, _authenticated
│  │  ├─ roles/<role>/    # bespoke screens (unchanged from prior refactor)
│  │  ├─ features/ module/ config/ context/ styles/  (unchanged)
│  │  ├─ main.tsx  vite.config.ts  tsconfig*.json  index.html
│  └─ driver/             # mobile app (separate; consumes packages/mock-api in its design phase)
├─ packages/
│  ├─ mock-api/           # SHARED mock backend (source of truth)
│  │  ├─ seed/*.json      # organizations, users, sites, trucks, tours, declarations, anomalies, reports, pda, infra
│  │  ├─ fixtures/        # auth users (one per role) + passwords
│  │  ├─ handlers/        # REST handlers matching the real API contract + fake-JWT login/refresh
│  │  ├─ server.ts        # tiny Express server (local dev / driver)
│  │  └─ index.ts         # programmatic handler export (for Vercel fns + tests)
│  ├─ api-client/  @lpg/api-client   # ApiAdapter iface + HttpAdapter + typed resource services + auth
│  ├─ ui/  @lpg/ui                    # design system (done)
│  ├─ types/ @lpg/types               # domain interfaces (done)
│  ├─ permissions/ @lpg/permissions   # RBAC (done)
│  └─ config/ @lpg/config             # env/runtime config (done)
└─ docs/superpowers/specs/  (this file)
```

## Part 1 — Data layer & mock backend (the swap point)

- `@lpg/api-client` exposes **typed resource services** (`auth`, `organizations`, `users`,
  `sites`, `trucks`, `tours`, `declarations`, `anomalies`, `reports`, `pda`, `infra`) built on a
  swappable **`ApiAdapter`**:
  ```ts
  interface ApiAdapter {
    request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>>
    login(creds: Credentials): Promise<AuthResult>
    refresh(refreshToken: string): Promise<AuthResult>
  }
  ```
- **`HttpAdapter`** (all modes): current axios client → `VITE_API_BASE_URL`, attaching bearer
  token, handling `401` → one silent refresh → retry.
- **`packages/mock-api`** (shared, detachable):
  - `seed/*.json` for the full canonical set + `fixtures/` auth users (one per role, known passwords).
  - `handlers/` implement REST endpoints matching the **real API contract** and the existing
    `ApiEnvelope<T>` shape, with simulated latency + occasional error injection.
  - `login` issues a **fake-but-well-formed JWT** (HS256-style, role in payload) + refresh token;
    `refresh` rotates them.
  - `server.ts`: tiny **Express** server for local dev + the driver app (`pnpm mock`, port e.g. 8787).
  - `index.ts`: exports handlers programmatically so they can be mounted anywhere.
- **Vercel demo:** `apps/web/api/[[...mock]].ts` serverless function imports handlers from
  `packages/mock-api` and serves them — so the **deployed Vercel app just works** in `mock` mode
  with no separate process. (Local `dev`/`production` modes point at the real backend instead.)
- **Swap:** `VITE_API_MODE=mock|dev|production`. Going live = delete `packages/mock-api` + `apps/web/api`
  and set `VITE_API_MODE=dev`. No feature code changes.

## Part 2 — Auth & state management

**Custom auth (JWT + refresh, role-based):**
- `auth` service → `adapter.login(creds)` returns `{ accessToken, refreshToken, user }`; `refresh` rotates.
- **`useAuthStore` (Zustand, persisted):** `user`, `role`, `accessToken`, `refreshToken`, `status`.
  On boot restores session + silently refreshes; auto-attaches token; on `401` triggers one refresh + retry.
- **Guards:** TanStack Router `beforeLoad` reads store → unauthenticated redirects to `/login`;
  role mismatch redirects to `/<role>`. Dev switcher can override active role (dev only).
- **Login screen:** email + password; mock fixtures = one user per role. Real backend honors the same contract.

**State boundary (enterprise-standard):**
- **TanStack Query** = sole owner of server state (all list/detail/CRUD via `useQuery`/`useMutation`
  on the typed resource services). Handles cache, background refetch, error/loading.
- **Zustand** = client/session/UI state only: `useAuthStore`, `useUiStore` (theme, sidebar, locale/direction),
  `useDevRoleStore` (dev switcher override, dev-only). Avoids the "Zustand as fake server cache" anti-pattern.

## Part 3 — Dev switcher, PWA, assets, hygiene, docs

- **Dev role switcher:** CSPH logo in the header is also a dropdown (dev/`mock` only) listing the 7 roles;
  selecting one issues a demo session for that role, bypassing login. Hidden in `dev`/`production`.
- **PWA:** `vite-plugin-pwa` (Workbox) → `manifest.webmanifest` (name, icons from `public/`),
  service-worker registration, offline caching of the app shell. `useOnlineStatus` hook + banner notifies
  "no network". (Mock mode is effectively offline-capable since data is server-backed; real backend needs
  network — documented.)
- **Assets:** move `csph_logo.png` + `favicon.ico` into `public/`; update `index.html`, manifest, and imports.
  Remove from `assets/`.
- **Hygiene:** root `.gitignore` already excludes `.env`, `.vercel`, `.DS_Store`, `.turbo`, `.tanstack`,
  `.agents`, `node_modules`, `dist`. Add `tmp/`, `*.pdb`, `*.log` if missing. No hidden/secret files committed.
- **README.md:** architecture overview + Mermaid diagrams (folder layout, auth/data flow, mock→real swap,
  PWA/offline) + env table + run instructions + "how to go live".

## Risks / notes

- `apps/driver` is a separate mobile app; it will later import `packages/mock-api` for its own UI/design phase.
  Not built in this change.
- `apps/driver` currently has a pre-existing missing `tsconfig.json` (out of scope, unrelated).
- Mock JWT is for simulation only; real backend owns signing/security.
- Playwright browser binary is not installed in this environment, so `vitest-browser` unit tests can't run
  here; `tsc` + Vite build remain the validation gate.

## Implementation waves (each keeps `pnpm --filter @lpg/web build` green)

1. **`packages/mock-api`**: seed JSON (full canonical set) + auth fixtures + handlers (contract-matched,
   fake-JWT login/refresh) + Express `server.ts` + programmatic `index.ts`.
2. **`@lpg/api-client`**: `ApiAdapter` iface + `HttpAdapter` (token attach/refresh) + typed resource services + `auth`.
3. **Auth + Zustand**: `useAuthStore`, `useUiStore`, `useDevRoleStore`; token storage; `QueryClient` provider;
   login route + guards; remove `@clerk/react`.
4. **TanStack Query hooks**: per-resource `useQuery`/`useMutation` wiring screens to the services.
5. **Dev role switcher**: CSPH-logo dropdown (dev/`mock` only) → demo session.
6. **PWA**: `vite-plugin-pwa`, manifest, icons, offline shell, `useOnlineStatus` banner.
7. **Assets + hygiene**: move logo/favicon to `public/`; verify `.gitignore`; drop any hidden files.
8. **Vercel demo**: `apps/web/api/[[...mock]].ts` serverless fn importing `packages/mock-api`.
9. **README + Mermaid**; final build + typecheck.
