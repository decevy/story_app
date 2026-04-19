# Agent notes — `src/`

Supplements the repository root **[AGENTS.md](../AGENTS.md)** and **[SPEC.md](../SPEC.md)** when you are changing code under `src/`.

## Entry and routing

- **`main.tsx`** — React root mount.
- **`App.tsx`** — `BrowserRouter`, `AuthProvider`, routes:
  - Public: `/login`, `/register`
  - Protected: `/` wraps **`ChatPage`** with **`ProtectedRoute`** and **`ChatProvider`**
  - Unknown paths → redirect to `/`

## Where to change what

| Goal | Start here |
|------|------------|
| Login / register UI or validation | `pages/LoginPage.tsx`, `pages/RegisterPage.tsx` |
| Auth state, tokens, user | `contexts/AuthContext.tsx`, `services/token.service.ts` |
| Story list, turn list, input, layout | `components/StoryList.tsx`, `TurnList.tsx`, `TurnInput.tsx`, `ChatLayout.tsx` |
| Stories/turns loading, SignalR wiring | `contexts/ChatContext.tsx` |
| Hub connection / hub methods | `services/signalr.services.ts` |
| REST endpoints | `api/*.api.ts` (keep aligned with **SPEC.md**); shared HTTP behavior in `api/axios-config.ts` |
| Shared types | `types/*.ts` — keep in sync with API payloads |

## UI and styling

- Prefer **Tailwind** utility classes consistent with existing components.
- Rounded UI uses **`@toolwind/corner-shape`** where already applied; match surrounding components.

## Checks

After substantive edits, run from repo root: **`npm run lint`** and **`npm run build`**.
