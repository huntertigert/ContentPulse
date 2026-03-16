# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Content Freshness Dashboard for SEO and AI Search (GEO) tracking.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
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
- **Data Table**: Page URL, Traffic (30d), Last Updated, Freshness Score, Decay Score, Triage Status, AI Citation
- **Triage Tabs**: All / Critical Refresh / Needs Review / Healthy
- **CSV Upload**: Import pages from CSV (url, title, lastUpdated, clicks30d, clicksPrev30d, wordCount, excerpt)
- **AI Citation Prediction**: Flags pages likely to be cited by AI (based on 300+ word count + excerpt format)
- **Decay Score Logic**: Pages 90+ days old with declining traffic flagged Critical

### API (`artifacts/api-server`)
Routes:
- `GET /api/pages` — list all pages with computed freshness data
- `POST /api/pages` — add a page manually
- `POST /api/pages/upload-csv` — bulk CSV import
- `DELETE /api/pages/:id` — remove a page
- `GET /api/pages/stats` — dashboard statistics

## Database Schema

`pages` table:
- id, url, title, last_updated, clicks_30d, clicks_prev_30d, word_count, excerpt, created_at

## Freshness Algorithm

- **Freshness Score (0-100)**: Based on days since last update, boosted by high traffic / upward trend
- **Decay Score (0-100)**: Inverse of freshness, amplified for pages >90d old with declining traffic
- **Triage Status**:
  - Critical: >90 days old + declining traffic, OR decay score ≥75
  - Review: >90 days old, OR >60 days old with declining traffic
  - Healthy: ≤30 days old with stable/rising traffic, OR generally fresh
- **AI Citation Likelihood**: page with 300+ words AND (100+ word excerpt OR 800+ words)
