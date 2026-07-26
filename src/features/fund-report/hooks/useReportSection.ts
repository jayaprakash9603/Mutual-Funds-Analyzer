import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReportFreshness, ReportSectionEnvelope } from '../schemas'
import {
  FRESHNESS_POLL_BASE_MS,
  FRESHNESS_POLL_MAX_MS,
  isAbortError,
  isProgressiveUnavailableError,
  isStaleResponse,
  MAX_FRESHNESS_POLL_ATTEMPTS,
  nextPollDelayMs,
  shouldPollFreshness,
} from '../lib/nav/reportSectionState'

export type ReportSectionFetch<T> = (
  scheme: string,
  startDate: string | undefined,
  signal: AbortSignal,
) => Promise<ReportSectionEnvelope<T>>

export type UseReportSectionOptions<T> = {
  scheme: string | null
  startDate?: string
  fetchSection: ReportSectionFetch<T>
  enabled?: boolean
}

export type ReportSectionState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refreshing: boolean
  freshness: ReportFreshness | null
  unavailable: boolean
  retry: () => void
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('The operation was aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('The operation was aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function useReportSection<T>({
  scheme,
  startDate,
  fetchSection,
  enabled = true,
}: UseReportSectionOptions<T>): ReportSectionState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [freshness, setFreshness] = useState<ReportFreshness | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  const fetchSectionRef = useRef(fetchSection)
  fetchSectionRef.current = fetchSection

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!scheme || !enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      setRefreshing(false)
      setFreshness(null)
      setUnavailable(false)
      return
    }

    const controller = new AbortController()
    let requestId = 0
    let pollAttempt = 0
    let cancelled = false

    const applyEnvelope = (envelope: ReportSectionEnvelope<T>, activeRequestId: number) => {
      if (cancelled || isStaleResponse(activeRequestId, requestId)) return
      setData(envelope.data)
      setFreshness(envelope.freshness)
      setError(null)
      setRefreshing(envelope.freshness === 'REFRESHING')
    }

    const runFetch = async (activeRequestId: number, hasExistingData: boolean) => {
      if (!hasExistingData) {
        setData(null)
        setLoading(true)
        setError(null)
        setRefreshing(false)
        setUnavailable(false)
      } else {
        setRefreshing(true)
      }

      try {
        const envelope = await fetchSectionRef.current(scheme, startDate, controller.signal)
        applyEnvelope(envelope, activeRequestId)

        while (
          !cancelled
          && !controller.signal.aborted
          && shouldPollFreshness(envelope.freshness)
          && pollAttempt < MAX_FRESHNESS_POLL_ATTEMPTS
        ) {
          const delayMs = nextPollDelayMs(
            pollAttempt,
            FRESHNESS_POLL_BASE_MS,
            FRESHNESS_POLL_MAX_MS,
          )
          pollAttempt += 1
          await sleep(delayMs, controller.signal)

          const refreshed = await fetchSectionRef.current(scheme, startDate, controller.signal)
          if (cancelled || isStaleResponse(activeRequestId, requestId)) return

          envelope.freshness = refreshed.freshness
          envelope.data = refreshed.data
          applyEnvelope(envelope, activeRequestId)

          if (!shouldPollFreshness(refreshed.freshness)) break
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted || isAbortError(err)) return
        if (isStaleResponse(activeRequestId, requestId)) return
        const unavailableError = isProgressiveUnavailableError(err)
        setUnavailable(unavailableError)
        setError(err instanceof Error ? err.message : 'Failed to load report section')
        if (!hasExistingData) setData(null)
      } finally {
        if (!cancelled && !isStaleResponse(activeRequestId, requestId)) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    requestId += 1
    const activeRequestId = requestId
    void runFetch(activeRequestId, false)

    return () => {
      cancelled = true
      requestId += 1
      controller.abort()
    }
  }, [scheme, startDate, enabled, retryToken])

  return { data, loading, error, refreshing, freshness, unavailable, retry }
}
