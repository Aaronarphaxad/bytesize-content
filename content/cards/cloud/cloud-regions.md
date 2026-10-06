---
schemaVersion: 1
id: cloud-regions
title: "Multi-AZ is cheap, multi-region is not"
topic: cloud
kind: image
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: AWS · Global Infrastructure
  url: https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
reviewed: "2026-10-06"
baseLikes: 14100
image:
  url: https://picsum.photos/seed/bytesize-regions/1200/900
  caption: "Separate buildings, separate power, one low-latency link."
---
Availability zones are separate buildings on a fast private link. Regions are continents apart, and crossing them changes your architecture.

## Detail

A region is a geographic area; the availability zones inside it are physically separate datacentres with independent power, cooling and networking, connected by low-latency private fibre. Spreading across AZs is usually a configuration change and survives losing a whole building.

Multi-region is a different category of problem. Inter-region latency is tens to hundreds of milliseconds, so synchronous replication stops being viable and you confront real data consistency decisions, plus meaningful egress costs.

Be honest about which failure you are buying insurance against. Multi-AZ handles the overwhelming majority of real incidents. Multi-region handles regional outages and data-residency requirements, and it roughly doubles your operational surface — worth it when genuinely required, expensive theatre when not.
