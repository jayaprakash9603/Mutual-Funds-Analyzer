# Analyzer

**Presentation-grade mutual fund research for India.**

Search any Indian mutual fund and open a deep report: Golden Triangle scoring, rolling returns, drawdowns, SIP / lump-sum / STP / SWP matrices, peer comparison, and meeting-ready one-liners — all from real NAV history.

<p align="center">
  <img src="Assets/report/overview/fund-overview.png" alt="Analyzer fund overview" width="920" />
</p>

<p align="center">
  <em>Fund overview — key facts, rating, and long-term growth on one screen.</em>
</p>

---

## Table of contents

- [What you can do](#what-you-can-do)
- [Golden Triangle method](#golden-triangle-method)
- [Product tour](#product-tour)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Option A — Docker (recommended)](#option-a--docker-recommended)
  - [Option B — Local development](#option-b--local-development)
  - [Option C — Demo mode (no backend)](#option-c--demo-mode-no-backend)
  - [Cloudflare Pages (demo hosting)](#cloudflare-pages-demo-hosting)
- [First-time walkthrough](#first-time-walkthrough)
- [Project structure](#project-structure)
- [Architecture & data sources](#architecture--data-sources)
- [Configuration](#configuration)
- [Scripts reference](#scripts-reference)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)

---

## What you can do

Analyzer turns daily NAV history into a **fund report** you can present in a review, client call, or personal study session.

| Area | What you get |
|------|----------------|
| **Snapshot** | Fund facts, AMC, category, NAV, age, rating, and long-term growth chart |
| **Golden Triangle** | Pass / fail on Rolling Return, Chance of Beating (COB), and Sharpe vs benchmark |
| **Returns** | Trailing returns, absolute growth of ₹10,000, calendar-year bars vs benchmark |
| **Rolling returns** | Avg / max / min / std, >10% hit rates, trend and distribution charts |
| **Probability** | Odds of negative returns, >7% / >10% returns, doubling / tripling money by horizon |
| **Risk** | Volatility, intra-year drawdowns, crash episodes, bear-market recovery, best-days cost, all-time highs |
| **Investment** | Lump sum, SIP (with tax / XIRR), STP, SWP, goal planner, wealth matrices |
| **Peers** | Category peer tables from investt.in rolling returns (cached for speed) |
| **Insights** | Strengths, watch-outs, risk level, and who the fund suits |
| **Export / share** | Download report PDF and share links from the report toolbar |

Presentation-ready **one-liners** sit above each section so the chart is easy to narrate without decoding every cell.

> **Note:** The primary product surface is the **Fund Report** (`/fund`). Analyze and Compare pages exist in the codebase but are currently dormant via feature flags.

---

## Golden Triangle method

A fund **passes** when all three checks succeed (defaults shown below):

| Rule | Pass condition |
|------|----------------|
| **Rolling Return** | Fund average rolling return **>** benchmark average |
| **COB** | Chance of beating the benchmark **> 70%** |
| **Sharpe Ratio** | Fund Sharpe **>** benchmark Sharpe |

<p align="center">
  <img src="Assets/report/overview/golden-triangle-result.png" alt="Golden Triangle result card" width="720" />
</p>

<p align="center">
  <em>Clear pass / fail with the three numbers side by side — useful as a first filter before deeper analysis.</em>
</p>

Read the full explainer in the app at **Method** (`/method`).

---

## Product tour

### Snapshot & score

| Overview | Score vs benchmark |
| :---: | :---: |
| <img src="Assets/report/overview/fund-overview.png" width="420" alt="Fund overview" /> | <img src="Assets/report/overview/golden-triangle-score.png" width="420" alt="Golden Triangle score" /> |

### Performance

| Returns dashboard | Rolling returns |
| :---: | :---: |
| <img src="Assets/report/performance/returns-dashboard.png" width="420" alt="Returns dashboard" /> | <img src="Assets/report/performance/rolling-returns-table.png" width="420" alt="Rolling returns table" /> |

| Calendar-year volatility | Probability of milestones |
| :---: | :---: |
| <img src="Assets/report/performance/calendar-year-volatility.png" width="420" alt="Calendar year volatility" /> | <img src="Assets/report/performance/probability-analysis.png" width="420" alt="Probability analysis" /> |

<p align="center">
  <img src="Assets/report/performance/rolling-return-trend.png" alt="Rolling return trend" width="900" />
</p>

<p align="center">
  <em>Rolling return trend — average, best, and worst windows at a glance.</em>
</p>

### Risk

| Drawdowns | Bear market & recovery |
| :---: | :---: |
| <img src="Assets/report/risk/drawdown-analysis.png" width="420" alt="Drawdown analysis" /> | <img src="Assets/report/risk/bear-market-recovery.png" width="420" alt="Bear market recovery" /> |

| Missing the best days | All-time highs |
| :---: | :---: |
| <img src="Assets/report/risk/best-days-miss-analysis.png" width="420" alt="Best days analysis" /> | <img src="Assets/report/risk/ath-frequency-chart.png" width="420" alt="ATH frequency" /> |

### Investment planners

| Lump sum | SIP |
| :---: | :---: |
| <img src="Assets/report/investment/lumpsum-analysis.png" width="420" alt="Lump sum analysis" /> | <img src="Assets/report/investment/sip-analysis.png" width="420" alt="SIP analysis" /> |

| CAGR / XIRR heat matrices | Goal planner |
| :---: | :---: |
| <img src="Assets/report/investment/lumpsum-cagr-matrix.png" width="420" alt="CAGR matrix" /> | <img src="Assets/report/investment/goal-planner-matrix.png" width="420" alt="Goal planner" /> |

### Peers & insights

| Peer comparison | Insights |
| :---: | :---: |
| <img src="Assets/report/assessment/peer-comparison.png" width="420" alt="Peer comparison" /> | <img src="Assets/report/assessment/ai-insights.png" width="420" alt="AI insights" /> |

---

## Prerequisites

### Docker path (easiest)

| Tool | Version |
|------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Recent stable |
| Docker Compose | v2 (`docker compose`) |

### Local development path

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | **20+** (22 recommended) |
| npm | Comes with Node |
| [JDK](https://adoptium.net/) | **17** |
| [Maven](https://maven.apache.org/) | **3.9+** |
| MySQL *(optional)* | **8.x** — or use `h2` / `nodb` profiles |

---

## Installation

### Option A — Docker (recommended)

One command builds the frontend, backend, and MySQL stack.

```bash
# 1. Clone
git clone https://github.com/jayaprakash9603/Mutual-Funds-Analyzer.git
cd Mutual-Funds-Analyzer

# 2. Optional: copy env overrides
cp .env.example .env

# 3. Build and start
docker compose up --build
```

| URL | What |
|-----|------|
| http://localhost | Web app (nginx → UI + `/api` proxy) |
| http://localhost:8080 | Spring Boot API / OpenAPI |
| localhost:3306 | MySQL (`root` / `123456`, database `mfa`) |

Useful commands:

```bash
docker compose logs -f backend    # follow API logs
docker compose down               # stop containers
docker compose down -v            # stop and wipe MySQL data
```

Default ports can be changed in `.env` (`FRONTEND_PUBLISH_PORT`, `BACKEND_PUBLISH_PORT`, `MYSQL_PUBLISH_PORT`).

---

### Option B — Local development

#### 1. Clone and install frontend deps

```bash
git clone https://github.com/jayaprakash9603/Mutual-Funds-Analyzer.git
cd Mutual-Funds-Analyzer
npm install
```

#### 2. Start a database (pick one)

**MySQL (default profile)** — create a database and align credentials with `backend/src/main/resources/application-mysql.yml`:

| Setting | Default |
|---------|---------|
| Host | `localhost` |
| Port | `5000` *(compose uses `3306`; local default in YAML is `5000`)* |
| Database | `mfa` |
| User | `root` |
| Password | `123456` |

Or override with env vars: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`.

**No MySQL?** Use an in-memory / file profile:

```bash
# API only, H2
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=h2

# API only, no persistence
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=nodb
```

#### 3. Start API + UI together

```bash
npm run dev
```

This runs:

- Vite → http://localhost:5173 (proxies `/api/*` → `http://127.0.0.1:8080`)
- Spring Boot → http://localhost:8080

Open **http://localhost:5173**.

#### 4. Or start them separately

```bash
npm run dev:api      # Spring Boot only
npm run dev:client   # Vite only
```

---

### Option C — Demo mode (no backend)

Use captured fixtures when you only need a UI demo (portfolio, offline laptop, screenshots).

```bash
npm install
npm run dev:demo
```

Open http://localhost:5173 — the navbar shows a **Demo data** badge and sample-fund chips.

```bash
npm run build        # default production build = demo mode (for Cloudflare / static hosts)
npm run build:demo   # same as npm run build
npm run build:live   # API-backed build (used by Docker)
```

Upload the generated `dist/` folder to your static host, or connect the repo to Cloudflare Pages (below). Demo builds include SEO assets (`robots.txt`, `sitemap.xml`, `llms.txt`, web manifest), a compliance banner, footer links, and legal pages (`/disclaimer`, `/privacy`, `/terms`, `/sources`, `/guidelines`). Before go-live, replace `https://analyzer.example.com` in `index.html`, `public/robots.txt`, and `public/sitemap.xml` with your real origin.

#### Cloudflare Pages (demo hosting)

The default `npm run build` produces the **demo** frontend (fixtures under `public/demo/`, no Spring Boot). Docker continues to use `npm run build:live` via the root `Dockerfile`.

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (repo root) |
| Node.js version | `22` (see `.node-version`) |

SPA routing is covered by `public/_redirects`. After you connect the GitHub repo, every push to `main` rebuilds and deploys the demo automatically.

> Demo mode **does not** talk to a live API. To refresh fixtures from a running backend:

```bash
npm run dev:api
npm run demo:capture
```

---

## First-time walkthrough

1. Open the app (Docker → http://localhost, local → http://localhost:5173).
2. Go to **Report** (or open `/fund`).
3. Search for a scheme, e.g. `Parag Parikh Flexi Cap Fund - Direct Plan - Growth`.
4. Explore the left nav:
   - **Snapshot** → Overview, Score  
   - **Performance** → Returns, Rolling, Patterns, Benchmark, Probability  
   - **Risk** → Volatility, Drawdown, Bear Market, Best Days, ATH  
   - **Investment** → Lump Sum, SIP, STP, SWP, Goals  
   - **Assessment** → Peers, Insights  
5. Use **Download** / **Share** in the toolbar for a PDF or link.
6. Press `Ctrl/Cmd + K` for the command palette (search, favorites, recent reports).

First load for a fund can take longer (NAV + analytics). Matrix, peers, and report sections are cached so repeats are much faster.

---

## Project structure

```
Mutual-Funds-Analyzer/
├── Assets/                 # Product screenshots for this README
├── backend/                # Spring Boot 3.4 API (Java 17)
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/...
├── deploy/
│   └── nginx.conf          # Production UI + /api reverse proxy
├── public/demo/            # Demo fixtures (demo builds only)
├── src/                    # React 19 + TypeScript frontend
├── Dockerfile              # Frontend production image
├── docker-compose.yml      # mysql + backend + frontend
├── .env.example
└── package.json
```

---

## Architecture & data sources

```
Browser
  └─ Vite (dev) or nginx (Docker)
       └─ /api/*  →  Spring Boot (:8080)
                        ├─ api.mfapi.in          — daily NAV + scheme catalog
                        └─ analysis.investt.in   — benchmarks + peer rolling returns
                             ↓
                   Domain analytics (rolling returns, Golden Triangle, SIP/tax, matrices)
                             ↓
                   Caffeine cache + optional MySQL/Postgres/H2/Mongo snapshots
```

| Feature | Fund NAV / search | Rolling returns | Benchmark |
|---------|-------------------|-----------------|-----------|
| **Fund report** | mfapi.in | Computed from daily NAV | investt.in |
| **Peers** | investt.in catalog | investt.in | investt.in |
| **Matrices (SIP / CAGR)** | mfapi.in NAV | Derived on server | — |

The investt API blocks browser CORS and needs a multipart GET, so the **backend always owns** those calls. Responses and computed snapshots (report sections, matrices, peers) are cached for repeat requests.

---

## Configuration

### Feature flags

`GET /api/features` returns the enabled flags. The UI and backend share the same keys (see `backend/src/main/resources/application.yml`).

Examples:

| Flag | Default | Effect |
|------|---------|--------|
| `features.ui.fundReportPage` | `true` | Fund Report route |
| `features.ui.dashboardPage` | `false` | Analyze page (dormant) |
| `features.ui.comparePage` | `false` | Compare page (dormant) |
| `features.analysis.peerComparison` | `true` | Peer endpoints |
| `features.analysis.incrementalMatrixSnapshots` | `true` | Persist matrix snapshots |
| `features.platform.cache.enabled` | `true` | Caffeine cache |

### Spring profiles

| Profile | Persistence |
|---------|-------------|
| `mysql` *(default)* | MySQL + Flyway |
| `postgres` | PostgreSQL + Flyway |
| `h2` | Embedded H2 |
| `mongo` | MongoDB |
| `nodb` | No DB adapters |

```bash
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=h2
```

### Docker environment

See [`.env.example`](.env.example):

```env
MYSQL_DATABASE=mfa
MYSQL_USER=root
MYSQL_PASSWORD=123456
FRONTEND_PUBLISH_PORT=80
BACKEND_PUBLISH_PORT=8080
MYSQL_PUBLISH_PORT=3306
```

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Vite together |
| `npm run dev:client` | Vite only |
| `npm run dev:api` | Spring Boot only |
| `npm run dev:demo` | Vite with demo fixtures (no API) |
| `npm run build` | Production **demo** build (Cloudflare / static hosts) |
| `npm run build:demo` | Alias for `npm run build` |
| `npm run build:live` | Production build with live API mode (Docker) |
| `npm run demo:capture` | Refresh `public/demo` fixtures from a live API |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | oxlint |
| `npm run test` | Frontend unit tests (Vitest) |
| `npm run test:api` | Backend tests (Maven / ArchUnit) |
| `docker compose up --build` | Full stack in containers |

---

## Screenshots

All product shots live under [`Assets/report/`](Assets/report/) with descriptive filenames:

```
Assets/report/
├── overview/       (3)   Fund facts, Golden Triangle score & result
├── performance/   (18)   Returns, rolling, patterns, benchmark, probability
├── risk/          (17)   Volatility, drawdowns, bear market, best days, ATH
├── investment/    (15)   Lump sum, SIP, STP, SWP, goals, planners
└── assessment/     (3)   Peers & insights
```

A LinkedIn-ready image-only PDF (if generated locally) is typically saved as `Assets/Analyzer-Product-Tour.pdf` and is gitignored with other `*.pdf` files.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| **Frontend loads but API fails** | Confirm backend is up on `:8080`. In Docker, wait until `mfa-backend` is healthy (`docker compose ps`). |
| **`Port 5173 / 80 / 8080 already in use`** | Stop the other process, or change publish ports in `.env`. |
| **MySQL connection refused (local)** | Start MySQL, check port (`5000` in default YAML vs `3306` in Docker), or use `-Dspring-boot.run.profiles=h2`. |
| **First fund report is slow** | Expected on cold cache — NAV download + analytics. Reload the same fund afterward; sections / matrices / peers reuse DB + memory caches. |
| **Peers stuck on loading** | Needs outbound access to investt.in. Check backend logs; retry after the first successful category load (results are snapshotted). |
| **Demo chips but empty live data** | You are on `npm run dev:demo`. Use `npm run dev` (or Docker) for live APIs. |
| **Windows proxy / IPv6 issues** | Vite proxies to `127.0.0.1:8080` on purpose. Prefer that over `localhost` if Spring binds IPv4 only. |
| **Docker build fails on Maven/npm** | Ensure Docker has enough RAM (4 GB+ recommended) and a working network for dependency downloads. |

API health (Docker / local):

```bash
curl http://localhost:8080/actuator/health
```

OpenAPI UI (when enabled): http://localhost:8080/swagger-ui/index.html

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Command palette — search funds, favorites, recent reports |
