# 0003. Communication between modules

- **Status:** Accepted
- **Date:** 2026-11-28

> **Summary.** In the context of modules that cannot read each other's data and must later run as separate services, facing the need to ask questions and announce changes across modules, we decided for PublicApi and IntegrationEvents projects per module and our own `IEventBus`, in-process for now, and against a single Contracts project, a broker from the start or MediatR, to keep coupling visible and the transport replaceable, accepting that in-process events can be lost until an outbox exists.

## Context

Modules cannot read each other's data ([ADR-0002](0002-data-ownership.md)), so they need another way to ask each other questions and to announce what happened. Whatever we choose now has to keep working when modules run as separate services and a message broker arrives.

## Considered options

1. **Public part of a module:** one `Contracts` project, or separate `PublicApi` and `IntegrationEvents` projects.
2. **Synchronous calls:** through a public interface, not at all (events only), or directly into another module's Application layer.
3. **Events:** our own small `IEventBus` with an in-process implementation first; a message broker from the start; MediatR notifications.
4. **Kinds of events:** separate domain events and integration events, or one kind.

## Decision

Modules only talk to each other through their public projects. A module never references another module's Domain, Application, Infrastructure or Api project.

- **Questions go through PublicApi.** When a module needs an answer right away, it calls an interface from the other module's PublicApi (for example `IUserDirectory`). The other module implements it in its Application project. When that module is split off, the same interface gets an HTTP or gRPC client as implementation, and the calling code stays the same. Synchronous calls are strong coupling (if the other module fails, the caller fails too), so we prefer events where an immediate answer is not needed.
- **Things that happened go through IntegrationEvents.** A module announces what happened as an event record in its IntegrationEvents project (for example `PassageWritten`). Other modules subscribe with a handler. The publishing module does not know who listens.
- **One kind of event.** We don't separate internal domain events from integration events. The Application layer publishes an event after it has saved the change; the domain itself does not raise events, so Domain keeps depending on nothing.
- **Events go through our own `IEventBus`.** Modules publish through `IEventBus` and handle events through `IIntegrationEventHandler<T>`, both from `StoryApp.Common` (see [ADR-0001](0001-solution-structure.md)). For now the implementation runs in-process: it calls the handlers directly. Once there is a message broker, an implementation backed by the broker replaces it without changes in the modules. Until then, an event can be lost if the application stops between saving and publishing; an outbox will close that gap together with the broker.

## Consequences

**Positive**
- Project references show which modules ask each other questions and which only listen.
- The transport can change from in-process to a broker without changes in the modules.

**Negative**
- An event can be lost if the application stops between saving and publishing, until an outbox exists.
- Calls through PublicApi become network calls after a split, and can fail or be slow.

**Follow-up**
- An ADR on the message broker and the outbox.
