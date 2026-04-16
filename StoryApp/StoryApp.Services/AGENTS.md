# Agent instructions — StoryApp.Services

**StoryApp.Services** holds **application service implementations** for interfaces defined in **StoryApp.Core**. It depends on:

- **StoryApp.Core** — entities, DTOs, interfaces, exceptions, extensions, query builders.
- **StoryApp.Infrastructure** — concrete **repositories** (you inject **`IUserRepository`**, **`IStoryRepository`**, **`ITurnRepository`** via their **Core** interfaces).

It does **not** reference **StoryApp.Api**. HTTP and SignalR stay in the API layer.

**Packages (see `.csproj`):** e.g. **BCrypt.Net-Next**, **Microsoft.Extensions.Configuration**, **System.IdentityModel.Tokens.Jwt** for **`AuthService`**.

---

## Implemented services (current)

| Class | Interface | Responsibility |
|-------|-----------|----------------|
| **`AuthService`** | **`IAuthService`** | Register/login, JWT access tokens, refresh token generation and validation, password hashing (**BCrypt**), user persistence via **`IUserRepository`**, **`IConfiguration`** for JWT settings. |
| **`UserService`** | **`IUserService`** | Get/update user, list/search users, **`UpdateUserPresenceAsync`** (online flag + **`LastSeen`**). |
| **`StoryService`** | **`IStoryService`** | User’s story list with last turn, get/create/update/delete story, membership and admin checks, uses **`IStoryRepository`**, **`ITurnRepository`**, **`IUserRepository`** and **`StoryQueryBuilder`** / related query patterns. |

**DI registration** (scoped): all three are registered in **`StoryApp.Api/Program.cs`**:

- `IAuthService` → `AuthService`
- `IUserService` → `UserService`
- `IStoryService` → `StoryService`

---

## Not implemented here (by design, today)

- **`ITurnService`** — no `TurnService.cs`; real-time turns flow through **`StoryHub`** + repositories. If you add an implementation, register it in **`Program.cs`** and refactor **hub/controllers** to avoid duplication.
- **`IPresenceService`** — no dedicated class; presence updates appear in **hub connection lifecycle** and **`UserService.UpdateUserPresenceAsync`**. A future **`PresenceService`** might centralize typing/presence and optional **Redis**.

---

## Coding patterns used in this project

1. **Primary constructors** (C# 12) for concise DI:  
   `public class UserService(IUserRepository userRepository) : IUserService`
2. **Throw Core exceptions** for business-rule failures: **`NotFoundException`**, **`BadRequestException`**, **`ForbiddenException`**, etc. The API middleware turns them into JSON **error responses**.
3. **Repository query builders** — e.g. **`storyRepository.Query().WithCreator().WithMembers()...`** before **`ToListAsync`** / **`FindByIdAsync`** (extension methods from Core).
4. **DTO mapping** — prefer **`SomeDto.FromEntity(entity)`** (and **`Transform`** where already used) for consistency with **`StoryService`** / **`UserService`** / **`AuthService`**.

---

## Adding a new service

1. Add **`IYourService`** in **`StoryApp.Core/Interfaces/`** (methods take **DTOs** and primitive IDs, not **`HttpContext`**).
2. Implement **`YourService`** in this project; inject only **repositories** and **framework abstractions** (`IConfiguration`, `ILogger<T>`, etc.) as needed.
3. Register **`AddScoped<IYourService, YourService>()`** in **`StoryApp.Api/Program.cs`**.
4. Call it from **controllers** or **hubs**—keep **transport** concerns out of this assembly.

---

## Conventions for agents

- Keep methods **`async`** end-to-end when calling repositories.
- Use **`DateTime.UtcNow`** for timestamps (match existing entities/services).
- Do **not** add **EF `DbContext`** or **ASP.NET** types here.
- After behavioral changes, ensure **Api** layer (controllers/hub) still compiles and **exceptions** remain mapped correctly.
