# 0004. Test strategy

- **Status:** Proposed
- **Date:** 2026-11-28

## Context

The structure of [ADR-0001](0001-solution-structure.md) to [ADR-0003](0003-module-communication.md) creates many projects and many boundaries. Tests have to cover the domain rules quickly, the database code against the real engine, and the boundaries themselves, without one giant test project.

## Considered options

1. **Test projects:** one per module; two per module (unit and integration); one per layer project.
2. **Database in integration tests:** a real PostgreSQL in a throwaway container (Testcontainers), or SQLite / the EF Core in-memory provider.
3. **Architecture tests:** one project for all rules, or per module.
4. **Tests through the host:** a separate host test project, or only module-level tests.

## Decision

| Project | Tests | Runs against |
|---|---|---|
| `StoryApp.Modules.<Name>.UnitTests` | Domain rules and Application use cases | Fakes for repositories, query interfaces and `IEventBus` |
| `StoryApp.Modules.<Name>.IntegrationTests` | Infrastructure (repositories, queries, migrations) and the module's Api | A real PostgreSQL in a throwaway container (Testcontainers) |
| `StoryApp.Host.Tests` | The application as a whole: health checks, module registration | The host, started with `WebApplicationFactory` |
| `StoryApp.ArchitectureTests` | The boundary rules of ADR-0001 to ADR-0003 | The compiled assemblies |

- **Fast and slow tests are separate projects.** Unit tests need nothing and run in seconds; integration tests need Docker. Both can be run on their own, locally and in CI.
- **Integration tests use real PostgreSQL**, not SQLite or the EF Core in-memory provider. Schemas per module, migrations and plain SQL in query interfaces only behave as in production on the same engine. Each run starts from an empty database that is thrown away afterwards.
- **Architecture tests guard the boundaries** that the compiler cannot see on its own, for example:
  - a module references another module only through its PublicApi or IntegrationEvents;
  - each layer depends only on what the layer table allows, including the stated exceptions;
  - `StoryApp.Common` references no module, and no Domain project references Common.
- Test projects follow the same rule as the rest: a test project is created when its first test arrives.

## Consequences

*To be completed.*
