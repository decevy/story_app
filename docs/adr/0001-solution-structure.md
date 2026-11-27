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

### Layout

```
src/
  StoryApp.Host/                                composes the modules into one application
  Modules/
    <Name>/
      StoryApp.Modules.<Name>.Domain/
      StoryApp.Modules.<Name>.Application/
      StoryApp.Modules.<Name>.Infrastructure/
      StoryApp.Modules.<Name>.Api/
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

*To be decided.*

### Communication between modules

*To be decided.*

### Tests

*To be decided.*

## Consequences

- **Splitting a module off does not mean a new solution.** The service gets its own thin host project (for example `StoryApp.AiWorker.Host`) and its own container image, built with `dotnet publish` from that host. In Kubernetes each image is a separate deployment that scales on its own. All of this stays in the same solution and repository; a solution filter (`.slnf`) can narrow the IDE to one service. Separate solutions or repositories only pay off with organisational reasons, such as separate teams or release cycles.

*To be completed once all parts of the decision are settled.*
