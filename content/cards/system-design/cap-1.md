---
schemaVersion: 1
id: cap-1
title: "CAP: you only pick two under partition"
topic: system-design
kind: text
difficulty: advanced
tags: []
readMinutes: 1
status: published
source:
  label: Designing Data-Intensive Applications
  url: https://dataintensive.net/
reviewed: "2026-10-06"
baseLikes: 12400
---
When the network splits, a distributed system cannot be both consistent and available. You either refuse requests or serve possibly stale data.

## Detail

CAP is often misquoted as "pick two of three." That framing is misleading, because partition tolerance is not optional — networks drop packets, links saturate, and machines become unreachable. Partitions will happen whether you plan for them or not.

The real choice only appears during a partition. At that moment a node that cannot reach its peers has two options: refuse to answer so it never contradicts the rest of the cluster (consistency), or answer from whatever it knows locally and reconcile later (availability).

Outside of partitions, well-built systems deliver both strong consistency and high availability simultaneously. That is why PACELC extends CAP: it asks what you trade during normal operation too, and the honest answer for most systems is latency.
