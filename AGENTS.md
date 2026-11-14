# Agent instructions — StoryApp monorepo

This folder is the **workspace root** (`story_app`). It contains the backend and two frontends for one collaborative story application (REST + real-time passages):

| Folder | Stack | Role |
|--------|--------|------|
| **`StoryApp/`** | .NET (ASP.NET Core) | REST API, JWT auth, SignalR hub, PostgreSQL via EF Core |
| **`storyapp-web/`** | React + TypeScript (Vite) | SPA: login/register, stories & passages, real-time collaborative UI (reference implementation) |
| **`storyapp-ng/`** | Angular 22 (zoneless, signals) | Rebuild of `storyapp-web` with feature parity; follows `storyapp-web/SPEC.md` |

For deeper detail, read the **nested `AGENTS.md`** files under each project; prefer the most specific doc for the code you are changing.

---

## How the frontend and backend connect

1. **REST** — The web apps call JSON endpoints under **`/api`** (e.g. auth, users, stories). In `storyapp-web`, Axios uses `VITE_API_URL` as the base and appends `/api` (see `storyapp-web/src/api/axios-config.ts`); in `storyapp-ng`, `APP_CONFIG.apiUrl` from `src/environments` plays that role and `authInterceptor` handles the bearer token and refresh. The JWT is sent on protected requests (Bearer header).

2. **SignalR** — Live passages, typing, and related events use a hub at **`/storyHub`**. The clients connect using `VITE_HUB_URL` (React) or `APP_CONFIG.hubUrl` (Angular). The API accepts the JWT for WebSocket connections via the **`access_token`** query parameter (configured in `StoryApp/StoryApp.Api/Program.cs`).

3. **Local development** — Both dev servers run on **port 3000** (one at a time) and **proxy** `/api` and `/storyHub` to the API (default target **`https://localhost:7011`**; see `storyapp-web/vite.config.ts` and `storyapp-ng/proxy.conf.mjs`, which also reads `API_PROXY_TARGET`). For the React app, set env vars so the browser talks to the dev server origin, e.g. `VITE_API_URL=http://localhost:3000` and `VITE_HUB_URL=http://localhost:3000/storyHub`; the Angular app's development environment already uses the same origin. Run the API with the **https** profile so it listens on **7011**.

4. **CORS** — The API policy **`AllowReactApp`** allows the React dev origin (`localhost:3000`) with credentials so cookies/headers work when not using the proxy.

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
| `storyapp-web/AGENTS.md` | React app structure, env vars, conventions |
| `storyapp-ng/AGENTS.md` | Angular app structure, conventions, commands, tests |

The web client’s **SPEC.md** (`storyapp-web/SPEC.md`) describes API shapes and SignalR events in product terms when you need contract-level detail. Both frontends follow it.

## CI

`.github/workflows/ci.yml` runs on push and pull request: **`web`** (storyapp-ng lint, unit tests, build), **`api`** (dotnet restore/build; `dotnet test` only when test projects exist) and **`e2e`** (Postgres service, API over http, Playwright against storyapp-ng).
