---
schemaVersion: 1
id: sec-secrets
title: A committed secret is a leaked secret
topic: security
kind: code
difficulty: intermediate
tags: []
readMinutes: 1
status: published
source:
  label: OWASP · Secrets Management
  url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
reviewed: "2026-10-06"
baseLikes: 22400
---
Deleting it in the next commit changes nothing — git keeps history forever. Rotate the credential; that is the only real remediation.

## Detail

Once a secret is committed and pushed it exists in every clone, every fork and every CI cache. Removing it in a follow-up commit leaves it fully retrievable in history, and rewriting history does not reach copies other people already pulled.

So the response is always rotation first. Issue a new credential, deploy it, revoke the old one, then clean up history as hygiene rather than as the fix. Treat the old value as public from the moment it was pushed.

Prevention is cheap by comparison: load configuration from the environment or a secret manager, keep .env gitignored with a committed .env.example for shape, and run a scanner like gitleaks as a pre-commit hook so the mistake never reaches a remote.

## Code

```bash
# .gitignore
.env
.env.*
!.env.example

# .env.example — shape only, no values
DATABASE_URL=postgres://user:pass@host:5432/db
STRIPE_SECRET_KEY=sk_test_...

# Catch it before it ever lands
npx gitleaks protect --staged
```
