# StoryApp

A collaborative storytelling app. Two people and an AI writer take turns, round-robin, writing one story. The result reads like a single page of a book: you can't tell who wrote which passage.

Later, stories stop being islands. Characters, places and objects can return in other stories, stories can break through into each other (crossovers), and at mirror times like 17:17 the world itself sometimes intervenes.

> **Status: restart.** The first version (a chat app that turned into this story app) lives in [`legacy/`](legacy/) and under the git tag `v0-legacy`. It serves as a reference only. The app is being rebuilt step by step in this repository, one small, reviewed step at a time.

## Stack

- **Backend:** ASP.NET Core, EF Core, PostgreSQL (pgvector later on)
- **Frontend:** Angular (zoneless, signals)
- **Real-time:** SignalR, with a Redis backplane once it runs on multiple instances
- **Messaging:** a message broker (RabbitMQ, Azure Service Bus or Redis Streams; not decided yet, see the ADRs)
- **Runtime:** containers on Kubernetes (Helm, KEDA), with `kind` locally and in CI

## Target architecture

Built incrementally: a modular monolith first, then services are split off where a split has a real reason. Every split is recorded in an ADR (architecture decision record).

| Service | Responsibility | Why it is separate |
|---|---|---|
| **Story API** | Stories, passages, turn order, writers, auth | The source of truth; the core of the domain |
| **Realtime gateway** | SignalR connections, live passages, "X is writing…" | Long-lived connections scale differently from request/response |
| **AiWorker** | Writes the AI's turns | Slow, external, rate-limited; scales on queue length |
| **Lore** (Api + Worker) | Characters, places, objects, rules and the relations between them, across stories | Data that spans stories; processing can be asynchronous |
| *Later:* Translation, Crossover, Omens | Writing together across languages, stories that break into each other, events at mirror times | See the roadmap |

## Roadmap

Planning and tasks live in Linear ([project Story App](https://linear.app/decevy/project/story-app-d5f72612befc), private). In broad strokes:

1. **Foundation**: repo, solution structure, local dev environment, CI
2. **First slice**: you and the AI write a story together, round-robin
3. **Containers & Kubernetes**: Dockerfiles, Helm, `kind` in CI
4. **Writing together**: a second human, real-time
5. **Event-driven + AiWorker**: message broker, outbox, the first split-off service
6. **Lore**: a shared memory across stories
7. **Later**: translation, crossovers, omens

## Repository layout

```
legacy/      the previous version (read-only, reference)
README.md    this file
AGENTS.md    instructions for coding agents
```

New folders are added as soon as real code needs them.
