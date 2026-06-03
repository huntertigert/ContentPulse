---
name: Sitemap blog filter
description: Why runSitemapSync drops non-blog URLs
---
`runSitemapSync` in `artifacts/api-server/src/routes/sync.ts` filters sitemap entries to `BLOG_PATH_RE = /\/blog\//i`, keeping only blog posts.

**Why:** This is the Content Freshness Dashboard — it tracks blog/content decay for SEO/GEO, so non-blog pages are intentionally excluded. Introduced deliberately in commit "Filter sitemap to only include blog posts".

**How to apply:** Code review tools may flag this as a behavior-narrowing bug. It is intended. Do not remove or "restore full coverage" unless the user explicitly asks to track non-blog pages.
