---
name: roadmap
description: Make structural and architecture decisions for StoryApp based on the roadmap, not the current size of the app. Use when choosing a folder structure, module or feature boundaries, state management, shared abstractions, or between design options ("which option should we pick", "how should we structure this"), or when the user runs /roadmap.
---

# Roadmap-fit decisions

Recommend the option that fits StoryApp **as it will be once the roadmap is built**, not the
smallest option for its current size. Choosing for today often means reorganising again later.

## Steps

1. **Read the roadmap.** In `storyapp-web/SPEC.md`, read "Current Limitations / Unused
   Features" and the API sections. Endpoints marked "available, not used in UI" are planned
   features. Also check the backend (`StoryApp/`) for hub methods and endpoints that no client
   uses yet. List the planned features that affect this decision.
2. **Describe two states.** *Today*: features, file count, shared pieces. *Roadmap built*: the
   same, after the planned features land (new features, UI shared between features, real-time
   events, state that crosses features).
3. **Compare the options against both states.** For each option: how well it fits today, how
   well it fits the future, and what it costs to migrate later if we pick the smaller option
   now.
4. **Recommend the option that fits the future app.** Name the roadmap items that drive the
   choice. If no roadmap item affects the decision, say so and pick the simplest option.
5. **Separate "now" from "later".** Set up the structure and rules now: folder layout, import
   boundaries, naming. Postpone empty scaffolding: don't create `shared/`, base classes or
   abstractions until real code needs them. Never build for features that are not on the
   roadmap.

## Output

- **Recommendation**: the option, in one sentence.
- **Roadmap drivers**: the planned features that decide it.
- **Do now**: concrete changes for this step.
- **Postpone**: what waits until a feature needs it.
- **Risk**: what changes if the roadmap changes, and how hard it is to undo.

## Exceptions

If the user asks for "the simplest option for now" or "just for now", give them that, and
mention in one line what the roadmap would suggest.
