---
schemaVersion: 1
id: be-nplus1
title: The N+1 query that kills your p99
topic: backend
kind: code
difficulty: advanced
tags: []
readMinutes: 1
status: published
source:
  label: Prisma · Query Optimization
  url: https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance
reviewed: "2026-10-06"
baseLikes: 31400
---
Load a list, then query once per row, and a 50ms endpoint becomes 2 seconds. It only shows up in production because dev databases have ten rows.

## Detail

The pattern hides inside innocent-looking code. Fetch 100 posts, then loop and access post.comments, and your ORM quietly issues 100 additional queries. Each is fast on its own, so nothing looks wrong in a profiler summary — only the total is catastrophic.

The fix is to batch. Either join in a single query, or collect all the parent ids and issue one IN query, then group the results in memory. DataLoader-style batching does this automatically by deferring and coalescing lookups within a tick.

Catching it early is mostly tooling. Log query counts per request, seed your dev database with realistic row counts, and fail CI when an endpoint exceeds a query budget. N+1 is trivial to fix and nearly invisible without instrumentation.

## Code

```sql
-- N+1: one query, then one per row
SELECT * FROM posts LIMIT 100;
SELECT * FROM comments WHERE post_id = 1;
SELECT * FROM comments WHERE post_id = 2;
-- ...98 more round trips

-- Batched: two queries, total
SELECT * FROM posts LIMIT 100;
SELECT * FROM comments
WHERE post_id = ANY($1::int[]);
```
