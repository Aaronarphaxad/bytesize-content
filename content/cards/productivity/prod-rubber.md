---
schemaVersion: 1
id: prod-rubber
title: Rubber-ducking works because it forces precision
topic: productivity
kind: text
difficulty: intro
tags: []
readMinutes: 1
status: published
source:
  label: The Pragmatic Programmer
  url: https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/
reviewed: "2026-10-06"
baseLikes: 21700
---
Explaining the failing path out loud exposes the assumption you never checked. Most bugs die during the explanation, before the debugger opens.

## Detail

Reading code lets you skim past the step you believe you understand. Explaining it compels you to state what each line does and what you expect to be true, and the gap between belief and reality usually surfaces mid-sentence.

Be specific about expected versus actual state at each step. Vague narration — "then it saves the user" — hides exactly the detail where the bug lives. Naming the concrete value you expect is what makes the wrong one obvious.

Writing works as well as speaking, which is why drafting a careful bug report so often ends with you solving it. The duck is not magic; the forced rigour is. Keep one nearby anyway.
