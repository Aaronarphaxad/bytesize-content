---
schemaVersion: 1
id: do-ci
title: "CI is a trust gate, and flakes break it"
topic: devops
kind: text
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: Martin Fowler · Continuous Integration
  url: https://martinfowler.com/articles/continuousIntegration.html
reviewed: "2026-10-06"
baseLikes: 14700
---
The same checks on every change keep main releasable. One flaky test teaches the whole team to re-run red builds without reading them.

## Detail

Continuous integration works because the signal is binary and trustworthy. Lint, typecheck, test and build run identically on every change, and a red result blocks merge. That is what lets anyone deploy main without ceremony.

Flaky tests destroy the mechanism, not just the build. Once failures are sometimes meaningless, engineers start reflexively re-running instead of investigating, and the first genuine regression sails through on the second attempt.

Treat flakes as outages. Quarantine the test immediately so it stops blocking, file it with the same urgency as a bug, and track your flake rate as a real metric. A fast suite that people believe is worth more than a thorough one they ignore.
