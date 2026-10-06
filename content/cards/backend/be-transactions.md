---
schemaVersion: 1
id: be-transactions
title: "ACID in one breath, then the catch"
topic: backend
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: Designing Data-Intensive Applications
  url: https://dataintensive.net/
reviewed: "2026-10-06"
baseLikes: 18900
---
Atomic, consistent, isolated, durable. The letter that causes production bugs is I — almost nobody runs at the isolation level they assume.

## Detail

Atomicity means all-or-nothing. Consistency means your declared invariants hold at commit. Isolation means concurrent transactions behave as if they ran one after another. Durability means a committed write survives the power going out.

Isolation is the one that bites, because full serialisability is expensive and almost no database defaults to it. PostgreSQL defaults to Read Committed; MySQL to Repeatable Read. Both allow anomalies that a naive read-modify-write will hit under concurrency.

The practical habit is to name the anomaly you care about. Lost updates, write skew and phantom reads each have specific defences — SELECT FOR UPDATE, a unique constraint, or an explicit bump to SERIALIZABLE for the handful of transactions that genuinely need it.
