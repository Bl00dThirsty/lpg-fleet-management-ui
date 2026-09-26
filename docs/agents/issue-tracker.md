<!-- generated-by: gsd-doc-writer -->
# Issue tracker: GitHub

Issues and specifications are managed as GitHub issues through the `gh` CLI. Run commands from the repository so the remote is inferred.

## Common commands

```bash
gh issue list --state open
gh issue view <number> --comments
gh issue create --title "..." --body "..."
gh issue comment <number> --body "..."
gh issue edit <number> --add-label "..."
gh issue close <number>
```

For a bug, include reproduction steps, expected behavior, actual behavior, environment, and relevant route/feature. For a feature, include the actor, scope, state transitions, permission impact, settings impact, and acceptance criteria.

## Pull requests

```bash
gh pr list --state open
gh pr view <number> --comments
gh pr diff <number>
gh pr create --title "..." --body "..."
```

Do not treat pull requests as a separate request surface unless the repository workflow explicitly says so. Review the complete diff, run the documented verification scripts, and never commit or push unless explicitly requested.

## Labels and wayfinding

Use existing repository labels when available. If using the wayfinder workflow, the map is the parent issue and child tickets are linked as sub-issues where supported; otherwise include `Part of #<map>` and a `Blocked by: #<n>` line. GitHub issue dependencies use the numeric database id returned by `gh api`, not the visible issue number.

## Domain context for issues

Reference `AGENTS.md`, `../TODO.md`, the SQL schema, and the relevant `docs/` guide. Distinguish current frontend behavior from backend requirements. Do not claim a backend endpoint, deployment, credential, or external URL is implemented without repository evidence.
