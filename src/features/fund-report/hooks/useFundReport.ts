import { useCallback, useEffect, useState } from 'react'
import { fetchFundReport, type FundReport } from '../api'

export function useFundReport(scheme: string | null, startDate?: string) {
  const [data, setData] = useState<FundReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal: AbortSignal) => {
    if (!scheme) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    // Drop previous fund immediately so UI never mixes old report with new selection.
    setData(null)
    setLoading(true)
    setError(null)
    try {
      const report = await fetchFundReport(scheme, startDate)
      if (!signal.aborted) setData(report)
    } catch (e) {
      if (!signal.aborted) {
        setData(null)
        setError(e instanceof Error ? e.message : 'Failed to load report')
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [scheme, startDate])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { data, loading, error, refetch: () => load(new AbortController().signal) }
}
