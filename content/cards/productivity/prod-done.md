---
schemaVersion: 1
id: prod-done
title: "Agree what \"done\" means before you start"
topic: productivity
kind: diagram
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: Google Engineering Practices · Code Review
  url: https://google.github.io/eng-practices/review/
reviewed: "2026-10-06"
baseLikes: 10900
---
Code, tests, review, ship. A written checklist is what stops "done" meaning four different things in the same standup.

## Detail

Without a shared definition, done means whatever each person assumes. One engineer means the code compiles, another means it is reviewed, the product manager means customers are using it. Every status update is then subtly wrong.

Write the checklist once and keep it boring: tests at the right level, docs updated if behaviour changed, reviewed, observable in production, and deployed behind a flag if risky. Specific enough to check, short enough that people actually read it.

The payoff is that estimates start meaning something. When done includes review and deploy, "two days" accounts for the real work instead of the coding and a vague cloud of remaining effort nobody planned for.

## Diagram

```yaml
nodes:
  - id: code
    label: Code
    x: 6
    y: 78
    width: 84
    height: 40
  - id: tests
    label: Tests
    x: 108
    y: 78
    width: 84
    height: 40
  - id: review
    label: Review
    x: 210
    y: 78
    width: 94
    height: 40
  - id: ship
    label: Ship
    x: 322
    y: 78
    width: 78
    height: 40
edges:
  - from: code
    to: tests
  - from: tests
    to: review
  - from: review
    to: ship
```
