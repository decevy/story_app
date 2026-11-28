# 0002. Data ownership per module

- **Status:** Accepted
- **Date:** 2026-11-28

> **Summary.** In the context of modules that must be able to leave the monolith with their data, facing the risk of modules reading each other's tables, we decided for a PostgreSQL schema and a `DbContext` per module, references by ID only, repositories for writes and query interfaces for reads, and against a shared schema, cross-schema foreign keys or EF Core in the Application layer, to keep data movable and the Application layer independent of EF Core, accepting eventual consistency for copied data and a growing query interface.

## Context

[ADR-0001](0001-solution-structure.md) splits the backend into modules that can later become services. Data is the hardest boundary to untangle afterwards: if one module reads another module's tables, it cannot be split off without rewriting those queries. We also need a way for the Application layer to reach its data without depending on EF Core.

## Considered options

1. **Who owns the tables:** one shared schema with an agreement on ownership; a schema per module in one database; a database per module from the start.
2. **References to other modules' data:** foreign keys across schemas, or IDs only.
3. **DbContext:** one shared `DbContext`, or one per module.
4. **How Application reaches the data:** a repository per aggregate for everything; an EF Core `DbContext` interface in Application (as in Jason Taylor's Clean Architecture template); a repository for writes plus a separate query interface for reads.

## Decision

Each module owns its data, and no other module touches it.

- **One database, a schema per module.** All modules share one PostgreSQL database. Each module has its own schema, named after the module (`stories`, `identity`, …), and reads and writes only its own schema. When a module is split off, its schema moves to the service's own database (or stays on a shared server with access limited to that service) without rewriting its queries.
- **References by ID only.** A module refers to another module's data by ID, without foreign keys across schemas. For example, a writer in Stories stores the `UserId` from Identity, taken from the access token. Data a module needs from another one, such as a display name, is copied into its own schema and kept up to date through events (see [ADR-0003](0003-module-communication.md)).
- **A DbContext per module.** Each module has its own EF Core `DbContext` in its Infrastructure project, with the module's schema as default schema and its own migrations. A module's `DbContext` only maps that module's tables, so other modules' tables are out of reach in code too.
- **Writes through a repository per aggregate.** The Application project defines a repository interface per aggregate (for example `IStoryRepository`). It loads and persists the whole aggregate, so the domain rules always see a complete object. Infrastructure implements it with EF Core.
- **Reads through a query interface.** The Application project defines a query interface per module (for example `IStoryQueries`) that returns DTOs shaped for one use, such as a list or a reading view. Infrastructure implements it with EF Core projections, includes or plain SQL, whatever fits the query. Variations in what a screen needs stay on the read side and don't pile up in the repository.

This keeps the Application layer free of EF Core and separates writes from reads (a light form of CQRS: separate code paths, same tables). Separate read models, kept up to date by events, can be added per module later when a screen needs them.

## Consequences

**Positive**
- A module's schema moves along when the module is split off, without rewriting its queries.
- The Application layer stays free of EF Core.
- Variations in what a screen needs stay on the read side.

**Negative**
- Data copied from another module lags behind until the event that updates it is handled.
- Every read variation becomes a method on the query interface.

**Follow-up**
- Decide on a unit of work (the repository saves, or a separate unit of work does) with the first use case.
