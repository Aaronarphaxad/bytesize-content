---
schemaVersion: 1
id: ds-hash
title: "Hash maps are O(1) on average, not always"
topic: data-structures
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: Introduction to Algorithms (CLRS)
  url: https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/
reviewed: "2026-10-06"
baseLikes: 19200
---
A good hash spreads keys across buckets so lookups stay near constant. Collisions are normal; pathological collisions are a denial-of-service vector.

## Detail

A hash map converts a key into a bucket index and looks there. With a well-distributed hash and a sensible load factor, each bucket holds roughly one item and lookups are effectively constant time regardless of how much data you store.

Collisions are resolved by chaining items in a bucket or probing for the next free slot. Both degrade as the table fills, which is why implementations resize and rehash once the load factor crosses a threshold — an occasional expensive insert buying consistently cheap lookups.

The worst case matters more than textbooks suggest. If an attacker can choose keys that all hash to one bucket, every lookup becomes a linear scan and your O(1) structure becomes O(n). This is why modern runtimes use randomly seeded hash functions by default.
