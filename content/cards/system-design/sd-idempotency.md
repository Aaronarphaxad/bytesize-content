---
schemaVersion: 1
id: sd-idempotency
title: Idempotency keys stop double charges
topic: system-design
kind: code
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: Stripe · Idempotent Requests
  url: https://stripe.com/docs/api/idempotent_requests
reviewed: "2026-10-06"
baseLikes: 28700
---
Retries duplicate requests. A client-supplied key lets the server recognise a replay and return the original result instead of charging twice.

## Detail

Any network call can succeed on the server and fail on the way back. The client sees a timeout and retries, and now you have two orders. This is not an edge case — it is the normal behaviour of mobile networks.

The fix is for the client to generate a unique key per logical operation and send it with every attempt. The server stores key → outcome before doing the work, so a replay finds the stored result and returns it unchanged rather than re-executing.

Two details decide whether this actually works. The TTL must comfortably exceed your longest retry window, and the key must be stored in the same transaction as the side effect — otherwise a crash between the two leaves you right back where you started.

## Code

```http
POST /v1/charges
Idempotency-Key: 7f3a9c21-order-1182
Content-Type: application/json

{ "amount": 4200, "currency": "usd" }

# Replaying the same key returns the original
# charge instead of creating a second one.
```
