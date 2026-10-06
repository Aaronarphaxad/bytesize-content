---
schemaVersion: 1
id: do-observability
title: "Metrics, logs and traces each answer one question"
topic: devops
kind: image
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: OpenTelemetry · Observability Primer
  url: https://opentelemetry.io/docs/concepts/observability-primer/
reviewed: "2026-10-06"
baseLikes: 17300
image:
  url: https://picsum.photos/seed/bytesize-observability/1200/900
  caption: Three lenses on the same incident.
---
Metrics say something is wrong. Traces say where. Logs say why. Having two of the three is how incidents turn into archaeology.

## Detail

Metrics are cheap aggregates over time, so they are what you alert on and what shows you a trend. They tell you error rate tripled at 14:02. They cannot tell you which of forty services caused it.

Traces stitch one request across service boundaries with timing per hop. That is how you find the slow span and stop guessing. Without them, a latency regression in a microservice architecture is a group chat full of people claiming it is not their service.

Logs carry the detail — the stack trace, the offending id, the branch taken. They are expensive at volume, so the discipline is structured events with a trace id attached, which turns "grep everything" into "show me this request".
