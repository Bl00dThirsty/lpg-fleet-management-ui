### Task 9: TODO.md scoping annotations

**Files:**
- Modify: `../TODO.md` (API map §2)

**Step 1: Update scoping notes**

For `GET /api/v1/sites`, `GET /api/v1/tours`, `GET /api/v1/pickups`, `GET /api/v1/declarations`, append: "scoped by `user_site_assignments` + `created_by`; MARKETEUR → own site; TRANSPORTEUR → own org; AGENT → assigned sites; only REGULATEUR-org staff see org-wide."

- [ ] **Step 2: Commit**

```bash
git add ../TODO.md
git commit -m "docs(todo): site-level scoping annotations in API map"
```
