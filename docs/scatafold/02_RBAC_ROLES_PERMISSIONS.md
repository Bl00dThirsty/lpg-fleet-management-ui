<!-- generated-by: gsd-doc-writer -->
# 02 — RBAC, roles, permissions, and scope

The current permission implementation is in `packages/permissions`; canonical UI guidance is [`../permissions-and-rbac.md`](../permissions-and-rbac.md). This phase preserves the role-by-role planning structure without treating a role name as a complete authorization check.

## Hierarchy

```text
SUPERADMIN > ADMIN > SUPERVISOR / AGENT / INTEGRATEUR > MARKETEUR / TRANSPORTEUR > LIVREUR
```

`HIERARCHY_LEVEL` and `canCreate` allow a user to create or assign only roles at or below the actor's tier. The exact numeric levels and role grants belong to `packages/permissions`, not to this scaffold.

## Effective permission model

```text
effective = ROLE_GRANTS[system_role]
          ∪ active custom_roles.permissions_json
          ∩ resource/site scope
          ∩ mutation guards
```

The web UI consumes `hasPermission`/CASL for navigation and controls. The store must also enforce `assertPermission` and `assertSiteAccess`; forms must omit or restrict out-of-scope selectors. A hidden button is not a security boundary.

## Scope rules

- Regulator organization roles may receive the organizational view, subject to permissions.
- MARKETEUR has no organization-level entity view. It sees its own site/data plus rows it created; it does not see `/marketers` or `/organizations`.
- TRANSPORTEUR sees its organization's assigned operational scope and its own crew; it acknowledges external tours only after assigning its own vehicle, driver, and livreur.
- AGENT is limited to assigned sites. The schema's `user_site_assignments` references `sites`, not `client_sites`; do not document a nonexistent client-site assignment column.
- LIVREUR is limited to assigned missions and their sites.
- Operational builders use `features/scope/scope.ts`: `getScope`, `scopeFilter`, `scopeBySiteOrCreator`, and `scopeWithOrgId` as appropriate. Do not hand-roll `.filter(siteIds.includes(...))` in a feature.

## Role responsibilities

| Role | Primary work | Important controls |
|---|---|---|
| SUPERADMIN | National governance, settings, roles, audit, risk, and cross-scope operations | Full permission catalog, still audited |
| ADMIN | Scoped governance, users, verification, compliance, and reports | Org/site scope and cannot escalate hierarchy |
| SUPERVISOR | Technical monitoring and technical anomalies | Monitoring permissions, settings-driven thresholds |
| INTEGRATEUR | Device/RFID provisioning and integration configuration | Device permissions, no invented data-scope model |
| AGENT | Field verification, declarations, reconciliation, investigation anomalies | Assigned sites only |
| MARKETEUR | Site-scoped fleet, pickup, tour, contract, client, and declaration operations | No organizational view; scope builders required |
| TRANSPORTEUR | External-tour acknowledgment and its own fleet/crew | Own-organization assignment guards |
| LIVREUR | Field tour/checkpoint/scan execution | Mission scope; offline UI states |

## MFA and settings-driven access

MFA enforcement reads `mfa.enforced_for_roles`; the SQL default is a comma-separated `STRING`, while the frontend fixture may represent an array. Consumers must support the repository's actual fixture semantics rather than hardcode a role list. Other security settings include session expiry, MFA grace, failed-login attempts, and lockout duration.

## Mutation contract

Every mutation follows: permission button → scoped form → store guard → API call → audit/cache update. On success or failure, use the shared `hooks/use-toast-feedback`/`runMutation` path and issue exactly one Sonner toast per outcome; field validation remains inline with `FormMessage`. Disable the action while pending and invalidate the resource query key with `lib/api/invalidation`.

See [`../permissions-and-rbac.md`](../permissions-and-rbac.md) for the full catalog and [`../features-and-routes.md`](../features-and-routes.md) for permission-gated navigation.
