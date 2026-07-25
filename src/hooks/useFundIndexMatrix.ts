import { useCallback, useEffect, useState } from 'react'
import { fetchFundIndexMatrix } from '@/api/client'
import type { FundIndexComparison } from '@/api/schemas'
import { DEFAULT_START_DATE } from '@/lib/constants'

export function useFundIndexMatrix(scheme: string | null, startDate = DEFAULT_START_DATE) {
  const [data, setData] = useState<FundIndexComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!scheme) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetchFundIndexMatrix(scheme, startDate, signal)
      setData(response)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Fund index matrix failed')
      setData(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [scheme, startDate])

  useEffect(() => {
    if (!scheme) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [scheme, startDate, fetchData])

  return { data, loading, error, refetch: fetchData }
}
