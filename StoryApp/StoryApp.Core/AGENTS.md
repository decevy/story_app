# Agent instructions — StoryApp.Core

**StoryApp.Core** is the **domain and contracts** layer: persistence shape (entities), API/SignalR payloads (DTOs), abstractions (interfaces), and shared building blocks (exceptions, query builders, extensions). It must **not** reference **StoryApp.Api**, **StoryApp.Infrastructure**, or **StoryApp.Services**.

**Package reference:** `Microsoft.EntityFrameworkCore` — used for **`IQueryable` / `Include` / `ThenInclude`** types in **query builders** and **`QueryableExtensions`**, not for hosting a DbContext here.

---

## Folder layout (current)

| Area | Purpose |
|------|---------|
| **`Entities/`** | EF-mapped domain types and enums |
| **`Dtos/`** | Types exchanged by HTTP and SignalR (flat and nested) |
| **`Dtos/Requests/`** | Input models for commands (register, login, create story, send beat, etc.) |
| **`Dtos/Responses/`** | Shared response wrappers (`LoginResponse`, `PaginatedResponse`, `ErrorResponse`, etc.) |
| **`Interfaces/`** | **Repository** and **application service** contracts |
| **`Exceptions/`** | Domain-style errors consumed by **Api** middleware |
| **`QueryBuilders/`** | Fluent wrappers over `IQueryable` for composable includes/filters |
| **`Extensions/`** | `QueryableExtensions` (conditional includes), `ObjectExtensions` |

---

## Entities (`Entities/`)

| Type | Role |
|------|------|
| **`User`** | Account, password hash, refresh token fields, presence (`IsOnline`, `LastSeen`) |
| **`Pulse`** | Collaborative pulse thread; creator relationship |
| **`Pacer`** | User ↔ pulse participation (membership row) |
| **`Beat`** | Contributions in a pulse (text **passage**) |

**Relationships (conceptual):** users join pulses via memberships (**`Pacer`**); pulses contain **`Beat`**s. **Integer** primary keys; delete/cascade rules are defined in **Infrastructure** EF configuration, not here.

When you add or change an entity:

1. Update **Core** entity (and enums if needed).
2. Update **Infrastructure** `PulseDbContext` / configuration + **migration**.
3. Update DTOs and mapping helpers (`FromEntity`, etc.) where applicable.

---

## DTOs (`Dtos/`)

- **API requests** live under **`Dtos/Requests/`** (e.g. `RegisterRequest`, `CreatePulseRequest`, `SendBeatRequest`).
- **Shared responses** under **`Dtos/Responses/`** (e.g. `LoginResponse`, `CurrentUserResponse`, `PaginatedResponse`, `ErrorResponse`).
- **Pulse/beat/user payloads** and **SignalR event** shapes sit under **`Dtos/`** (e.g. `BeatDto`, `PulseDto`, `PulseSummaryDto`, `PulseEventDto`, `TypingIndicatorDto`, `UserStatusChangedDto`, `BeatEditedDto`, `BeatDeletedDto`).

**Pattern:** static **`FromEntity`** (or small factory methods) on DTOs map **entities → DTOs**; keep mapping logic close to the DTO type unless the team standard changes.

---

## Interfaces (`Interfaces/`)

### Repositories

- **`IUserRepository`** — users, search, uniqueness checks, CRUD-style methods used by auth and profiles.
- **`IPulseRepository`** — pulses, pacer lookups, admin checks; exposes **`Query()`** and **`QueryPacers()`** (see query builders).
- **`IBeatRepository`** — beats by pulse, last beat, CRUD helpers, etc.

Repositories are **implemented in Infrastructure** and registered in **Api** `Program.cs`.

### Application services

- **`IAuthService`** — register, login, refresh, logout patterns (implemented in **Services**).
- **`IUserService`** — profiles, search, updates, **`UpdateUserPresenceAsync`** (implemented in **Services**).
- **`IPulseService`** — list/create/update pulses and pacer enrollment (implemented in **Services**).
- **`IBeatService`** — beat API as a **service contract**; **no `BeatService` class** in **StoryApp.Services** at present—**`PulseHub`** talks to **`IBeatRepository`** directly. See root **`AGENTS.md`**.
- **`IPresenceService`** — typing/presence contract; **not implemented** as a dedicated service class yet. See root **`AGENTS.md`**.

When adding a **new** cross-cutting use case, prefer **interface in Core** + **implementation in Services** + **registration in Api**, unless the feature is **SignalR-only** and tiny (then document the exception).

---

## Exceptions (`Exceptions/`)

Used by **Services** and **Api**; **`ExceptionHandlingMiddleware`** maps them to HTTP status codes:

| Exception | Typical HTTP mapping |
|-----------|----------------------|
| **`NotFoundException`** | 404 |
| **`ForbiddenException`** | 403 |
| **`UnauthorizedException`** | 401 |
| **`BadRequestException`** | 400 |

Throw these from **Services** (or validated paths in **Api**) for **predictable client errors**. Anything else becomes **500** with a generic message.

**SignalR:** hubs may use **`HubException`** for client-visible failures (see **`PulseHub`**).

---

## Query builders (`QueryBuilders/`)

Repositories expose **`Query()`** (and similar) returning a **query builder** that wraps **`IQueryable<T>`** with methods such as **`WithPacers()`**, **`WhereUserIsMember`**, **`FindByIdAsync`**, etc.

**Guidelines:**

- Add **new filters/includes** on the builder when the shape is reused in multiple call sites.
- Keep **SQL-sensitive** details (indexes, raw SQL) in **Infrastructure** if introduced—Core builders stay **LINQ**-based.

---

## Extensions

- **`QueryableExtensions`** — **`IncludeIf` / `ThenIncludeIf`** and related helpers for optional eager loading.
- **`ObjectExtensions`** — small utilities (e.g. **`Transform`**) used when projecting entities to DTOs.

---

## Conventions for agents

- **Nullable reference types** enabled—use **`?`** where appropriate.
- **Namespaces** follow folder structure (`StoryApp.Core.Dtos.Requests`, etc.).
- Prefer **extending existing** DTOs/exceptions/builders over introducing parallel patterns.
- Do **not** add **controllers**, **hub**, or **DbContext** code to this project.
