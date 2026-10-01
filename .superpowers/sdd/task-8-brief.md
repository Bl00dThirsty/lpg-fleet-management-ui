### Task 8: AGENTS.md rule for site-level scoping

**Files:**
- Modify: `AGENTS.md` §4

**Step 1: Add the rule**

Under §4 "Business rules & system conventions", add:

```markdown
- **Site-level data isolation (scope):** MARKETEUR users see only their own
  site's data + what they created; TRANSPORTEUR users see only their org's
  assigned tours/crew; AGENT users see only their assigned sites
  (`user_site_assignments`). Only REGULATEUR-org staff (SUPERADMIN/ADMIN,
  plus SUPERVISOR/INTEGRATEUR) get the organizational view. There is **no**
  org-level view for non-regulateurs. Implemented via `features/scope`
  (`getScope`/`scopeFilter`/`scopeBySiteOrCreator`); every feature data
  builder applies the scope of the authenticated user.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): site-level scoping rule"
```

---

