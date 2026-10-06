---
schemaVersion: 1
id: cap-3
title: "The CAP decision, sketched"
topic: system-design
kind: diagram
difficulty: advanced
tags: []
readMinutes: 1
status: published
source:
  label: Designing Data-Intensive Applications
  url: https://dataintensive.net/
reviewed: "2026-10-06"
baseLikes: 6210
---
Under a partition you choose: wait for agreement, or answer from local state. Everything else is a product decision about which failure users forgive.

## Detail

Draw the decision as a single branch. Is the node partitioned from its quorum? If no, serve normally. If yes, either block until the partition heals or serve stale local data.

Which branch you want is usually a product question, not an engineering one. A bank balance should stall; a like counter should absolutely not. The same company will pick different branches for different endpoints.

The useful habit is to write the choice down per subsystem. Teams get into trouble when nobody has decided, because the default answer ends up being whatever the database happened to do under load at 3am.

## Diagram

```yaml
nodes:
  - id: p
    label: Partitioned?
    x: 130
    y: 16
    width: 140
    height: 44
  - id: cp
    label: CP · wait or fail
    x: 20
    y: 130
    width: 150
    height: 48
  - id: ap
    label: AP · serve stale
    x: 230
    y: 130
    width: 150
    height: 48
edges:
  - from: p
    to: cp
    label: consistency
  - from: p
    to: ap
    label: availability
```
