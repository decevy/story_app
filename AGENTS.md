# Agent instructions — StoryApp monorepo

This folder is the **workspace root** (`story_app`). It contains two main projects that work together as one collaborative story application (REST + real-time turns):

| Folder | Stack | Role |
|--------|--------|------|
| **`StoryApp/`** | .NET (ASP.NET Core) | REST API, JWT auth, SignalR hub, PostgreSQL via EF Core |
| **`storyapp-web/`** | React + TypeScript (Vite) | SPA: login/register, stories, real-time collaborative UI |

For deeper detail, read the **nested `AGENTS.md`** files under each project; prefer the most specific doc for the code you are changing.

---

## How the frontend and backend connect

1. **REST** — The web app calls JSON endpoints under **`/api`** (e.g. auth, users, stories). Axios uses `VITE_API_URL` as the base and appends `/api` (see `storyapp-web/src/api/axios-config.ts`). The JWT is sent on protected requests (Bearer header); refresh flows are handled in the Axios layer and auth context.

2. **SignalR** — Live turns, typing, and related events use a hub at **`/storyHub`**. The client connects using `VITE_HUB_URL`. The API accepts the JWT for WebSocket connections via the **`access_token`** query parameter (configured in `StoryApp/StoryApp.Api/Program.cs`).

3. **Local development** — Vite runs on **port 3000** and **proxies** `/api` and `/storyHub` to the API (default target **`https://localhost:7011`** in `storyapp-web/vite.config.ts`). Set env vars so the browser talks to the dev server origin, e.g. `VITE_API_URL=http://localhost:3000` and `VITE_HUB_URL=http://localhost:3000/storyHub`, and run the API with the **https** profile so it listens on **7011**.

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

The web client’s **SPEC.md** (`storyapp-web/SPEC.md`) describes API shapes and SignalR events in product terms when you need contract-level detail.
