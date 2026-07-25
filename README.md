# Golden Triangle Mutual Fund Analyzer

React + TypeScript front end and a Spring Boot back end that score mutual funds using the **Golden Triangle** strategy:

1. **Rolling Return** — Fund average > Benchmark average
2. **COB** — Chance of Beating Benchmark > 70%
3. **Sharpe Ratio** — Fund Sharpe > Benchmark Sharpe

## Stack

### Front end
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui-style components
- Recharts (via the shadcn chart wrapper)
- TanStack Table, Zod
- Framer Motion, Lucide Icons

### Back end
- Spring Boot 3.4 on Java 17, hexagonal architecture (ports and adapters)
- Analytics, Golden Triangle rules and insight generation in the domain layer
- Caffeine cache, feature flags, springdoc OpenAPI
- Optional persistence: MySQL, PostgreSQL, H2 (JPA + Flyway) or MongoDB

## Getting Started

```bash
npm install
npm run dev
```

This starts:
- **Vite** at `http://localhost:5173`
- **Spring Boot** at `http://localhost:8080`

Open `http://localhost:5173` in your browser. Vite proxies `/api/*` to the back end.

The back end defaults to the `mysql` profile (`root` / `123456` on port 5000). Pick a different
store with `-Dspring-boot.run.profiles=h2`, `postgres`, `mongo` or `nodb`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Spring Boot API and the Vite dev server |
| `npm run dev:client` | Vite only |
| `npm run dev:api` | Spring Boot only |
| `npm run dev:demo` | Vite in demo mode, serving captured fixtures instead of the API |
| `npm run build` | Type-check and produce a production build |
| `npm run build:demo` | Production build with demo mode on by default |
| `npm run demo:capture` | Refresh the demo fixtures from a running back end |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |
| `npm run test` | Front-end unit tests (Vitest) |
| `npm run test:api` | Back-end tests, including the ArchUnit rules |

## Architecture

```
Browser → Vite (/api/*) → Spring Boot (:8080)
                               ├─ api.mfapi.in — fund NAV + catalog (Report, Compare fund metrics)
                               └─ analysis.investt.in — benchmark rows + Analyze page
                               ↓
        Domain analytics (rolling returns from NAV, Golden Triangle rules, insights)
                               ↓
        Rolling aggregates cached in memory and, optionally, in SQL or Mongo
                               ↓
                       Dashboard + 17 charts
```

### Data sources

| Page / feature | Fund NAV & search | Rolling returns (fund) | Benchmark / index |
|----------------|-------------------|------------------------|-------------------|
| **Analyze** (`/dashboard`) | investt.in | investt.in | investt.in |
| **Fund report** | mfapi.in | Computed locally from mfapi daily NAV | investt.in (bridged by fund name) |
| **Compare** | mfapi.in | Computed locally from mfapi daily NAV | investt.in (COB, alpha) |

The upstream investt API blocks browser CORS and requires a GET with a multipart body, so the back end
owns that call, caches responses, and serves the analytics to the UI. mfapi.in provides free daily NAV
history; fund rolling returns, SIP, lumpsum, and matrix cells are derived from that series on the server.
Fund-versus-index rolling aggregates for the Analyze page are stored incrementally, so a later request only
folds in the NAV rows that arrived since the last computation.

## Demo mode

Demo mode is a **separate front-end build** that serves every API response from JSON files in
`public/demo`. Use it for demos, portfolios, or any environment where the back end should not
run. Live builds (`npm run dev`, `npm run build`) always talk to `/api/*` and never show demo
controls.

```bash
npm run dev:demo      # local demo with fixtures
npm run build:demo    # static demo build for hosting
```

In a demo build the navbar shows a **Demo data** badge and sample-fund chips on Analyze and
Report. **Use live data** opens a guide for running the live application separately — it does
**not** switch this demo page to the API. Live mode requires its own front-end server
(`npm run dev` or `npm run dev:client`) plus the Spring Boot back end on port 8080.

Every response still passes through the same zod schemas, so a stale fixture fails loudly
instead of rendering wrong numbers.

### Refreshing the fixtures

```bash
npm run dev:api        # back end must be up
npm run demo:capture   # or double-click scripts\capture-demo-data.bat
```

The script resolves each fund in `DEMO_FUNDS` through `/api/schemes`, so scheme spellings are
never hardcoded, then captures the report, all rolling-return periods, all four matrix modes,
the fund-versus-index matrix, and peers per fund, plus one shared feature-flag, scheme list and
comparison payload. Filenames are recorded in `public/demo/manifest.json`, which is the only
thing the front end reads to find a fixture. Long NAV series are sampled down to 400 points a
side, keeping the chart shape while holding the whole data set at about 5 MB.

A fund is dropped from the demo set if its report cannot be captured, so the search list and the
quick-pick chips only ever offer funds that have data.

## Feature flags

`GET /api/features` returns the enabled flags. The UI gates panels and charts on them via
`FeatureGate`, and the back end gates endpoints and beans on the same keys, so a feature can be
switched off in `application.yml` without touching either code base.

## Pages

- **/** — Landing page with animated hero
- **/dashboard** — Full fund analysis with stat cards, Golden Triangle result, rolling-returns table and 17 charts
- **/compare** — Compare up to 5 funds with a table and a radar chart
- **/method** — Golden Triangle method explainer

## Keyboard Shortcuts

- `Ctrl/Cmd + K` — Command palette (search, favorites, recent analyses)
