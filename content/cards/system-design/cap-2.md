---
schemaVersion: 1
id: cap-2
title: "CP vs AP, in systems you actually use"
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
baseLikes: 8930
---
ZooKeeper and etcd stall rather than disagree. Cassandra and Dynamo keep answering and heal afterwards. "CA" only exists when the network is healthy.

## Detail

CP systems like ZooKeeper, etcd and Consul are built around a consensus protocol. A write only commits once a quorum acknowledges it, so a minority partition simply stops accepting writes. Your service sees timeouts or errors instead of conflicting data — painful, but never wrong.

AP systems like Cassandra and Riak accept writes on whichever replicas are reachable. Divergent versions are reconciled later through last-write-wins timestamps, vector clocks, or CRDTs. You get uptime, and you inherit the job of resolving conflicts sensibly.

Most production databases are tunable rather than dogmatic. Cassandra lets you request QUORUM reads and writes to get effectively strong consistency; DynamoDB offers both eventually consistent and strongly consistent reads on the same table. Treat CP and AP as dials on a request, not labels on a logo.
