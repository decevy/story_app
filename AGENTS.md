# Agent instructions — StoryApp

This repository is being **rebuilt from scratch**. Read `README.md` for the product idea, the target architecture and the roadmap.

## `legacy/` is reference only

- `legacy/` holds the previous version (also tagged `v0-legacy`). **Do not change, build or extend it.**
- You may read it to see how something worked before. When you port an idea, rewrite it in the new structure. Don't copy whole files.
- Parts of the legacy code come from the chat-app era (typing indicators, user search, system passages, writer management, Redis without a function). Don't treat them as requirements. Every feature is reassessed before it comes back.
- The old docs (`legacy/AGENTS.md`, `legacy/storyapp-ng/SPEC.md`, the `roadmap` skill under `legacy/.claude/`) describe the old code, not the new one.
- `legacy/` is removed once the new version has taken over everything worth keeping.

## How we work

- **Small steps.** Each piece of work belongs to one issue in the tracker. Branches are named `<type>/<slug>` (`feature/health-endpoint`, `bug/token-refresh`), without ticket IDs; the same goes for commits and PRs. The `work` skill links branches and PRs to the issue on the tracker side.
- **The owner of the repo writes the core logic and reviews everything.** When asked for scaffolding, leave clear `TODO`s for the parts the owner implements, each with a short hint. Don't fill them in unless asked.
- **No commit without approval.** Show the change, explain the choices, and commit only after the owner agrees.
- **Structural decisions** (service boundaries, broker choice, solution layout, state management) are recorded as an ADR in `docs/adr/NNNN-title.md`, following the template in `docs/adr/README.md`.
- **No empty scaffolding.** Don't create folders, projects, base classes or abstractions until real code needs them.
