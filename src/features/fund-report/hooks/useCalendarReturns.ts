import { useCallback, useEffect, useState } from 'react'
import { fetchCalendarReturns, type CalendarReturns } from '../api'

export function useCalendarReturns(
  scheme: string | null,
  startDate?: string,
  enabled = true,
) {
  const [data, setData] = useState<CalendarReturns | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!scheme || !enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchCalendarReturns(scheme, { startDate, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load calendar returns')
        setData(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [scheme, startDate, enabled, retryToken])

  return { data, loading, error, retry }
}
