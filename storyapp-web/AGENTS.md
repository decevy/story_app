# Agent instructions — StoryApp Web

This file orients coding agents and automated tools working in this repository.

## Source of truth

- **[SPEC.md](./SPEC.md)** describes the app’s behavior, API surface, data models, env vars, and file layout. Prefer aligning implementations and changes with it; update **SPEC.md** when you intentionally change documented behavior.

## What this project is

- **React 19 + TypeScript** SPA for collaborative pulses and beats: auth (JWT in `localStorage`), pulse threads, beats.
- **REST** via Axios (`VITE_API_URL`, base path `/api`).
- **Real-time** via **SignalR** (`VITE_HUB_URL`, hub path `/pulseHub`).
- **Styling**: Tailwind CSS 4, `@toolwind/corner-shape`.

## Layout

| Area | Path | Role |
|------|------|------|
| API calls | `src/api/` | Auth, pulses, users; Axios setup |
| UI | `src/components/`, `src/pages/` | Layout, lists, inputs, routes |
| State | `src/contexts/` | `AuthContext`, `PulseContext` |
| Real-time | `src/services/` | SignalR, token helpers |
| Types | `src/types/` | Shared TypeScript types |
| Config | `src/config/` | Env and constants |

## Commands

- **Dev server**: `npm run dev` (Vite on port **3000**; proxies `/api` and `/pulseHub` to `https://localhost:7011`).
- **Lint**: `npm run lint`
- **Build**: `npm run build`
- **Preview build**: `npm run preview`

## Environment

- **`VITE_API_URL`** — REST base (e.g. `http://localhost:3000` in dev so requests hit the Vite proxy).
- **`VITE_HUB_URL`** — SignalR hub URL (e.g. `http://localhost:3000/pulseHub` in dev).

The backend is expected to run separately (per proxy target, typically **HTTPS port 7011**).

## Conventions for changes

- Match existing patterns: functional components, Context for cross-cutting state, thin API modules.
- Preserve auth flow: token injection, refresh on 401, redirect on hard failure (see `src/api/axios-config.ts` and auth context).
- SignalR lifecycle should stay tied to authenticated session and pulse join/leave (see `src/services/signalr.services.ts` and `PulseContext`).
- **SPEC.md** lists API endpoints and SignalR methods that exist but are **not yet used in the UI**; extending the UI may wire those up without inventing new contracts unless the backend differs.

## Cursor rules

- Project-specific AI rules live under **`.cursor/rules/`** as `.mdc` files (see Cursor docs). This `AGENTS.md` is repo-level context; rules can enforce file-scoped or always-on policies.

## See also

- **[src/AGENTS.md](./src/AGENTS.md)** — routing, contexts, and where to edit features under `src/`.
- **[.cursor/AGENTS.md](./.cursor/AGENTS.md)** — short Cursor entry point linking here.
