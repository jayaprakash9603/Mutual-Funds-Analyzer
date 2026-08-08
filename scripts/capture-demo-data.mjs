#!/usr/bin/env node
/**
 * Captures real backend responses into public/demo so the frontend can run a demo
 * without any backend. Run it while the Spring Boot app is up:
 *
 *   npm run demo:capture
 *   scripts\capture-demo-data.bat
 *
 * Every file written here is consumed by src/demo/demoTransport.ts through the
 * generated manifest.json, so nothing about the fixture layout is hardcoded twice.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(SCRIPT_DIR, '..', 'public', 'demo')

const DEFAULT_BASE_URL = 'http://127.0.0.1:8080'
const REQUEST_TIMEOUT_MS = 180_000
const START_DATE = '01-01-2013'
const PERIODS = ['1 Year', '3 Year', '5 Year', '7 Year', '10 Year']
const MATRIX_MODES = ['LUMPSUM', 'MULTIPLE', 'SIP', 'STP_6M']

/** The charts downsample to 400 points anyway, so more rows than this only grow the repo. */
const MAX_ROLLING_ROWS = 400
/** Simulate timelines are denser; keep enough for charts without ballooning fixtures. */
const MAX_SIM_TIMELINE_ROWS = 480
/** Dropped from captured rows: optional in the schema and identical on every row. */
const REDUNDANT_ROW_FIELDS = ['scheme_company', 'scheme_category']

/** UI default presets — demo transport scales from these when the user picks another amount. */
const SIM_DEFAULTS = {
  swp: { initial_corpus: '1000000', monthly_withdrawal: '10000', schedule_day: '1' },
  sip: { amount: '10000', schedule_day: '1' },
  lumpsum: { amount: '100000' },
  stepUpSip: {
    initial_amount: '10000',
    step_up_mode: 'PERCENT',
    step_up_percent: '10',
    schedule_day: '1',
  },
  stp: { lump_sum: '1000000', transfer_months: '6', schedule_day: '1' },
}

/** Not every catalog name resolves upstream, so several spellings get a chance per fund. */
const MAX_CANDIDATES_PER_FUND = 4
/** Stop once the demo has this many funds, so extra terms act purely as fallbacks. */
const TARGET_FUND_COUNT = 5

/**
 * Search terms rather than exact names: each is resolved through /api/schemes so the
 * upstream spelling (plan/option wording varies per AMC) never has to be guessed.
 * Terms are tried in order and the list is deliberately longer than TARGET_FUND_COUNT,
 * because some schemes have no NAV history upstream.
 */
const DEMO_FUNDS = [
  { term: 'Parag Parikh Flexi Cap' },
  { term: 'Axis Small Cap' },
  { term: 'HDFC Mid-Cap Opportunities' },
  { term: 'ICICI Prudential Bluechip' },
  { term: 'HDFC Balanced Advantage' },
  { term: 'Mirae Asset Large Cap' },
  { term: 'Kotak Emerging Equity' },
  { term: 'SBI Small Cap' },
  { term: 'Nippon India Small Cap' },
  { term: 'DSP Small Cap' },
]

const baseUrl = readBaseUrl(process.argv.slice(2))

function readBaseUrl(args) {
  const flag = args.find((arg) => arg.startsWith('--base-url='))
  return (flag ? flag.slice('--base-url='.length) : DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function log(message) {
  process.stdout.write(`${message}\n`)
}

async function requestJson(path, params, init) {
  const url = new URL(`${baseUrl}${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`${path} responded ${response.status}`)
  }
  return response.json()
}

async function tryRequest(label, path, params, init) {
  const startedAt = Date.now()
  try {
    const payload = await requestJson(path, params, init)
    log(`  ok   ${label} (${Date.now() - startedAt}ms)`)
    return payload
  } catch (error) {
    log(`  skip ${label} - ${error.message}`)
    return null
  }
}

async function writeJson(relativePath, payload) {
  const target = join(OUTPUT_DIR, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, JSON.stringify(payload), 'utf8')
  return relativePath.replace(/\\/g, '/')
}

/** Trims plan and option wording so chips read "Axis Small Cap" rather than the full name. */
function displayLabel(scheme) {
  return scheme
    .replace(/\s+-\s+(direct|regular|growth).*$/i, '')
    .replace(/\s+fund$/i, '')
    .trim()
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Evenly spaced sample so the series keeps its shape instead of being cut short. */
function sampleEvenly(rows, maxRows) {
  if (!Array.isArray(rows) || rows.length <= maxRows) {
    return rows
  }
  const step = rows.length / maxRows
  const sampled = []
  for (let i = 0; i < maxRows; i++) {
    sampled.push(rows[Math.floor(i * step)])
  }
  const last = rows[rows.length - 1]
  if (sampled[sampled.length - 1] !== last) {
    sampled.push(last)
  }
  return sampled
}

function trimRows(rows) {
  return sampleEvenly(rows, MAX_ROLLING_ROWS).map((row) => {
    const trimmed = { ...row }
    for (const field of REDUNDANT_ROW_FIELDS) {
      delete trimmed[field]
    }
    return trimmed
  })
}

function trimAnalysis(analysis) {
  if (!analysis?.data) {
    return analysis
  }
  return {
    ...analysis,
    data: {
      fund: trimRows(analysis.data.fund),
      benchmark: trimRows(analysis.data.benchmark),
    },
  }
}

function trimSimulation(payload) {
  if (!payload || typeof payload !== 'object') return payload
  if (!Array.isArray(payload.timeline)) return payload
  return {
    ...payload,
    timeline: sampleEvenly(payload.timeline, MAX_SIM_TIMELINE_ROWS),
  }
}

function trimInvestmentSection(payload) {
  if (!payload?.data) return payload
  const data = { ...payload.data }
  for (const key of ['sip', 'stepUpSip', 'lumpsum', 'swp', 'stp']) {
    const block = data[key]
    if (block && Array.isArray(block.timeline)) {
      data[key] = {
        ...block,
        timeline: sampleEvenly(block.timeline, MAX_SIM_TIMELINE_ROWS),
      }
    }
  }
  return { ...payload, data }
}

/**
 * Payout variants track a different NAV, and unrelated funds can match a search term, so
 * candidates that start with the term and offer a direct growth plan are tried first.
 */
function rankCandidates(candidates, term) {
  const prefix = term.toLowerCase()
  return candidates
    .filter((name) => !/\b(idcw|dividend|payout|bonus)\b/i.test(name))
    .map((name) => {
      const lower = name.toLowerCase()
      let score = 0
      if (lower.startsWith(prefix)) score += 4
      if (/direct/i.test(name)) score += 2
      if (/growth/i.test(name)) score += 1
      return { name, score }
    })
    .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
    .map((entry) => entry.name)
}

async function resolveFund(fund) {
  const candidates = await tryRequest(
    `resolve "${fund.term}"`,
    '/api/schemes',
    { query: fund.term, category: 'All' },
  )
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null
  }
  const ranked = rankCandidates(candidates, fund.term).slice(0, MAX_CANDIDATES_PER_FUND)
  return ranked.length > 0 ? { ...fund, candidates: ranked } : null
}

/** Walks the ranked candidates until one has a usable report upstream. */
async function captureReport(fund) {
  for (const scheme of fund.candidates) {
    const report = await tryRequest(`fund-report ${scheme}`, '/api/fund-report', { scheme })
    if (report) {
      return { scheme, report }
    }
  }
  return null
}

async function captureFund(fund) {
  log(`\n${fund.term}`)
  const files = {}

  const resolved = await captureReport(fund)
  if (!resolved) {
    log('  no candidate had a report upstream, dropping this fund from the demo set')
    return null
  }
  const { scheme, report } = resolved
  const label = displayLabel(scheme)
  const slug = slugify(label)
  files.fundReport = await writeJson(`fund-report/${slug}.json`, report)

  const sections = {}
  for (const [section, path] of [
    ['overview', '/api/fund-report/overview'],
    ['performance', '/api/fund-report/performance'],
    ['risk', '/api/fund-report/risk'],
    ['investment', '/api/fund-report/investment'],
    ['assessment', '/api/fund-report/assessment'],
  ]) {
    const payload = await tryRequest(`report ${section}`, path, { scheme })
    if (payload) {
      const trimmed = section === 'investment' ? trimInvestmentSection(payload) : payload
      sections[section] = await writeJson(`fund-report-sections/${slug}-${section}.json`, trimmed)
    }
  }
  if (Object.keys(sections).length > 0) {
    files.fundReportSections = sections
  }

  const simulations = {}
  const swp = await tryRequest('swp simulate', '/api/fund-report/swp/simulate', {
    scheme,
    ...SIM_DEFAULTS.swp,
  })
  if (swp) {
    simulations.swp = await writeJson(
      `simulations/${slug}-swp.json`,
      trimSimulation(swp),
    )
  }

  const sipSim = await tryRequest('sip simulate', '/api/fund-report/sip/simulate', {
    scheme,
    ...SIM_DEFAULTS.sip,
  })
  if (sipSim) {
    simulations.sip = await writeJson(
      `simulations/${slug}-sip.json`,
      trimSimulation(sipSim),
    )
  }

  const lumpsumSim = await tryRequest('lumpsum simulate', '/api/fund-report/lumpsum/simulate', {
    scheme,
    ...SIM_DEFAULTS.lumpsum,
  })
  if (lumpsumSim) {
    simulations.lumpsum = await writeJson(
      `simulations/${slug}-lumpsum.json`,
      trimSimulation(lumpsumSim),
    )
  }

  const stepUpSim = await tryRequest(
    'step-up sip simulate',
    '/api/fund-report/step-up-sip/simulate',
    { scheme, ...SIM_DEFAULTS.stepUpSip },
  )
  if (stepUpSim) {
    simulations.stepUpSip = await writeJson(
      `simulations/${slug}-step-up-sip.json`,
      trimSimulation(stepUpSim),
    )
  }

  // STP needs a distinct liquid source; try common names until one works.
  for (const sourceTerm of [
    'HDFC Liquid Fund - Direct Plan - Growth',
    'ICICI Prudential Liquid Fund - Direct Plan - Growth',
    'Axis Liquid Fund - Direct Plan - Growth',
  ]) {
    const stp = await tryRequest('stp simulate', '/api/fund-report/stp/simulate', {
      scheme,
      source_scheme: sourceTerm,
      ...SIM_DEFAULTS.stp,
    })
    if (stp) {
      simulations.stp = await writeJson(
        `simulations/${slug}-stp.json`,
        trimSimulation({ ...stp, sourceScheme: sourceTerm }),
      )
      break
    }
  }

  if (Object.keys(simulations).length > 0) {
    files.simulations = simulations
  }

  const analysis = {}
  for (const period of PERIODS) {
    const payload = await tryRequest(
      `analysis ${period}`,
      '/api/analysis',
      { scheme, period, start_date: START_DATE },
    )
    if (payload) {
      analysis[period] = await writeJson(
        `analysis/${slug}-${slugify(period)}.json`,
        trimAnalysis(payload),
      )
    }
  }
  files.analysis = analysis

  const matrix = {}
  for (const mode of MATRIX_MODES) {
    const payload = await tryRequest(
      `report matrix ${mode}`,
      '/api/fund-report/matrix',
      { scheme, mode },
    )
    if (payload) {
      matrix[mode] = await writeJson(`fund-report-matrix/${slug}-${slugify(mode)}.json`, payload)
    }
  }
  files.fundReportMatrix = matrix

  const indexMatrix = await tryRequest(
    'fund-index-matrix',
    '/api/analysis/fund-index-matrix',
    { scheme, start_date: START_DATE },
  )
  if (indexMatrix) {
    files.fundIndexMatrix = await writeJson(`fund-index-matrix/${slug}.json`, indexMatrix)
  }

  const category = report?.profile?.category ?? 'All'
  const peers = await tryRequest(
    'peers',
    '/api/fund-report/peers',
    { scheme, category },
  )
  if (peers) {
    files.peers = await writeJson(`peers/${slug}.json`, peers)
  }

  const drawdownPeers = await tryRequest(
    'drawdown-peers',
    '/api/fund-report/drawdown-peers',
    { scheme, category },
  )
  if (drawdownPeers) {
    files.drawdownPeers = await writeJson(`drawdown-peers/${slug}.json`, drawdownPeers)
  }

  return {
    scheme,
    label,
    category,
    fundName: report?.profile?.fundName ?? scheme,
    benchmarkName: report?.profile?.benchmarkName ?? '',
    files,
  }
}

async function captureShared(schemes) {
  log('\nShared fixtures')
  const shared = {}

  shared.schemes = await writeJson('schemes.json', schemes)

  const features = await tryRequest('features', '/api/features')
  if (features) {
    shared.features = await writeJson('features.json', features)
  }

  const compare = await tryRequest('compare', '/api/analysis/compare', undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schemes, period: '5 Year' }),
  })
  if (compare) {
    shared.compare = await writeJson('compare.json', compare)
  }

  return shared
}

async function main() {
  log(`Capturing demo fixtures from ${baseUrl}`)
  log(`Writing to ${OUTPUT_DIR}\n`)

  const resolved = []
  for (const fund of DEMO_FUNDS) {
    const match = await resolveFund(fund)
    if (match) {
      resolved.push(match)
    }
  }
  if (resolved.length === 0) {
    throw new Error('No demo funds could be resolved. Is the backend running?')
  }

  const funds = []
  for (const fund of resolved) {
    if (funds.length >= TARGET_FUND_COUNT) {
      break
    }
    const captured = await captureFund(fund)
    if (captured) {
      funds.push(captured)
    }
  }
  if (funds.length === 0) {
    throw new Error('No fund reports could be captured, so the demo would have no data.')
  }

  const shared = await captureShared(funds.map((fund) => fund.scheme))

  const manifest = {
    generatedAt: new Date().toISOString(),
    periods: PERIODS,
    matrixModes: MATRIX_MODES,
    startDate: START_DATE,
    funds,
    shared,
  }
  await writeJson('manifest.json', manifest)

  log(`\nDone. Captured ${funds.length} fund(s):`)
  for (const fund of funds) {
    log(`  - ${fund.scheme}`)
  }
  log('\nRun the demo with: npm run dev:demo')
}

main().catch((error) => {
  process.stderr.write(`\nCapture failed: ${error.message}\n`)
  process.exitCode = 1
})
