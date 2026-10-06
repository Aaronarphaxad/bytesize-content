---
schemaVersion: 1
id: ds-heap
title: Top-K without sorting anything
topic: data-structures
kind: code
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: Introduction to Algorithms (CLRS)
  url: https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/
reviewed: "2026-10-06"
baseLikes: 16700
---
Keep a size-K heap of the current winners and stream past millions of items. Memory stays bounded and you never sort the full dataset.

## Detail

A binary heap gives you O(log n) insertion and O(1) access to its smallest element. That combination is exactly what "top K of a stream" needs, and it is why the pattern shows up in leaderboards, log analysis and recommendation pipelines.

The trick is counter-intuitive: to find the K largest items, maintain a min-heap of size K. Each new item is compared against the smallest of your current winners, and only replaces it if it is larger. Memory is O(K) no matter how long the stream is.

Compare the alternatives. Sorting everything is O(n log n) and needs the whole dataset in memory. The heap is O(n log K) and needs only K items — which is the difference between a job that runs and a job that gets OOM-killed.

## Code

```typescript
// K largest from a stream, O(K) memory
function topK(stream: number[], k: number) {
  const heap = new MinHeap<number>();
  for (const value of stream) {
    if (heap.size < k) {
      heap.push(value);
    } else if (value > heap.peek()) {
      heap.pop();
      heap.push(value);
    }
  }
  return heap.toArray();
}
```
