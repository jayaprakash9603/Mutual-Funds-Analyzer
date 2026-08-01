import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/apiError'
import { API_ROUTES } from '@/api/routes'
import { filterCompareResults, filterDemoSchemes } from '@/demo/transport/demoFilters'
import { resetDemoManifestCache, type DemoManifest } from '@/demo/config/demoManifest'
import { fetchDemoJson, hasDemoHandler } from '@/demo/transport/demoTransport'

const ALPHA = 'Alpha Small Cap Fund - Direct Plan - Growth'
const BETA = 'Beta Large Cap Fund - Direct Plan - Growth'

const manifest: DemoManifest = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  periods: ['1 Year', '3 Year', '5 Year'],
  matrixModes: ['LUMPSUM', 'SIP'],
  startDate: '01-01-2013',
  funds: [
    {
      scheme: ALPHA,
      label: 'Alpha Small Cap',
      category: 'Equity Scheme - Small Cap Fund',
      fundName: ALPHA,
      benchmarkName: 'Nifty Smallcap 250',
      files: {
        fundReport: 'fund-report/alpha.json',
        analysis: { '1 Year': 'analysis/alpha-1y.json', '5 Year': 'analysis/alpha-5y.json' },
        fundReportMatrix: { LUMPSUM: 'matrix/alpha-lumpsum.json' },
        fundIndexMatrix: 'fund-index-matrix/alpha.json',
        peers: 'peers/alpha.json',
        drawdownPeers: 'drawdown-peers/alpha.json',
      },
    },
    {
      scheme: BETA,
      label: 'Beta Large Cap',
      category: 'Equity Scheme - Large Cap Fund',
      fundName: BETA,
      benchmarkName: 'Nifty 100',
      files: { fundReport: 'fund-report/beta.json', analysis: {} },
    },
  ],
  shared: {
    schemes: 'schemes.json',
    features: 'features.json',
    compare: 'compare.json',
  },
}

const fixtures: Record<string, unknown> = {
  'manifest.json': manifest,
  'schemes.json': [ALPHA, BETA],
  'features.json': { 'ui.comparePage': true },
  'compare.json': { results: [{ fundName: ALPHA }, { fundName: BETA }] },
  'fund-report/alpha.json': {
    scheme: ALPHA,
    profile: { fundName: ALPHA, dataTo: '2026-01-01' },
    computedAt: '2026-01-01T00:00:00.000Z',
  },
  'analysis/alpha-1y.json': { period: '1 Year' },
  'analysis/alpha-5y.json': { period: '5 Year' },
  'matrix/alpha-lumpsum.json': { mode: 'LUMPSUM' },
  'fund-index-matrix/alpha.json': { scheme: ALPHA },
  'peers/alpha.json': { rows: [] },
  'drawdown-peers/alpha.json': { thresholdRows: [], peerCount: 0 },
}

function fakeResponse(body: unknown, status: number): Response {
  return {
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

function request(path: string, params: Record<string, string> = {}, body?: unknown) {
  return fetchDemoJson<Record<string, unknown>>({
    path,
    params: new URLSearchParams(params),
    body,
  })
}

beforeEach(() => {
  resetDemoManifestCache()
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const key = url.slice(url.lastIndexOf('/demo/') + '/demo/'.length)
      const fixture = fixtures[key]
      return Promise.resolve(
        fixture === undefined ? fakeResponse(null, 404) : fakeResponse(fixture, 200),
      )
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('demoTransport routing', () => {
  it('knows every route the API modules call', () => {
    for (const route of Object.values(API_ROUTES)) {
      expect(hasDemoHandler(route)).toBe(true)
    }
  })

  it('rejects a path it has no fixture for', async () => {
    await expect(request('/api/unknown')).rejects.toBeInstanceOf(ApiError)
  })

  it('serves the captured fund report', async () => {
    await expect(request(API_ROUTES.fundReport, { scheme: ALPHA })).resolves.toEqual(
      fixtures['fund-report/alpha.json'],
    )
  })

  it('serves progressive fund report sections from the monolithic fixture', async () => {
    const overview = await request(API_ROUTES.fundReportOverview, { scheme: ALPHA })
    expect(overview).toMatchObject({
      freshness: 'FRESH',
      schemaVersion: 7,
      data: { scheme: ALPHA, profile: { fundName: ALPHA, dataTo: '2026-01-01' } },
    })
  })

  it('serves peers, drawdown peers, and the fund vs index matrix', async () => {
    await expect(request(API_ROUTES.fundReportPeers, { scheme: ALPHA })).resolves.toEqual({ rows: [] })
    await expect(request(API_ROUTES.fundReportDrawdownPeers, { scheme: ALPHA })).resolves.toEqual({
      thresholdRows: [],
      peerCount: 0,
    })
    await expect(request(API_ROUTES.fundIndexMatrix, { scheme: ALPHA })).resolves.toEqual({
      scheme: ALPHA,
    })
  })

  it('names the available funds when a scheme was never captured', async () => {
    const failure = request(API_ROUTES.fundReport, { scheme: 'Unknown Fund' })
    await expect(failure).rejects.toThrow(/Unknown Fund/)
    await expect(failure).rejects.toThrow(new RegExp(ALPHA))
  })

  it('reports which fixture is missing for a captured fund', async () => {
    await expect(request(API_ROUTES.fundReportPeers, { scheme: BETA })).rejects.toThrow(
      /peer comparison/i,
    )
  })

  it('returns an empty drawdown-peer payload when that fixture was not captured', async () => {
    await expect(request(API_ROUTES.fundReportDrawdownPeers, { scheme: BETA })).resolves.toEqual({
      thresholdRows: [],
      peerCount: 0,
    })
  })

  it('falls back to the nearest captured period', async () => {
    await expect(request(API_ROUTES.analysis, { scheme: ALPHA, period: '1 Year' })).resolves.toEqual({
      period: '1 Year',
    })
    await expect(request(API_ROUTES.analysis, { scheme: ALPHA, period: '7 Year' })).resolves.toEqual({
      period: '5 Year',
    })
    await expect(request(API_ROUTES.analysis, { scheme: ALPHA, period: '2 Year' })).resolves.toEqual({
      period: '1 Year',
    })
  })

  it('falls back to any captured matrix mode', async () => {
    await expect(
      request(API_ROUTES.fundReportMatrix, { scheme: ALPHA, mode: 'STP_6M' }),
    ).resolves.toEqual({ mode: 'LUMPSUM' })
  })

  it('filters the scheme list by query and category', async () => {
    await expect(request(API_ROUTES.schemes, { query: 'alpha', category: 'All' })).resolves.toEqual([
      ALPHA,
    ])
    await expect(
      request(API_ROUTES.schemes, { query: '', category: 'Equity: Large Cap' }),
    ).resolves.toEqual([BETA])
  })

  it('narrows the captured comparison to the requested funds', async () => {
    await expect(request(API_ROUTES.compare, {}, { schemes: [BETA] })).resolves.toEqual({
      results: [{ fundName: BETA }],
    })
  })

  it('returns empty flags when features were not captured', async () => {
    const withoutFeatures = { ...manifest, shared: { ...manifest.shared, features: undefined } }
    fixtures['manifest.json'] = withoutFeatures
    resetDemoManifestCache()

    await expect(request(API_ROUTES.features)).resolves.toEqual({})

    fixtures['manifest.json'] = manifest
  })

  it('surfaces a setup hint when the fixtures are not on disk', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(fakeResponse(null, 404))))
    resetDemoManifestCache()

    await expect(request(API_ROUTES.features)).rejects.toThrow(/demo:capture/)
  })
})

describe('demoFilters', () => {
  const funds = manifest.funds

  it('requires every query token to appear in the name', () => {
    expect(filterDemoSchemes([ALPHA, BETA], 'alpha cap', 'All', funds)).toEqual([ALPHA])
    expect(filterDemoSchemes([ALPHA, BETA], 'alpha bond', 'All', funds)).toEqual([])
  })

  it('matches a category against the captured category of the fund', () => {
    expect(filterDemoSchemes([ALPHA, BETA], '', 'Equity: Small Cap', funds)).toEqual([ALPHA])
    expect(filterDemoSchemes([ALPHA, BETA], '', 'Debt: Liquid', funds)).toEqual([])
  })

  it('keeps every fund when nothing is requested', () => {
    expect(filterCompareResults([{ fundName: ALPHA }], [], funds)).toHaveLength(1)
  })

  it('keeps every fund rather than returning nothing when no name matches', () => {
    expect(filterCompareResults([{ fundName: ALPHA }], ['Missing Fund'], funds)).toHaveLength(1)
  })
})
