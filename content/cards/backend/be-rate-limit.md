---
schemaVersion: 1
id: be-rate-limit
title: Token buckets allow bursts on purpose
topic: backend
kind: code
difficulty: intermediate
tags: []
readMinutes: 2
status: published
source:
  label: Cloudflare · Rate Limiting Rules
  url: https://developers.cloudflare.com/waf/rate-limiting-rules/
reviewed: "2026-10-06"
baseLikes: 15400
---
Tokens refill at a steady rate and accumulate up to a cap. Clients get a burst allowance without exceeding the long-run limit.

## Detail

A token bucket refills at a fixed rate and holds at most its capacity. Each request spends a token; an empty bucket means reject or wait. Capacity sets the burst you tolerate, refill rate sets the sustained throughput.

This is kinder than a fixed window. Fixed windows allow double the intended rate across a boundary — all of one window at the end, all of the next at the start — and they punish a client who sends five requests at once despite being well under budget.

Operationally, always tell clients what happened. 429 with Retry-After and the remaining quota lets well-behaved clients back off correctly instead of hammering you blindly. Rate limiting without feedback just converts one problem into a retry storm.

## Code

```typescript
class TokenBucket {
  private tokens: number;
  private updatedAt = Date.now();

  constructor(
    private capacity: number,
    private refillPerSecond: number,
  ) {
    this.tokens = capacity;
  }

  allow(): boolean {
    const now = Date.now();
    const elapsed = (now - this.updatedAt) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillPerSecond,
    );
    this.updatedAt = now;

    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
```
