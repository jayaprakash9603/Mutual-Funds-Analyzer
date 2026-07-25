import { useEffect, useRef, useState } from 'react'
import { searchFunds, searchSchemes } from '@/api/client'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'

export type FundSearchSource = 'investt' | 'mfapi'

export function useFundSearch(
  query: string,
  category: string,
  enabled = true,
  source: FundSearchSource = 'investt',
) {
  const [schemes, setSchemes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef(new Map<string, string[]>())

  useEffect(() => {
    const trimmed = query.trim()

    if (!enabled || trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      setSchemes([])
      setError(null)
      setLoading(false)
      return
    }

    const cacheKey = `${source}:${category}:${trimmed.toLowerCase()}`
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setSchemes(cached)
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const results =
          source === 'mfapi'
            ? await searchFunds(trimmed, controller.signal)
            : await searchSchemes(trimmed, category, controller.signal)
        if (controller.signal.aborted) return
        cacheRef.current.set(cacheKey, results)
        setSchemes(results)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Search failed')
        setSchemes([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, category, enabled, source])

  return { schemes, loading, error }
}
