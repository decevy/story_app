# Agent instructions — StoryApp monorepo

This folder is the **workspace root** (`story_app`). It contains the backend and the frontend of one collaborative story application (REST + real-time passages):

| Folder | Stack | Role |
|--------|--------|------|
| **`StoryApp/`** | .NET (ASP.NET Core) | REST API, JWT auth, SignalR hub, PostgreSQL via EF Core |
| **`storyapp-ng/`** | Angular 22 (zoneless, signals) | SPA: login/register, stories & passages, real-time collaborative UI; follows `storyapp-ng/SPEC.md` |

For deeper detail, read the **nested `AGENTS.md`** files under each project; prefer the most specific doc for the code you are changing.

---

## How the frontend and backend connect

1. **REST** — The web app calls JSON endpoints under **`/api`** (e.g. auth, users, stories). The base is `APP_CONFIG.apiUrl` from the runtime `config.json` (`storyapp-ng/public/config.json`, loaded before bootstrap); `authInterceptor` handles the bearer token and refresh. The JWT is sent on protected requests (Bearer header).

2. **SignalR** — Live passages, typing, and related events use a hub at **`/storyHub`**. The client connects using `APP_CONFIG.hubUrl`. The API accepts the JWT for WebSocket connections via the **`access_token`** query parameter (configured in `StoryApp/StoryApp.Api/Program.cs`).

3. **Local development** — The dev server runs on **port 3000** and **proxies** `/api` and `/storyHub` to the API (default target **`https://localhost:7011`**; see `storyapp-ng/proxy.conf.mjs`, which also reads `API_PROXY_TARGET`). `config.json` uses the dev server origin. Run the API with the **https** profile so it listens on **7011**.

4. **CORS** — The API policy **`AllowReactApp`** allows the dev origin (`localhost:3000`) with credentials so cookies/headers work when not using the proxy.

**Summary:** HTTP + hub share the same host in dev (via proxy) or the same deployed domain in production; auth is **JWT** end-to-end (header for REST, query token for SignalR).

---

## Nested agent docs

| Path | Focus |
|------|--------|
| `StoryApp/AGENTS.md` | .NET solution layout, layers, EF migrations, commands |
| `StoryApp/StoryApp.Api/AGENTS.md` | Controllers, `StoryHub`, middleware, pipeline |
| `StoryApp/StoryApp.Core/AGENTS.md` | Entities, DTOs, interfaces, query builders |
| `StoryApp/StoryApp.Infrastructure/AGENTS.md` | DbContext, repositories, migrations |
| `StoryApp/StoryApp.Services/AGENTS.md` | Application services |
| `storyapp-ng/AGENTS.md` | Angular app structure, conventions, commands, tests |

**`storyapp-ng/SPEC.md`** describes product behaviour, API shapes and SignalR events when you need contract-level detail.

## Design decisions

For structural decisions (folder layout, boundaries, state management, abstractions), design for
the roadmap in `storyapp-ng/SPEC.md`, not the current feature set. The `roadmap` skill
(`.claude/skills/roadmap/SKILL.md`, `/roadmap`) has the full procedure.

## CI

`.github/workflows/ci.yml` runs on push and pull request: **`web`** (storyapp-ng format check, lint, unit tests with coverage thresholds, build), **`api`** (dotnet restore/build; `dotnet test` only when test projects exist) and **`e2e`** (Postgres service, API over http, Playwright against storyapp-ng).
