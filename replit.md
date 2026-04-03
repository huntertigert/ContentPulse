# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Content Freshness Dashboard for SEO and AI Search (GEO) tracking.

## Live Sync Features

- **Sitemap Sync**: Enter a sitemap URL (including sitemap index files); the backend fetches, parses, and upserts all pages with `lastmod` dates.
- **GSC Integration**: User pastes a Google Service Account JSON key + site URL. Backend calls the Search Console API to pull 30-day and previous 30-day click data per page.
- **Settings**: Key-value `settings` table in Postgres. Settings include `sitemapUrl`, `gscSiteUrl`, `gscServiceAccountJson`, `lastSitemapSync`, `lastGscSync`, `autoSyncEnabled`.
- **Connect & Sync modal**: Header button opens a modal with form inputs, step-by-step GSC instructions, "Sync Now" buttons, and status badges showing last sync time.

## Authentication

- **Provider**: Clerk (auto-provisioned via Replit integration)
- **Method**: Google OAuth + email sign-in
- **Domain restriction**: Only `@alkami.com` and `@alkamitech.com` email addresses allowed
- **Frontend**: Clerk `<SignIn>` component on `/sign-in` route; `<Show>` for auth gating; `DomainGate` component checks email domain client-side
- **Backend**: `clerkMiddleware()` on Express; `requireAuth` middleware on `/api/pages`, `/api/settings`, `/api/sync` — validates session + checks email domain server-side
- **Proxy**: `/__clerk` proxy path for production deployment

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Authentication**: Clerk (@clerk/express server, @clerk/react client)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── freshness-dashboard/ # React frontend dashboard
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Features

### Content Freshness Dashboard (`artifacts/freshness-dashboard`)
- **Freshness Loop** progress bar showing % of site under 90 days old
- **Stats cards**: Total Pages, Critical Refresh, Healthy, AI Citation Ready
- **Data Table**: Page URL, Traffic (30d), Last Updated, Priority Score, Decay Score, Triage Status, AI Citation, Keywords (SEMrush)
- **Priority Score**: Weighted composite (decay 35%, traffic value 15%, traffic decline 10%, keyword value 20%, AI citation 8%, content depth 6%) — single number telling content managers what to work on first
- **Refresh Recommendations**: Per-page actionable items (expand via lightbulb icon) — specific advice based on content age, traffic drop %, word count, keyword positions, AI citation risk
- **Batch Actions**: Multi-select pages with checkboxes, floating action bar to assign workflow status (Queued, In Progress, Refreshed, Clear Status), export selected as CSV
- **CSV Export**: Export current filtered/sorted view as CSV with all metrics, keywords, and recommendations
- **Workflow Status**: Per-page tracking badges (Queued/In Progress/Refreshed) shown inline next to page title
- **Triage Tabs**: All / Critical Refresh / Needs Review / Healthy
- **CSV Upload**: Import pages from CSV (url, title, lastUpdated, clicks30d, clicksPrev30d, wordCount, excerpt) — supports GSC, WordPress, GA, SEMrush, Manual tabs
- **SEMrush Integration**: Upload SEMrush Organic Positions CSV to enrich pages with keyword count, top keyword, best position, total search volume, and avg keyword difficulty
- **AI Citation Prediction**: Real OpenAI GPT scoring (gpt-4o-mini) — each page scored 0-100 with reason; ≥65 = "Likely"
- **Decay Score Logic**: Pages 90+ days old with declining traffic flagged Critical
- **Date Filtering**: Any time, 1 month, 3 months, 6 months, 1 year, 1.5 years, 2 years
- **Sortable Columns**: All columns sortable asc/desc (click headers)
- **Pagination**: 12 items per page

### API (`artifacts/api-server`)
Routes:
- `GET /api/pages` — list all pages with computed freshness data
- `POST /api/pages` — add a page manually
- `POST /api/pages/upload-csv` — bulk CSV import
- `POST /api/pages/upload-semrush-csv` — SEMrush keyword CSV import (matches to existing pages by URL)
- `DELETE /api/pages/:id` — remove a page
- `GET /api/pages/stats` — dashboard statistics

## Database Schema

`pages` table:
- id, url, title, last_updated, clicks_30d, clicks_prev_30d, word_count, excerpt, ai_citation_score, ai_citation_reason, semrush_keywords, semrush_top_keyword, semrush_top_position, semrush_volume, semrush_kd, created_at

## Freshness Algorithm

- **Freshness Score (0-100)**: Based on days since last update, boosted by high traffic / upward trend
- **Decay Score (0-100)**: Inverse of freshness, amplified for pages >90d old with declining traffic
- **Triage Status**:
  - Critical: >90 days old + declining traffic, OR decay score ≥75
  - Review: >90 days old, OR >60 days old with declining traffic
  - Healthy: ≤30 days old with stable/rising traffic, OR generally fresh
- **AI Citation Likelihood**: Real GPT-4o-mini scoring via OpenAI; score ≥65 = Likely, <65 = Unlikely; fallback heuristic if no AI score available
- **Rescore AI Endpoint**: `POST /api/sync/rescore-ai` — batch re-scores all pages' AI citation likelihood
