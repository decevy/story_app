# Architecture decision records

Structural decisions are recorded here, one decision per file.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-solution-structure.md) | Solution structure for the modular monolith | Accepted |
| [0002](0002-data-ownership.md) | Data ownership per module | Accepted |
| [0003](0003-module-communication.md) | Communication between modules | Accepted |
| [0004](0004-test-strategy.md) | Test strategy | Accepted |

## Rules

- **One decision per ADR, about one page.** If it gets longer, it probably holds two decisions.
- **An accepted ADR is not rewritten.** To change a decision, write a new ADR and set the old one's status to *Superseded by ADR-NNNN*. Fixing typos and broken links is fine.
- **Numbers are assigned in order** and never reused. The file name is `NNNN-short-title.md`.
- **Status** is one of *Proposed*, *Accepted*, *Superseded by ADR-NNNN* or *Deprecated*.

## Template

```markdown
# NNNN. Title

- **Status:** Proposed
- **Date:** YYYY-MM-DD

> **Summary.** In the context of <situation>, facing <concern>, we decided for <option>
> and against <other options>, to achieve <goal>, accepting <downside>.

## Context

What is going on, and why a decision is needed now.

## Considered options

1. **Option A.** What it is, its main advantage and drawback.
2. **Option B.** …

## Decision

What we do, specific enough to act on.

## Consequences

**Positive**
- …

**Negative**
- …

**Follow-up**
- Work or decisions that follow from this one.
```
