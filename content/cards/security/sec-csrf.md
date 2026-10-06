---
schemaVersion: 1
id: sec-csrf
title: CSRF rides along on your cookies
topic: security
kind: text
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: OWASP · CSRF Prevention
  url: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
reviewed: "2026-10-06"
baseLikes: 15900
---
Browsers attach cookies to cross-site requests automatically. Without SameSite or a token, any page can act as your logged-in user.

## Detail

The attack needs no access to your session. A malicious page simply causes the browser to issue a request to your domain, and the browser helpfully attaches the session cookie. Your server sees a perfectly authenticated request to transfer money or change an email.

SameSite cookies are the modern baseline. SameSite=Lax, now the default in major browsers, withholds cookies on cross-site subrequests while still allowing normal top-level navigation. Strict is tighter and occasionally breaks legitimate inbound links.

For anything sensitive, add an explicit defence. A synchroniser token or the double-submit cookie pattern requires a value the attacker cannot read due to same-origin policy. Authorization headers are naturally immune, which is why token-based APIs rarely need CSRF protection — but cookie-authenticated endpoints always do.
