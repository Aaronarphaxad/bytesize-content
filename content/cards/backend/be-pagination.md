---
schemaVersion: 1
id: be-pagination
title: OFFSET gets slower every page
topic: backend
kind: code
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: "Use The Index, Luke · No Offset"
  url: https://use-the-index-luke.com/no-offset
reviewed: "2026-10-06"
baseLikes: 24600
---
The database must count and discard every skipped row. Page 1000 reads 20,000 rows to return 20. Keyset pagination reads 20.

## Detail

OFFSET is not a seek, it is a scan-and-discard. OFFSET 20000 means the database genuinely walks twenty thousand rows and throws them away before returning anything. Cost grows linearly with page depth, so deep pages time out.

Keyset pagination remembers where you stopped and continues from there. Instead of "skip 20,000", you say "give me rows after this id", which an index can seek directly. Every page costs the same, whether it is the first or the ten-thousandth.

There is a second benefit people underrate: correctness. With OFFSET, rows inserted while a user paginates shift the window and items get silently skipped or duplicated. A cursor anchored to a stable sort key does not drift.

## Code

```sql
-- Slow and drifty: scans 20,000 rows
SELECT * FROM posts
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 20000;

-- Fast and stable: seeks the index
SELECT * FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```
