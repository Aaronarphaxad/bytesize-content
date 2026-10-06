---
schemaVersion: 1
id: do-containers
title: "Images are templates, containers are processes"
topic: devops
kind: text
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: "Docker · What is a container?"
  url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
reviewed: "2026-10-06"
baseLikes: 16200
---
An image is an immutable stack of filesystem layers. A container is one running instance with its own namespaces and a thin writable layer.

## Detail

An image is a read-only stack of layers plus metadata about how to start it. Layers are content-addressed and shared, which is why pulling your tenth image built on the same base downloads almost nothing new.

A container is that image actually running: a process tree with its own mount, network and PID namespaces, cgroup limits, and a thin copy-on-write layer for anything it writes. Delete the container and that writable layer goes with it.

This is why "it works in my container" is a reasonable claim and "I'll just edit the file in production" is not. Changes inside a running container are invisible to the image, so the next deploy silently reverts them. Rebuild the image instead.
