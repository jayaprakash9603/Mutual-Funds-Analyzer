import {
  analysisResponseSchema,
  compareResponseSchema,
  featureFlagsSchema,
  fundIndexComparisonSchema,
  normalizeRollingRows,
  schemesResponseSchema,
  type AnalysisResponse,
  type FundIndexComparison,
  type GoldenTriangleResult,
} from './schemas'
import type { Period } from '@/lib/constants'
import { DEFAULT_PERIOD, DEFAULT_START_DATE } from '@/lib/constants'

const API_ROUTES = {
  schemes: '/api/schemes',
  analysis: '/api/analysis',
  compare: '/api/analysis/compare',
  fundIndexMatrix: '/api/analysis/fund-index-matrix',
  features: '/api/features',
} as const

class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(url: string, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.error ?? `Request failed: ${response.status}`, response.status)
  }
  return response.json() as Promise<T>
}

export async function searchSchemes(
  query: string,
  category = 'All',
  signal?: AbortSignal,
): Promise<string[]> {
  const params = new URLSearchParams({ query, category })
  const data = await fetchJson<unknown>(`${API_ROUTES.schemes}?${params}`, signal)
  return schemesResponseSchema.parse(data)
}

export async function fetchAnalysis(
  scheme: string,
  period: Period = DEFAULT_PERIOD,
  startDate = DEFAULT_START_DATE,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const params = new URLSearchParams({
    scheme,
    period,
    start_date: startDate,
  })
  const data = await fetchJson<unknown>(`${API_ROUTES.analysis}?${params}`, signal)
  const parsed = analysisResponseSchema.parse(data)
  return {
    ...parsed,
    data: {
      fund: normalizeRollingRows(parsed.data.fund, period),
      benchmark: normalizeRollingRows(parsed.data.benchmark, period),
    },
  }
}

export async function fetchComparison(
  schemes: string[],
  period: Period = DEFAULT_PERIOD,
  signal?: AbortSignal,
): Promise<GoldenTriangleResult[]> {
  const data = await fetchJson<unknown>(
    API_ROUTES.compare,
    signal,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemes, period }),
    },
  )
  return compareResponseSchema.parse(data).results
}

export async function fetchFundIndexMatrix(
  scheme: string,
  startDate = DEFAULT_START_DATE,
  signal?: AbortSignal,
): Promise<FundIndexComparison> {
  const params = new URLSearchParams({
    scheme,
    start_date: startDate,
  })
  const data = await fetchJson<unknown>(`${API_ROUTES.fundIndexMatrix}?${params}`, signal)
  return fundIndexComparisonSchema.parse(data)
}

export async function fetchFeatureFlags(signal?: AbortSignal): Promise<Record<string, boolean>> {
  const data = await fetchJson<unknown>(API_ROUTES.features, signal)
  return featureFlagsSchema.parse(data)
}

export { ApiError, API_ROUTES }
