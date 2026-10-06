---
schemaVersion: 1
id: sec-xss
title: XSS runs attacker code in your origin
topic: security
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: OWASP · XSS Prevention
  url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
reviewed: "2026-10-06"
baseLikes: 19800
---
Injected script inherits your cookies, your session and your DOM. Escaping depends entirely on where the value lands.

## Detail

Cross-site scripting means attacker-controlled script executing on your origin, with full access to the session. From there it can exfiltrate tokens, rewrite the page, or quietly submit authenticated requests as the user.

There is no single escape function, because the rules differ by context. The same string needs different treatment inside HTML text, an attribute, a URL, a style block or a script block. Escaping for HTML and then injecting into an href is still exploitable via javascript: URLs.

Defend in layers. Let your framework do contextual escaping and never reach for dangerouslySetInnerHTML without sanitising through something like DOMPurify. Then add a Content-Security-Policy so that even a successful injection has no permitted script source to run from.
