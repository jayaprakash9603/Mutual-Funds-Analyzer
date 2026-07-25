import { useEffect, useRef, useState } from 'react'
import { searchSchemes } from '@/api/client'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 400

export function useFundSearch(query: string, category: string, enabled = true) {
  const [schemes, setSchemes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef(new Map<string, string[]>())

  useEffect(() => {
    const trimmed = query.trim()

    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setSchemes([])
      setError(null)
      setLoading(false)
      return
    }

    const cacheKey = `${category}:${trimmed.toLowerCase()}`
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
        const results = await searchSchemes(trimmed, category, controller.signal)
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
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, category, enabled])

  return { schemes, loading, error }
}
