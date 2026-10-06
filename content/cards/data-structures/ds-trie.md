---
schemaVersion: 1
id: ds-trie
title: Tries make prefixes free
topic: data-structures
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: "Algorithms · Sedgewick & Wayne"
  url: https://algs4.cs.princeton.edu/home/
reviewed: "2026-10-06"
baseLikes: 11900
---
Shared prefixes collapse into shared paths, so lookup cost tracks the length of the key rather than the size of the dictionary.

## Detail

A trie stores strings as paths through a tree, one character per edge. Every word sharing a prefix shares that portion of the path, so "car", "cart" and "carton" all walk the same first three nodes.

This is why autocomplete feels instant. Finding every completion of a prefix means walking to that prefix node and collecting the subtree beneath it — work proportional to the answer, completely independent of how many million words the dictionary holds.

The cost is memory, since a naive trie allocates a child map per node. Radix trees compress chains of single-child nodes into one edge, which is exactly what IP routing tables and filesystem path lookups use in production.
