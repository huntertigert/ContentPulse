# ContentPulse — Content Freshness Dashboard

A full-stack content freshness tracking dashboard built for SEO teams and content managers. Monitor content decay, prioritize updates, and optimize your pages for AI Search Generation (GEO).

![Dashboard Screenshot](screenshots/dashboard-signin.jpg)

## Features

- **Freshness Loop** — Visual progress bar showing the percentage of your site that's been updated within 90 days
- **Priority Score** — Weighted composite score (0–100) combining decay rate, traffic value, traffic trends, keyword opportunity, AI citation likelihood, and content depth — one number that tells you what to work on first
- **AI Citation Prediction** — Real GPT-4o-mini scoring that predicts whether AI assistants (ChatGPT, Claude, Gemini) are likely to cite each page, with a reason for each score
- **Decay Score & Triage** — Automatic classification of every page as Critical, Needs Review, or Healthy based on content age and traffic trends
- **Refresh Recommendations** — Per-page actionable advice based on content age, traffic drops, word count, keyword positions, and AI citation risk
- **Batch Actions** — Multi-select pages and assign workflow status (Queued, In Progress, Refreshed), or export selected pages as CSV
- **SEMrush Integration** — Upload a SEMrush Organic Positions CSV to enrich pages with keyword count, top keyword, best position, search volume, and keyword difficulty
- **Live Data Sync** — Automatic sitemap crawling with metadata scraping, plus Google Search Console API integration for real traffic data
- **CSV Import/Export** — Bulk import from Google Search Console, WordPress, Google Analytics, SEMrush, or manual CSV; export current view with all metrics
- **Sortable & Filterable** — All columns sortable, content type filtering (blog, news, all), date range filtering, URL search, and pagination
- **Google Authentication** — Clerk-based sign-in with optional domain restriction to limit access to specific organizations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express 5, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Clerk (Google OAuth) |
| AI | OpenAI GPT-4o-mini (via Replit AI Integrations) |
| API | OpenAPI spec, Orval codegen, Zod validation |
| Monorepo | pnpm workspaces |

## Project Structure

```
ContentPulse/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   ├── src/
│   │   │   ├── app.ts       # Express app with Clerk middleware
│   │   │   ├── routes/      # API routes (pages, settings, sync)
│   │   │   ├── middlewares/  # Auth middleware with domain restriction
│   │   │   └── lib/         # Freshness scoring algorithms
│   │   └── package.json
│   ├── freshness-dashboard/ # React frontend
│   │   ├── src/
│   │   │   ├── App.tsx      # Clerk auth + routing
│   │   │   ├── pages/       # Dashboard page
│   │   │   ├── components/  # DataTable, StatCards, Modals, etc.
│   │   │   └── hooks/       # Data fetching & sync hooks
│   │   └── package.json
│   └── dashboard-deck/      # Slide deck for showcasing the product
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/huntertigert/ContentPulse.git
   cd ContentPulse
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/contentpulse
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
   AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Push the database schema**
   ```bash
   pnpm --filter @workspace/db run push
   ```

5. **Generate API client**
   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

6. **Start the dev servers**
   ```bash
   pnpm --filter @workspace/api-server run dev
   pnpm --filter @workspace/freshness-dashboard run dev
   ```

### Deploy on Replit

The easiest way to run this project is on [Replit](https://replit.com):

1. Import the GitHub repo into a new Replit project
2. Ask the Agent to set up Clerk authentication and the OpenAI integration
3. The database and environment are provisioned automatically
4. Click Publish to deploy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/healthz` | Health check (public) |
| GET | `/api/pages` | List all pages with freshness data |
| POST | `/api/pages` | Add a page manually |
| POST | `/api/pages/upload-csv` | Bulk CSV import |
| POST | `/api/pages/upload-semrush-csv` | SEMrush keyword CSV import |
| DELETE | `/api/pages/:id` | Remove a page |
| GET | `/api/pages/stats` | Dashboard statistics |
| POST | `/api/pages/batch-status` | Batch update workflow status |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/sync/sitemap` | Sync pages from sitemap |
| POST | `/api/sync/gsc` | Sync traffic from Google Search Console |
| POST | `/api/sync/rescore-ai` | Re-score AI citation predictions |
| GET | `/api/sync/status` | Check sync status |

## Freshness Algorithm

- **Freshness Score (0–100)**: Based on days since last update, boosted by strong traffic or upward trends
- **Decay Score (0–100)**: Inverse of freshness, amplified for pages over 90 days old with declining traffic
- **Priority Score (0–100)**: Weighted composite — decay (35%), keyword opportunity (20%), traffic value (15%), traffic decline (10%), AI citation (8%), content depth (6%)
- **Triage Status**:
  - **Critical**: Over 90 days old with declining traffic, or decay score 75+
  - **Needs Review**: Over 90 days old, or over 60 days with declining traffic
  - **Healthy**: Under 30 days old with stable or rising traffic

## Authentication

By default, the app uses Clerk for Google OAuth authentication with domain restriction. To remove authentication or change the allowed domains, see the middleware files in `artifacts/api-server/src/middlewares/`.

## License

MIT
