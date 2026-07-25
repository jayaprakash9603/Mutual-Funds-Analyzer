import {
  normalizeRollingRows,
  schemesResponseSchema,
  type RollingReturnsResponse,
} from './schemas'
import type { Period } from '@/lib/constants'
import { DEFAULT_PERIOD, DEFAULT_START_DATE } from '@/lib/constants'

class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
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
  const data = await fetchJson<unknown>(`/api/schemes?${params}`, signal)
  return schemesResponseSchema.parse(data)
}

export async function fetchRollingReturns(
  scheme: string,
  period: Period = DEFAULT_PERIOD,
  startDate = DEFAULT_START_DATE,
  signal?: AbortSignal,
): Promise<RollingReturnsResponse> {
  const params = new URLSearchParams({
    scheme,
    period,
    start_date: startDate,
  })
  const data = await fetchJson<{ fund: unknown[]; benchmark: unknown[] }>(
    `/api/rolling-returns?${params}`,
    signal,
  )
  return {
    fund: normalizeRollingRows(data.fund, period),
    benchmark: normalizeRollingRows(data.benchmark, period),
  }
}

export { ApiError }
