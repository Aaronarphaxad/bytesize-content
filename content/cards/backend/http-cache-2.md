---
schemaVersion: 1
id: http-cache-2
title: ETags turn refetches into 304s
topic: backend
kind: text
difficulty: advanced
tags: []
readMinutes: 1
status: published
source:
  label: MDN · HTTP Caching
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
reviewed: "2026-10-06"
baseLikes: 9870
---
Once a cached copy goes stale, validators avoid re-downloading identical bytes. If-None-Match and If-Modified-Since let the server reply "nothing changed".

## Detail

A validator is a fingerprint the client can show the server to ask "is my copy still good?". ETag carries an opaque token; Last-Modified carries a timestamp. On revalidation the client sends If-None-Match or If-Modified-Since, and a matching server answers 304 Not Modified with no body.

Strong ETags change whenever a single byte changes. Weak ETags, prefixed W/, promise only semantic equivalence — useful when gzip levels or timestamps shift without the content meaningfully differing.

Timestamps have one-second resolution and go wrong across replicas with drifting clocks, so prefer ETags when you can compute them cheaply. A content hash makes an excellent ETag and happens to be something build pipelines already produce.
