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
) {
  const cached = scheme && enabled ? peekMatrixCache(scheme, mode) : null
  const [data, setData] = useState<MatrixReport | null>(cached)
  const [loading, setLoading] = useState(enabled && !!scheme && !cached)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!scheme) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const warm = peekMatrixCache(scheme, mode)
    setData(warm)
    setError(null)
    setLoading(enabled && !warm)
  }, [scheme, mode, enabled])

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

    const warm = peekMatrixCache(scheme, mode)
    if (warm) {
      setData(warm)
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchMatrixCached(scheme, mode, controller.signal)
      .then((matrix) => {
        if (!controller.signal.aborted) {
          setData(matrix)
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load matrix')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [scheme, mode, enabled, retryToken])

  return { data, loading, error, retry }
}
