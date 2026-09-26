<!-- generated-by: gsd-doc-writer -->
# Security Policy

This repository is the frontend for the CSPH GPL traceability platform — a regulated
system that records the movement of LPG and produces regulatory evidence. Its data model
contains commercially sensitive volumes, government staff accounts, and geolocated
infrastructure. Security issues here are treated as defects, not as feature requests.

## License and authorized use

This is a government proprietary project developed by DTA Innotech Lab. It is licensed **All Rights Reserved**, not as open source. Access and use must follow [`LICENSE`](./LICENSE), applicable government rules, and written project authorization. Do not publish, mirror, sublicense, reverse engineer, or reuse the project outside its authorized purpose.

## Supported versions

The project is a private pnpm workspace at version `0.0.0` and has no published
release train. There is no long-term-support branch.

| Version | Supported |
|---|---|
| The default branch of this repository | Yes |
| Any fork, branch, or deployment not maintained by the project | No |

Security fixes land on the default branch. There is no backport target.

## Reporting a vulnerability

**Do not open a public issue for a security problem.** A public issue leaks the
vulnerability, its reproduction steps, and any data involved.

The repository has a GitHub remote at
`github.com/menoc61/lpg-fleet-management-ui` (canonical upstream:
`github.com/Bl00dThirsty/lpg-fleet-management-ui`). Use GitHub's private vulnerability
reporting for this repository, if it is enabled on the repository's Security settings.

<!-- VERIFY: maintainers must confirm that GitHub private vulnerability reporting ("Report a vulnerability") is enabled on menoc61/lpg-fleet-management-ui, and must publish a monitored security contact address here before relying on it. No such contact is defined in the repository today, so none is invented below. -->

Until that is confirmed, the fallback is a private channel to the maintainers rather than
a public issue. What to send:

- What the vulnerability is, in one or two sentences.
- The affected route, feature, or package (`apps/web/...`, `packages/...`).
- Reproduction steps or a minimal proof of concept.
- The impact you believe it has, and any data or role it touches.
- Whether it is already public anywhere.

Please give maintainers a reasonable window to respond before disclosing publicly. Do not
include real credentials, production tokens, or personal data in a report — a synthetic
reproduction is sufficient.

Non-security bugs belong in the public issue tracker; see
[`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md) for the `gh` CLI
conventions.

## Threat model

What this codebase is, and what an attacker wants from it:

- **Asset 1 — regulated operational data.** Volumes, declarations, reconciliation
  results, and redressements. Altering or suppressing these defeats the platform's
  purpose.
- **Asset 2 — identity and authority.** Staff, marketeur, transporteur, and livreur
  accounts, plus the MFA secrets that protect them.
- **Asset 3 — location data.** Depot, filling-centre, and client-site coordinates.
- **Asset 4 — evidence.** Scan events, proofs, certificates, contracts, and the audit
  trail that gives them legal weight.

Trust boundaries:

1. **Browser → backend.** The SPA is untrusted. It holds no authority of its own; every
   decision must be re-validated server-side. Client-side guards are usability and
   defence-in-depth, never the control itself.
2. **Role → organization → site.** Authority is two-layered (system role + custom role)
   and then narrowed by scope. A user who escalates a role does not thereby gain scope.
3. **Application data → object storage.** Files live in MinIO/S3; the database holds
   object URLs, never blobs.
4. **Third-party services.** The ArcGIS map loads from an external provider, and any
   future auth or reporting provider expands the boundary.

Explicit non-goals for this repo: server-side authorization, database integrity, and
backend audit durability are implemented in the backend repository. A frontend fix does
not close a backend hole; report those separately.

## Authentication, RBAC, and scope

- Login returns an access and refresh token. The store (`apps/web/src/store/auth-store.ts`)
  deliberately persists **only** the user identity and status to `localStorage`; tokens
  stay in memory for the session and are attached to HTTP requests through the adapter's
  access-token getter. A `401` triggers a single session-expiry toast, a query-cache
  clear, and a redirect to `/login`.
- Authorization is the union of `system_role` grants and custom-role grants, then
  constrained by site/organization scope. Effective permissions are computed in
  `packages/permissions`; the frontend applies them with `hasPermission` /
  `defineAbilityFor`.
- Scope is derived from the actor, not from the role name: regulator staff get the
  organizational view; an `AGENT` sees assigned sites; a `MARKETEUR` sees its own site
  and the rows it created; a `TRANSPORTEUR` sees its organization's tours and crew; a
  `LIVREUR` sees its missions. The helpers live in `apps/web/src/features/scope`.
- A `401`/`403` is never retried into a loop: the query retry policy declines those
  statuses, and mutation errors are routed to the session-expiry path.

## Defence in depth

Controls are applied in four independent places, so a single mistake is not sufficient
to expose data:

1. **Control level** — the button or menu item is hidden or disabled without permission.
2. **Store guard level** — `apps/web/src/lib/security/guards.ts` (`assertPermission`,
   `assertSiteAccess`) throws `PERMISSION_DENIED` for an out-of-scope site.
3. **Form level** — the form refuses to submit values the actor cannot set.
4. **API boundary** — the backend re-authorizes. Assume the first three are conveniences
   and that the fourth is the actual control.

Additional layers: soft delete (`deleted_at`) so records are recoverable and auditable
rather than destroyed; TanStack Query cache isolation per resource; and query-cache clear
on session expiry so a shared machine does not leak the previous user's data.

## MFA, secrets, and browser storage

- MFA enforcement is **settings-driven**: the `mfa.enforced_for_roles` setting lists the
  roles that must use it, and `isMfaRequired` (`apps/web/src/lib/security/mfa.ts`) decides
  per user. When an enforced role is in `PENDINGSETUP`, the app is blocked by
  `apps/web/src/components/security/mfa-gate.tsx` until setup completes.
- **Never persist an MFA secret, TOTP seed, or recovery code** to `localStorage`,
  `sessionStorage`, IndexedDB, a cookie, a URL, or a log. TOTP generation and verification
  happen in the setup/challenge dialogs and in the backend; a secret that reaches browser
  storage is a compromised account waiting to happen. The same applies to passwords,
  access tokens, and refresh tokens.
- `localStorage` holds the session identity (`user`, `status`) and UI preferences only.
  Anything you add to persistent storage is a security decision — justify it.
- The frontend MFA gate is a user-experience control. The backend owns enrollment,
  challenge verification, and recovery. A bypassed gate must not grant any real authority.

## File uploads and object storage

- Certificates, proofs, contracts, reports, photos, and firmware are stored in
  MinIO/S3. The application database stores **object URLs only** — never binary content.
- All external link writes funnel through `apps/web/src/lib/save-link.ts`
  (`saveLink`, `isHttpUrl`) so there is one place to change when presigned upload lands.
- Never render a stored URL as arbitrary HTML or a `javascript:` target. Object URLs
  returned by the backend must be treated as untrusted input until the backend validates
  the object key, the content type, and the access policy.
- Presigned upload, content-type validation, size limits, and malware scanning are
  backend responsibilities. Until they exist, treat uploaded documents as untrusted
  input: do not auto-open them, and do not derive filenames from user input without
  sanitising it.

## API errors and toast safety

- `apps/web/src/hooks/use-toast-feedback.ts` maps transport failures to operator-safe
  messages (session expired, access denied, not found, conflict, network unavailable).
  These messages are shown in a Sonner toast and are not a place for server internals.
- The rule is **one toast per mutation outcome**, enforced by the global mutation
  `onError` in `apps/web/src/main.tsx` suppressing itself when the mutation is marked
  handled. See
  [`docs/adr/0002-exactly-one-sonner-toast-per-mutation.md`](./docs/adr/0002-exactly-one-sonner-toast-per-mutation.md).
- Do not surface raw `error.message`, stack traces, SQL text, or internal identifiers in a
  toast or an inline error. Log the detail server-side and show the safe message.
- Validation failures are rendered inline in the form; a server 400 with field errors
  should populate those fields, not a toast.

## Audit and logging

- The product's evidentiary model is explicit: scan events and audit logs are retained
  for years (`audit.retention_years` setting), and deletion is soft so the history stays
  intact. Actions such as logins, MFA changes, permission denials, exports, and bulk
  deletes are recorded with actor, target, IP, and a risk score; the audit view is in
  `apps/web/src/features/audit-logs`.
- Client-side console output is not an audit trail and must never contain credentials,
  tokens, secrets, or personal data.
- Do not "clean up" audit or log rendering to drop an actor, a timestamp, or a resource
  identifier. An audit screen that hides who did what is worse than no audit screen.

## Dependencies and supply chain

- This is a pnpm workspace. Dependency changes go through `pnpm-lock.yaml`; review the
  lockfile diff as carefully as the source diff.
- Never add a dependency to move a few lines of code. Prefer the platform, an existing
  workspace package, or `@lpg/ui`.
- Do not weaken the lint or build pipeline to accommodate a package, and do not bypass
  peer-dependency or lockfile integrity checks.
- Watch for packages that would exfiltrate data, execute install scripts, or pull
  transitive binaries; a supply-chain compromise in a UI package runs with the operator's
  session.
- Prefer pinned, well-maintained releases. When adding anything security-relevant
  (auth, crypto, file handling, HTTP), get it reviewed explicitly.
- The app loads the ArcGIS JavaScript API from a third party. Treat the API key as a
  public, rate-limited identifier scoped to your domain — never reuse a secret there, and
  never place a private key in a `VITE_*` variable, since everything under `VITE_*` ships
  to the browser.

## Secrets handling

- Real secrets never enter this repository. `apps/web/.env` is local and untracked; only
  `apps/web/.env.example` is committed, with empty values.
- `VITE_*` variables are compiled into the client bundle and are public by definition.
  Anything private belongs in the backend.
- If a secret is committed: rotate it first, then remove it. Rewriting history does not
  un-disclose a key that was pushed. Report it through the channel above.
- Never paste a production token, `.env` value, or customer dataset into an issue, a PR
  comment, a test fixture, or a screenshot.

## Disclosure response

Maintainers, when a report arrives:

1. Acknowledge receipt and confirm the report channel.
2. Reproduce privately and assess severity, affected versions, and data exposure.
3. Fix forward on the default branch, add a regression test, and add the settings or
   guard that would have prevented it.
4. Credit the reporter in the fix description if they want that; do not publish details
   that would help an attacker before users have the fix.
5. Coordinate disclosure with the reporter once a fix is available.

Reporters: please do not run automated scans against infrastructure you do not own, do
not access data beyond what is needed to demonstrate the issue, and give maintainers the
agreed window before going public.
