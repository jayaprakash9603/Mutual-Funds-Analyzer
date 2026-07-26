import { useCallback, useEffect, useState } from 'react'
import { fetchFundReportMatrix, type MatrixReport } from '../api'

export function useFundReportMatrix(
  scheme: string | null,
  mode: 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M',
  enabled: boolean,
) {
  const [data, setData] = useState<MatrixReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
  }, [scheme, mode])

  const load = useCallback(async (signal: AbortSignal) => {
    if (!scheme || !enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const matrix = await fetchFundReportMatrix(scheme, mode)
      if (!signal.aborted) setData(matrix)
    } catch (e) {
      if (!signal.aborted) {
        setError(e instanceof Error ? e.message : 'Failed to load matrix')
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [scheme, mode, enabled])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { data, loading, error }
}
