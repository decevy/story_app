# Agent instructions — StoryApp.Infrastructure

**StoryApp.Infrastructure** implements **persistence** for **StoryApp.Core**: **`PulseDbContext`**, **EF Core configurations**, **repository classes**, **migrations** (under this project’s **`Migrations/`** folder when present), and **database seeding**. It references **StoryApp.Core** only (plus Npgsql/EF packages per **`.csproj`**).

No **controllers**, **hubs**, or **JWT** code belongs here.

---

## Layout (current)

| Path | Role |
|------|------|
| **`Data/PulseDbContext.cs`** | **`DbSet<>`** declarations, **`OnModelCreating`** wiring, migration assembly |
| **`Data/PulseDbSeeder.cs`** | **Canonical seed data** (`SeedAsync`); `PulseDbContext`’s EF **`UseSeeding`** hook delegates here |
| **`Repositories/UserRepository.cs`** | **`IUserRepository`** |
| **`Repositories/PulseRepository.cs`** | **`IPulseRepository`** (includes **`Query()`** / **`QueryPacers()`** implementations) |
| **`Repositories/BeatRepository.cs`** | **`IBeatRepository`** |

Entity **configuration classes** may live alongside the context or under a `Configurations/` folder depending on how the codebase evolves—**keep fluent API aligned** with **Core** entities.

---

## Repositories

- Implement **Core** interfaces **exactly**; return **entities** or **query builders** as defined by those interfaces.
- **Query builders** in Core should receive **`IQueryable`** from **`DbSet`** and compose **includes/filters**; Infrastructure implementations return **`AsNoTracking()`** where appropriate if read-only queries are standard (match existing repositories).
- **Async** methods should use **`SaveChangesAsync`**, **`ToListAsync`**, **`FirstOrDefaultAsync`**, etc.

When adding a **new repository method**, update **`StoryApp.Core`** interface first, then implement here, then consume from **Services** or **Api**.

---

## Migrations (EF Core)

Always specify **infrastructure** project and **API** startup project:

```bash
dotnet ef migrations add <MigrationName> --project StoryApp.Infrastructure --startup-project StoryApp.Api
dotnet ef database update --project StoryApp.Infrastructure --startup-project StoryApp.Api
```

The **API** also runs **`Migrate()`** on startup, so pending migrations apply automatically in dev—use **`database update`** when you want to apply schema changes **without** launching the full web host.

**Baseline / existing databases:** The solution may be reset to a **single** migration (e.g. **`InitialCreate`**). Databases that already applied **older migration IDs** that no longer exist in **`Migrations/`** are **not** safely upgradable with `database update` alone—**drop and recreate** the database (or clear it and reapply) so **`__EFMigrationsHistory`** matches the checked-in migrations.

**Checklist for schema changes:**

1. Update **Core** entities if needed.
2. Adjust **`OnModelCreating`** / configuration classes.
3. Add migration; review generated **Up/Down**.
4. Run **`dotnet build`** and smoke-test **`dotnet run --project StoryApp.Api`**.

---

## Seeding (`PulseDbContext` → **`PulseDbSeeder`**)

- **`PulseDbContext`** wires **`UseSeeding` / `UseAsyncSeeding`** to **`PulseDbSeeder.SeedAsync`** (single source of truth).
- Keep seeding **idempotent** where possible (avoid duplicate key errors on re-run).
- Do not reference **Api** or **Services** types from the seeder.

---

## External dependencies (typical)

- **PostgreSQL** via **Npgsql** EF provider.
- **Redis** / **Azure Blob** may appear in packages or future work—follow existing patterns and configuration keys when wiring new features.

---

## Conventions for agents

- **No business rules** that belong in **Services** (e.g. “user must be admin”)—enforce **data integrity** and **queries** here; **authorization story** stays in **Services** / **Api**.
- Preserve **delete behaviors** (cascade vs restrict) explicitly in configuration to match product expectations.
- After changing **entities**, **always** add a **migration**; do not rely on **`EnsureCreated`** in production-style flows.
