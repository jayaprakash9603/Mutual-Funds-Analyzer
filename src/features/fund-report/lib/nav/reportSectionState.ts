import { ApiError } from '@/api/apiError'
import type { ReportFreshness } from '../../schemas'

export type ReportSectionStatus = 'idle' | 'loading' | 'success' | 'error' | 'refreshing'

export const MAX_FRESHNESS_POLL_ATTEMPTS = 5
export const FRESHNESS_POLL_BASE_MS = 2_000
export const FRESHNESS_POLL_MAX_MS = 16_000

export function deriveSectionStatus(
  hasData: boolean,
  loading: boolean,
  error: string | null,
  freshness: ReportFreshness | null,
): ReportSectionStatus {
  if (error && !hasData) return 'error'
  if (loading && !hasData) return 'loading'
  if (freshness === 'REFRESHING' && hasData) return 'refreshing'
  if (hasData) return 'success'
  if (loading) return 'loading'
  return 'idle'
}

export function shouldPollFreshness(freshness: ReportFreshness | null): boolean {
  switch (freshness) {
    case 'STALE':
    case 'REFRESHING':
      return true
    case 'FRESH':
    case null:
      return false
    default: {
      const _exhaustive: never = freshness
      return _exhaustive
    }
  }
}

export function nextPollDelayMs(
  attempt: number,
  baseMs = FRESHNESS_POLL_BASE_MS,
  maxMs = FRESHNESS_POLL_MAX_MS,
): number {
  return Math.min(baseMs * 2 ** attempt, maxMs)
}

export function isProgressiveUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501)
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function isStaleResponse(requestId: number, activeRequestId: number): boolean {
  return requestId !== activeRequestId
}
