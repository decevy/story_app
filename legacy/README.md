# Legacy (v0)

The previous version of StoryApp, kept as a reference during the rebuild. Git tag: `v0-legacy`.

| Folder | Contents |
|---|---|
| `StoryApp/` | .NET solution (Api, Core, Infrastructure, Services), JWT auth, `StoryHub` (SignalR), EF Core with PostgreSQL, docker-compose (Postgres, Redis, pgAdmin) |
| `storyapp-ng/` | Angular 22 app: auth, story list, reader, composer (seams, hold-to-send), Playwright e2e |
| `.github/` | The old CI workflow (no longer runs, because GitHub only reads `.github/` at the repo root) |
| `.vscode/`, `.claude/` | Old editor and agent configuration; paths still point to the old root |

Nothing in this folder is built or tested anymore. The paths in the old `AGENTS.md` files and in the CI workflow are relative to the old root.
