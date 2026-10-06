---
schemaVersion: 1
id: be-rest-errors
title: "Errors are an API, design them"
topic: backend
kind: code
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: RFC 9457 · Problem Details for HTTP APIs
  url: https://www.rfc-editor.org/rfc/rfc9457
reviewed: "2026-10-06"
baseLikes: 13200
---
Clients need a stable machine-readable code and a human message. 4xx means the caller must change something; 5xx means it is your fault.

## Detail

A bare 400 with "Bad Request" forces every client to string-match your prose. The moment you reword a message you break their retry logic. A stable code field decouples their behaviour from your copy.

The status class carries the retry semantics. 4xx says retrying the identical request is pointless — fix the input, refresh the token, slow down. 5xx says the request was fine and retrying with backoff is reasonable. Returning 200 with an error body destroys this for every proxy and client library.

RFC 9457 problem details give you a ready-made shape so you do not invent one per service. Include enough context to act on — which field failed, how long to wait — and a correlation id so a user can report the failure and you can find it.

## Code

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests. Retry in 30s.",
    "retry_after": 30,
    "request_id": "req_01HQ8F3K2M"
  }
}
```
