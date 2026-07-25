import { useCallback, useEffect, useState } from 'react'
import { fetchAnalysis } from '@/api/client'
import type { GoldenTriangleResult, TimelineEvent } from '@/api/schemas'
import type { RollingReturnsResponse } from '@/api/schemas'
import type { Period } from '@/lib/constants'
import { DEFAULT_PERIOD, DEFAULT_START_DATE } from '@/lib/constants'

export function useFundAnalysis(
  scheme: string | null,
  period: Period = DEFAULT_PERIOD,
  startDate = DEFAULT_START_DATE,
) {
  const [data, setData] = useState<RollingReturnsResponse | null>(null)
  const [result, setResult] = useState<GoldenTriangleResult | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!scheme) return

    setLoading(true)
    setError(null)
    setData(null)
    setResult(null)
    setInsights([])
    setTimeline([])

    try {
      const response = await fetchAnalysis(scheme, period, startDate, signal)
      setData(response.data)
      setResult(response.result)
      setInsights(response.insights)
      setTimeline(response.timeline)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setData(null)
      setResult(null)
      setInsights([])
      setTimeline([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [scheme, period, startDate])

  useEffect(() => {
    if (!scheme) {
      setData(null)
      setResult(null)
      setInsights([])
      setTimeline([])
      return
    }

    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [scheme, period, startDate, fetchData])

  return { data, result, insights, timeline, loading, error, refetch: fetchData }
}
