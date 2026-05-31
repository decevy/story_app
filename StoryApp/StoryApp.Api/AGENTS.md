# Agent instructions — StoryApp.Api

**StoryApp.Api** is the **host and composition root**: HTTP pipeline, **controllers**, **SignalR**, **authentication/authorization**, **Swagger**, **CORS**, and **dependency injection** wiring. It references **StoryApp.Core**, **StoryApp.Infrastructure**, and **StoryApp.Services**.

---

## Entry point and DI (`Program.cs`)

### Registered infrastructure

- **`PulseDbContext`** — PostgreSQL via **`UseNpgsql`** and **`DefaultConnection`**.
- **Repositories (scoped):** `IUserRepository` → `UserRepository`, `IPulseRepository` → `PulseRepository`, `IBeatRepository` → `BeatRepository`.
- **Application services (scoped):** `IAuthService` → `AuthService`, `IUserService` → `UserService`, `IPulseService` → `PulseService`.

**Not registered:** `IBeatService`, `IPresenceService` (contracts only in Core today).

### Authentication

- **JWT Bearer** as default scheme; settings from **`JwtSettings`** (`SecretKey`, `Issuer`, `Audience`, etc.).
- **SignalR:** `OnMessageReceived` copies **`access_token`** from the query string when the path starts with **`/pulseHub`** so the hub can authenticate like HTTP.

### SignalR

- **`builder.Services.AddSignalR()`**; **`app.MapHub<PulseHub>("/pulseHub")`**.
- **Redis backplane** snippet is **commented out** (future scaling).

### Swagger

- **`AddSwaggerGen`** with **Bearer** security definition and requirement so JWT can be tested from Swagger UI.

### CORS

- Policy **`AllowReactApp`**: `localhost:3000` (http/https), credentials, headers/methods; development-oriented **`SetIsOriginAllowed`** — review before production.

### Database on startup

- After building the app, **`Database.Migrate()`** runs on **`PulseDbContext`** inside a scope — **all pending migrations apply** when the API starts.

---

## HTTP pipeline order (`Program.cs`)

Relevant order after build:

1. **Development:** `UseSwagger` / `UseSwaggerUI`
2. **`UseHttpsRedirection`**
3. **`ExceptionHandlingMiddleware`** — must run **early** so controller/service exceptions become JSON responses
4. **`UseCors("AllowReactApp")`**
5. **`UseAuthentication`** → **`UseAuthorization`**
6. **`MapControllers`**
7. **`MapHub<PulseHub>`**

---

## Controllers (`Controllers/`)

| Controller | Area |
|------------|------|
| **`AuthController`** | Register, login, refresh, logout — uses **`IAuthService`** |
| **`UsersController`** | Profile, search, update — uses **`IUserService`** |
| **`PulsesController`** | Pulses CRUD and collaborators — uses **`IPulseService`** |

**REST** is the primary surface for auth, users, and pulses. **Beats and typing** are largely **SignalR-driven** (no separate beats-only controller beyond pulse-scoped paging).

Use **Core** exceptions in lower layers; this project’s middleware maps them to status codes. Controllers should stay thin (validate binding, call service, return result).

---

## SignalR hub (`Hubs/PulseHub.cs`)

- **`[Authorize]`** — connections require a valid JWT (including query-string token for browser clients).
- Injects **`IBeatRepository`**, **`IPulseRepository`**, **`IUserRepository`**, **`ILogger<PulseHub>`** — **real-time flows use repositories directly**, not **`IBeatService`**.
- **Group name** pattern for pulses is encapsulated in hub helpers (e.g. `pulse_{id}` groups for broadcasts).
- **Client events** (names in `EventNames`): include **`ReceiveBeat`**, **`BeatEdited`**, **`BeatDeleted`**, **`UserJoinedPulse`**, **`UserLeftPulse`**, typing events, **`UserStatusChanged`**, etc.
- Authorization failures for hub actions use **`HubException`** with user-visible messages where appropriate.

When adding hub methods, keep **membership checks** consistent with **`PulseService`** / repository rules.

---

## Middleware (`Middleware/ExceptionHandlingMiddleware.cs`)

- Catches unhandled exceptions and returns **`application/json`** **`ErrorResponse`** (camelCase serialization).
- Maps **`NotFoundException`**, **`ForbiddenException`**, **`UnauthorizedException`**, **`BadRequestException`** to **404 / 403 / 401 / 400**; everything else → **500** with a generic message.
- **500** is logged as **error**; client errors as **warning**.

Hub pipeline uses **SignalR’s** error handling for hub-invoked methods; still avoid leaking sensitive details in messages.

---

## Conventions for agents

- New **REST endpoints** → appropriate **controller** + **Core** DTOs + **Services** if non-trivial.
- New **real-time behavior** → **`PulseHub`** + **Core** DTOs for payloads; consider whether logic belongs in a **future service** to avoid a fat hub.
- After changing **JWT/CORS/connection strings**, document or update **`appsettings`** examples if present.
- **Never** put **EF configurations** or **repository SQL** here—use **Infrastructure**.
