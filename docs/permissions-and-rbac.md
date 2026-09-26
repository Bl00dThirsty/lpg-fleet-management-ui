<!-- generated-by: gsd-doc-writer -->
# Permissions & RBAC

The frontend has two permission layers. The first is the `system_role` grant in `ROLE_GRANTS`; the second is a custom role whose permissions are stored as JSONB in the schema and assigned through user custom-role records. The effective set is the union of both layers, then constrained by the actor's site/organization scope. A feature must not rely on `system_role` alone.

## Roles and hierarchy

| Tier | Roles | Typical scope |
|---:|---|---|
| 100 | `SUPERADMIN` | National regulator scope. |
| 80 | `ADMIN` | Regulator/administrative scope. |
| 60 | `SUPERVISOR`, `INTEGRATEUR`, `AGENT` | Technical or assigned-site scope. |
| 40 | `MARKETEUR`, `TRANSPORTEUR` | Own organization/site/assigned operational data. |
| 20 | `LIVREUR` | Assigned missions and delivery execution. |

`canCreate(actor, target)` permits creating a role at or below the actor's `HIERARCHY_LEVEL`; it does not allow privilege escalation. `LIVREUR` is represented in permissions but is not part of the normal web sidebar projection.

## Data scope

| Actor | Effective scope |
|---|---|
| Regulator staff | Organizational view, subject to permission and deployment policy. |
| `AGENT` | Only sites in `user_site_assignments` and related scoped rows. |
| `MARKETEUR` | Own site plus rows created by that actor; no organization-level entity view. |
| `TRANSPORTEUR` | Own organization's assigned tours, vehicles, drivers, and livreurs. |
| `LIVREUR` | Sites reachable through assigned missions only. |

Use `apps/web/src/features/scope` helpers rather than filtering by organization ID ad hoc. `scopeWithOrgId` is reserved for site/transporter views where the organization is the operational scope; it must not broaden `agent` or `livreur` to organization-wide rows.

## Enforcement layers

1. **Control:** hide/disable controls unless `hasPermission`/CASL allows the action.
2. **Store:** mutation stores call the guards in `lib/security/guards` before writing.
3. **Form:** fields and values are restricted to the actor's permitted site/organization.
4. **API:** the transport contract expects the backend to enforce the same union and scope; this repository does not implement that backend.

## Navigation and route guards

`apps/web/src/config/rbac/nav-items.ts` is the navigation catalog. `requires` is an OR set of permission codes. The same permission/ability model should guard the route and its actions. Navigation is permission-gated, not role-prefixed.

## Mutation contract

- Every mutation invalidates its resource query through `lib/api/invalidation`.
- WS events `tour:update`, `anomaly:new`, and `device:telemetry` invalidate matching resources.
- Low-risk status toggles may be optimistic with rollback; pending controls are disabled and show progress.
- Exactly one Sonner toast reports the mutation outcome. Field validation remains inline.

## Settings-sensitive security

MFA setup is controlled by `mfa.enforced_for_roles`; parse JSON arrays and comma-separated values through the settings accessor. Business thresholds, including geo confidence, offline alerts, battery, SLA, and reconciliation tolerance, are settings keys rather than frontend constants.
