---
name: GitHub push target
description: How code gets pushed to GitHub for this project
---
The user mirrors this repo to GitHub at `huntertigert/ContentPulse`, branch `main` (local branch is `master`, so push `master:main`).

**Why:** No GitHub remote is configured in git; only `gitsafe-backup` exists. Auth uses the installed github integration's access_token.

**How to apply:** In the code_execution sandbox, `const token = (await listConnections('github'))[0].settings.access_token;` then `git push https://x-access-token:${token}@github.com/huntertigert/ContentPulse.git master:main`. Set git user.email/name first if committing (identity is otherwise unset). Never print the token.
