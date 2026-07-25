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
import { ApiError } from './apiError'
import { requestJson } from './request'
import { API_ROUTES } from './routes'
import type { Period } from '@/lib/constants'
import { DEFAULT_PERIOD, DEFAULT_START_DATE } from '@/lib/constants'

export async function searchSchemes(
  query: string,
  category = 'All',
  signal?: AbortSignal,
): Promise<string[]> {
  const data = await requestJson<unknown>(API_ROUTES.schemes, {
    params: { query, category },
    signal,
  })
  return schemesResponseSchema.parse(data)
}

export async function fetchAnalysis(
  scheme: string,
  period: Period = DEFAULT_PERIOD,
  startDate = DEFAULT_START_DATE,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const data = await requestJson<unknown>(API_ROUTES.analysis, {
    params: { scheme, period, start_date: startDate },
    signal,
  })
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
  const data = await requestJson<unknown>(API_ROUTES.compare, {
    body: { schemes, period },
    signal,
  })
  return compareResponseSchema.parse(data).results
}

export async function fetchFundIndexMatrix(
  scheme: string,
  startDate = DEFAULT_START_DATE,
  signal?: AbortSignal,
): Promise<FundIndexComparison> {
  const data = await requestJson<unknown>(API_ROUTES.fundIndexMatrix, {
    params: { scheme, start_date: startDate },
    signal,
  })
  return fundIndexComparisonSchema.parse(data)
}

export async function fetchFeatureFlags(signal?: AbortSignal): Promise<Record<string, boolean>> {
  const data = await requestJson<unknown>(API_ROUTES.features, { signal })
  return featureFlagsSchema.parse(data)
}

export { ApiError, API_ROUTES }
