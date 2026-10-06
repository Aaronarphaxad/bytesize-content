---
schemaVersion: 1
id: sd-cdn-cache
title: Read-through caches and the stampede
topic: system-design
kind: text
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: Designing Data-Intensive Applications
  url: https://dataintensive.net/
reviewed: "2026-10-06"
baseLikes: 9150
---
On a miss the cache fetches, stores, then returns. The danger is a popular key expiring while a thousand requests all miss at once.

## Detail

A read-through cache sits in front of your source of truth and populates itself on demand. Application code asks the cache, the cache asks the database only when it has nothing, and the result is stored for the next reader.

The failure mode is a cache stampede. A hot key expires, and every concurrent request misses simultaneously and hammers the database with identical queries. The database that comfortably handled one query per minute now gets a thousand at once.

Defend with request coalescing so only one fetch per key is in flight, and jitter your TTLs so related keys do not expire in lockstep. Serving slightly stale data while a single refresh runs is almost always better than a thundering herd.
