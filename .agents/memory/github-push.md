---
name: GitHub push target
description: How code gets pushed to GitHub for this project
---
The user mirrors this repo to their GitHub account. The local branch is `master` but the GitHub default branch is `main`, so push `master:main`.

**Why:** No GitHub remote is configured in git (only `gitsafe-backup` exists), so the target repo path isn't in git config. Auth uses the installed github integration's access_token.

**How to apply:** In the code_execution sandbox, get the token via `const token = (await listConnections('github'))[0].settings.access_token;` and the user's repo from the github connection metadata (or ask the user if not present), then `git push https://x-access-token:${token}@github.com/<owner>/<repo>.git master:main`. Set git user.email/name first if committing (identity is otherwise unset). Never print the token.
