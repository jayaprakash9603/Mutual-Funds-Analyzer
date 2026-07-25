# Golden Triangle Mutual Fund Analyzer

Premium React + TypeScript web application that scores mutual funds using the **Golden Triangle** strategy:

1. **Rolling Return** — Fund average > Benchmark average
2. **COB** — Chance of Beating Benchmark > 70%
3. **Sharpe Ratio** — Fund Sharpe > Benchmark Sharpe

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui-style components
- Recharts (via shadcn chart wrapper)
- TanStack Table, React Hook Form, Zod
- Framer Motion, Lucide Icons
- Express proxy server (CORS bypass + caching)

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev
```

This starts:
- **Vite** at `http://localhost:5173`
- **Express proxy** at `http://localhost:8787`

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start proxy + Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run analytics engine unit tests |

## Architecture

```
Browser → Vite (/api/*) → Express Proxy → analysis.investt.in
                ↓
         Analytics Engine (NAV reconstruction, Golden Triangle rules)
                ↓
         Dashboard + 18 Charts
```

The upstream API blocks browser CORS; the Express proxy forwards requests as multipart GET and caches responses for 15 minutes.

## Pages

- **/** — Landing page with animated hero
- **/dashboard** — Full fund analysis with stat cards, Golden Triangle result, 18 charts
- **/compare** — Compare up to 5 funds with table + radar chart
- **/method** — Golden Triangle method explainer

## Keyboard Shortcuts

- `Ctrl/Cmd + K` — Command palette (search, favorites, recent analyses)

## Manual Inputs

Expense Ratio, AUM, and Fund Rating are not provided by the API and appear as optional manual inputs with "Not provided by API" states.
