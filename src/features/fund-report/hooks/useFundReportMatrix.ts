import { useCallback, useEffect, useState } from 'react'
import type { MatrixReport } from '../api'
import {
  fetchMatrixCached,
  invalidateMatrixCache,
  peekMatrixCache,
  type MatrixMode,
} from '../lib/matrix/matrixCache'

export function useFundReportMatrix(
  scheme: string | null,
  mode: MatrixMode,
  enabled = true,
  startDate?: string,
) {
  const cached = scheme && enabled ? peekMatrixCache(scheme, mode) : null
  const [data, setData] = useState<MatrixReport | null>(cached)
  const [loading, setLoading] = useState(enabled && !!scheme && !cached)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const syncFromCache = useCallback(() => {
    if (!scheme || !enabled) return null
    return peekMatrixCache(scheme, mode)
  }, [scheme, mode, enabled])

  useEffect(() => {
    if (!scheme) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const warm = syncFromCache()
    setData(warm)
    setError(null)
    setLoading(enabled && !warm)
  }, [scheme, mode, enabled, syncFromCache])

  const retry = useCallback(() => {
    if (scheme) {
      invalidateMatrixCache(scheme)
    }
    setRetryToken((value) => value + 1)
  }, [scheme])

  useEffect(() => {
    if (!scheme || !enabled) {
      setLoading(false)
      return
    }

    const warm = syncFromCache()
    if (warm) {
      setData(warm)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchMatrixCached(scheme, mode, startDate)
      .then((matrix) => {
        if (cancelled) return
        setData(matrix)
      })
      .catch((err) => {
        if (cancelled) return
        const cachedAfterError = syncFromCache()
        if (cachedAfterError) {
          setData(cachedAfterError)
          setError(null)
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load matrix')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [scheme, mode, enabled, startDate, retryToken, syncFromCache])

  return { data, loading, error, retry }
}
