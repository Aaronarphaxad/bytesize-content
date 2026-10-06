---
schemaVersion: 1
id: ds-bloom
title: "Bloom filters answer \"no\" with certainty"
topic: data-structures
kind: text
difficulty: advanced
tags: []
readMinutes: 1
status: published
source:
  label: Designing Data-Intensive Applications
  url: https://dataintensive.net/
reviewed: "2026-10-06"
baseLikes: 14300
---
A bit array plus a few hash functions. False positives happen, false negatives never do — which makes them perfect for skipping disk lookups.

## Detail

A Bloom filter hashes each inserted item to several positions in a bit array and sets those bits. To test membership you check the same positions: any zero proves the item was never added, while all ones only suggests it probably was.

That asymmetry is the whole point. Because "definitely not present" is reliable, you can put a tiny in-memory filter in front of an expensive lookup and skip the disk read entirely for the common case of a missing key. LevelDB and Cassandra both do exactly this per SSTable.

The tradeoffs are worth knowing: the false-positive rate depends on bit-array size relative to item count, and a standard Bloom filter cannot support deletion because clearing a bit might break some other item. Counting Bloom filters trade more space for that ability.
