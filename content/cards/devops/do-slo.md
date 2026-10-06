---
schemaVersion: 1
id: do-slo
title: Error budgets end the reliability argument
topic: devops
kind: text
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: Google SRE Workbook · Implementing SLOs
  url: https://sre.google/workbook/implementing-slos/
reviewed: "2026-10-06"
baseLikes: 12600
---
99.9% availability allows 43 minutes of failure a month. Spend it on shipping features, or spend it on incidents — but it is the same budget.

## Detail

An SLO is a target on a measurable indicator: successful requests, latency under a threshold, freshness of a pipeline. The gap between that target and 100% is your error budget, and it converts reliability from an opinion into arithmetic.

This is what makes the perpetual argument tractable. Product wants velocity, operations wants stability, and the budget tells you which one gets to be right this month. Budget remaining means ship faster; budget exhausted means stop feature work and fix reliability.

Choose targets from what users notice, not from how many nines sound impressive. Every extra nine costs roughly an order of magnitude more engineering, and chasing one nobody can perceive is how teams burn a quarter achieving nothing a customer would mention.
