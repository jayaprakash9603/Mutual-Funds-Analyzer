import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRollingReturns } from '@/api/client'
import { evaluateGoldenTriangle, generateInsights, applyMetricOverrides } from '@/lib/analytics'
import type { GoldenTriangleResult } from '@/lib/analytics/types'
import type { ManualInputsForm } from '@/api/schemas'
import type { Period } from '@/lib/constants'
import { DEFAULT_PERIOD, DEFAULT_START_DATE } from '@/lib/constants'
import type { RollingReturnsResponse } from '@/api/schemas'

export function useFundAnalysis(
  scheme: string | null,
  period: Period = DEFAULT_PERIOD,
  startDate = DEFAULT_START_DATE,
  manual?: ManualInputsForm,
) {
  const [data, setData] = useState<RollingReturnsResponse | null>(null)
  const [baseResult, setBaseResult] = useState<GoldenTriangleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!scheme) return

    setLoading(true)
    setError(null)
    setData(null)
    setBaseResult(null)

    try {
      const response = await fetchRollingReturns(scheme, period, startDate, signal)
      setData(response)

      const analysis = evaluateGoldenTriangle({
        fund: response.fund,
        benchmark: response.benchmark,
        period,
      })
      setBaseResult(analysis)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setData(null)
      setBaseResult(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [scheme, period, startDate])

  useEffect(() => {
    if (!scheme) {
      setData(null)
      setBaseResult(null)
      return
    }

    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [scheme, period, startDate, fetchData])

  const result = useMemo(
    () => (baseResult ? applyMetricOverrides(baseResult, manual) : null),
    [baseResult, manual],
  )

  const insights = useMemo(
    () => (result ? generateInsights(result) : []),
    [result],
  )

  return { data, result, insights, loading, error, refetch: fetchData }
}
