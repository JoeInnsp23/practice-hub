---
status: active
created: 2025-11-02
updated: 2025-11-02
category: decisions
tags: [adr, architecture]
---

# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural and design decisions made for Practice Hub.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows the template in [`.templates/ADR_TEMPLATE.md`](../.templates/ADR_TEMPLATE.md).

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](0001-example-adr.md) | Example ADR | Example | 2025-11-02 |

## Creating a New ADR

1. Copy the template: `cp docs/.templates/ADR_TEMPLATE.md docs/decisions/NNNN-title.md`
2. Fill in the sections
3. Update this index
4. Commit with message: `docs(adr): add ADR NNNN - title`

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [ADR Template](../.templates/ADR_TEMPLATE.md)
