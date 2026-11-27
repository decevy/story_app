# 0001. Solution structure for the modular monolith

- **Status:** Proposed
- **Date:** 2026-11-27

## Context

StoryApp starts as a modular monolith: one deployable backend that is split into services only where a split has a real reason (see the target architecture in the [README](../../README.md)). The roadmap already names the parts that are likely to leave the monolith later:

- the **Realtime gateway**, because long-lived connections scale differently from request/response;
- the **AiWorker**, because it is slow, external and rate-limited, and scales on queue length;
- **Lore**, because its data spans stories and its processing can be asynchronous.

The solution structure has to make those splits cheap. A module that becomes a service should move out with its code, its data and its tests, without untangling it from the rest first. Until then, the boundaries between modules have to hold on their own, also when the code is written quickly.

The previous version (`legacy/`) used one set of horizontal layers for the whole app (`Core`, `Infrastructure`, `Services`, `Api`). Every feature was spread over all four projects, and nothing kept one feature from reaching into another.

## Considered options

1. **One API project with a folder per module.** The simplest to start with. Boundaries exist only by agreement: any class can use any other, and nothing fails when a boundary is crossed. Splitting a module off later means finding and cutting those hidden dependencies first.
2. **A project per module plus a thin host.** Each module is its own project; a host project composes them into one application. The compiler enforces the boundaries, because a module can only use what it references. A module that becomes a service gets its own host and moves out as one folder.
3. **Layers per module.** Each module split into layer projects (`Domain`, `Application`, `Infrastructure`, `Api`), like the legacy version but per module. This is the most common shape of Clean Architecture in .NET, and the compiler enforces both the module and the layer boundaries. Applied rigidly it means three or four projects per module from day one, some of them empty for modules that have no use for a layer. Limiting each module to the layers it actually has avoids that.

## Decision

We use **option 3, limited to the layers a module actually has.** Every module is split into layer projects, under a thin host. A module only gets a project for a layer it needs, so there are no empty projects; the layer convention itself is the same everywhere.

### Layers inside a module

Every module uses the same layers, each as its own project:

| Layer | Holds | May depend on |
|---|---|---|
| **Domain** | Entities, value objects, domain rules. Plain C#, no EF Core or ASP.NET. | nothing |
| **Application** | Use cases; interfaces for what they need from the outside | Domain |
| **Infrastructure** | EF Core, external clients, implementations of those interfaces | Application, Domain |
| **Api** | Endpoints, request and response types, hubs | Application (and Domain types through it) |

- **The compiler enforces the layer rules.** A layer can only use the projects it references, so the domain cannot reach EF Core or ASP.NET by accident.
- **Skipping a layer is allowed, but stated explicitly** in the module table below, with the reason. A skipped layer has no project.
- **A layer project is created when its first real code arrives,** not ahead of time.

Besides its layers, a module can have up to two **public projects**. These are the only projects of a module that other modules may reference:

| Project | Holds | May depend on |
|---|---|---|
| **PublicApi** | Interfaces and DTOs for questions other modules may ask synchronously | nothing |
| **IntegrationEvents** | Records of the events the module publishes | `StoryApp.Common` |

A module's Application project implements its own PublicApi and publishes its own IntegrationEvents. Like the layers, a public project is created only when another module first needs it.

### Layout

```
src/
  StoryApp.Host/                                composes the modules into one application
  StoryApp.Common/                              technical building blocks shared by the modules
  Modules/
    <Name>/
      StoryApp.Modules.<Name>.Domain/
      StoryApp.Modules.<Name>.Application/
      StoryApp.Modules.<Name>.Infrastructure/
      StoryApp.Modules.<Name>.Api/
      StoryApp.Modules.<Name>.PublicApi/
      StoryApp.Modules.<Name>.IntegrationEvents/
tests/
  Modules/
    <Name>/
      ...                                       see Tests below
```

- **`StoryApp.Host`** is the composition root. It configures the application and registers the modules, and holds no domain logic. Once the other modules have been split off, what remains is the Story API.
- **Tests** live under `tests/`, mirroring the source tree.

All projects live in one solution. The host references the modules and runs them in a single process, so there is one application to build, debug and deploy.

### Expected modules

These are the boundaries we expect, based on the roadmap. A project is created only when real code for it arrives.

| Module | Responsibility | Layers | Expected split |
|---|---|---|---|
| **Stories** | Stories, passages, writers, turn order | Domain, Application, Infrastructure, Api | Stays with the Story API |
| **Identity** | Registration, login, users | Application, Infrastructure, Api; no Domain, because ASP.NET Core Identity provides the user model | Stays with the Story API |
| **AiWriter** | Writing the AI's turns | Application, Infrastructure; no Domain (no rules of its own) and no Api (it reacts to work, it serves no requests) | Becomes the AiWorker |
| **Realtime** | Live updates to connected clients | Infrastructure, Api; no Domain or Application, because it only relays updates; Api therefore uses Infrastructure directly | Becomes the Realtime gateway |
| **Lore** *(later)* | Characters, places, objects and their relations across stories | Domain, Application, Infrastructure, Api | Becomes Lore (Api + Worker) |

The first slice needs `StoryApp.Host`, the four Stories projects and the three Identity projects, plus their tests.

### Data ownership

Each module owns its data, and no other module touches it.

- **One database, a schema per module.** All modules share one PostgreSQL database. Each module has its own schema, named after the module (`stories`, `identity`, …), and reads and writes only its own schema. When a module is split off, its schema moves to the service's own database (or stays on a shared server with access limited to that service) without rewriting its queries.
- **References by ID only.** A module refers to another module's data by ID, without foreign keys across schemas. For example, a writer in Stories stores the `UserId` from Identity, taken from the access token. Data a module needs from another one, such as a display name, is copied into its own schema and kept up to date through events (see *Communication between modules*).
- **A DbContext per module.** Each module has its own EF Core `DbContext` in its Infrastructure project, with the module's schema as default schema and its own migrations. A module's `DbContext` only maps that module's tables, so other modules' tables are out of reach in code too.
- **Writes through a repository per aggregate.** The Application project defines a repository interface per aggregate (for example `IStoryRepository`). It loads and persists the whole aggregate, so the domain rules always see a complete object. Infrastructure implements it with EF Core.
- **Reads through a query interface.** The Application project defines a query interface per module (for example `IStoryQueries`) that returns DTOs shaped for one use, such as a list or a reading view. Infrastructure implements it with EF Core projections, includes or plain SQL, whatever fits the query. Variations in what a screen needs stay on the read side and don't pile up in the repository.

This keeps the Application layer free of EF Core and separates writes from reads (a light form of CQRS: separate code paths, same tables). Separate read models, kept up to date by events, can be added per module later when a screen needs them.

### Communication between modules

Modules only talk to each other through their public projects. A module never references another module's Domain, Application, Infrastructure or Api project.

- **Questions go through PublicApi.** When a module needs an answer right away, it calls an interface from the other module's PublicApi (for example `IUserDirectory`). The other module implements it in its Application project. When that module is split off, the same interface gets an HTTP or gRPC client as implementation, and the calling code stays the same. Synchronous calls are strong coupling (if the other module fails, the caller fails too), so we prefer events where an immediate answer is not needed.
- **Things that happened go through IntegrationEvents.** A module announces what happened as an event record in its IntegrationEvents project (for example `PassageWritten`). Other modules subscribe with a handler. The publishing module does not know who listens.
- **One kind of event.** We don't separate internal domain events from integration events. The Application layer publishes an event after it has saved the change; the domain itself does not raise events, so Domain keeps depending on nothing.
- **Events go through our own `IEventBus`.** Modules publish through `IEventBus` and handle events through `IIntegrationEventHandler<T>`, both from `StoryApp.Common`. For now the implementation runs in-process: it calls the handlers directly. Once there is a message broker, an implementation backed by the broker replaces it without changes in the modules. Until then, an event can be lost if the application stops between saving and publishing; an outbox will close that gap together with the broker.

### Shared code

`StoryApp.Common` holds technical building blocks that several modules need: messaging, the current user, module registration and similar plumbing.

- It contains no domain concepts and references no module.
- Something is added only when a second module needs it; code used by one module stays in that module.
- Implementations that pull in heavy dependencies, such as a broker client, do not go here, so modules don't get them through Common.
- Domain projects do not reference Common.

### Tests

*To be decided.*

## Consequences

- **Splitting a module off does not mean a new solution.** The service gets its own thin host project (for example `StoryApp.AiWorker.Host`) and its own container image, built with `dotnet publish` from that host. In Kubernetes each image is a separate deployment that scales on its own. All of this stays in the same solution and repository; a solution filter (`.slnf`) can narrow the IDE to one service. Separate solutions or repositories only pay off with organisational reasons, such as separate teams or release cycles.

*To be completed once all parts of the decision are settled.*
