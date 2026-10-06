---
schemaVersion: 1
id: lb-3
title: The smallest topology that survives a crash
topic: system-design
kind: diagram
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: AWS · Elastic Load Balancing
  url: https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
reviewed: "2026-10-06"
baseLikes: 5930
---
Clients hit one balancer; health checks quietly pull dead nodes out of rotation. Capacity dips, nobody gets an error page.

## Detail

Three app nodes behind one balancer is the minimum shape that tolerates a single failure without degrading. Lose one and you still have two thirds of capacity, which is survivable if you sized with headroom.

Two nodes is the trap. It looks redundant, but losing one doubles the load on the survivor, and if you were running above 50% utilisation that survivor falls over too. Cascading failure from "redundant" pairs is extremely common.

The balancer itself must not be a single point of failure. In practice that means a managed balancer across availability zones, or a pair with a floating virtual IP — otherwise you have just moved the outage one layer up.

## Diagram

```yaml
nodes:
  - id: c
    label: Clients
    x: 140
    y: 8
    width: 110
    height: 40
  - id: lb
    label: Load balancer
    x: 120
    y: 82
    width: 150
    height: 44
  - id: a
    label: App A
    x: 18
    y: 164
    width: 96
    height: 40
  - id: b
    label: App B
    x: 148
    y: 164
    width: 96
    height: 40
  - id: d
    label: App C
    x: 278
    y: 164
    width: 96
    height: 40
edges:
  - from: c
    to: lb
  - from: lb
    to: a
  - from: lb
    to: b
  - from: lb
    to: d
```
