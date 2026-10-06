---
schemaVersion: 1
id: cloud-stateless
title: Stateless tiers are what make autoscaling work
topic: cloud
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: The Twelve-Factor App · Processes
  url: https://12factor.net/processes
reviewed: "2026-10-06"
baseLikes: 15100
---
If any instance can serve any request, you can add, kill and replace them freely. Sticky sessions quietly take that away.

## Detail

Keeping state out of your app servers is what turns them into interchangeable capacity. Session data goes to Redis or a signed cookie, uploads go to object storage, background jobs go to a queue. Any instance can then handle any request.

Sticky sessions look like a convenient shortcut and cost you the property you wanted. Load distributes unevenly, scaling in drops user sessions, and a deploy logs people out. The affinity you added for convenience becomes the reason you cannot scale smoothly.

Also treat local disk as scratch space only. Containers are replaced constantly and anything written locally disappears with them, which is why the twelve-factor guidance is to ship logs to stdout and let the platform aggregate them.
