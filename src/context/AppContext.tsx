import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { GoldenTriangleResult } from '@/lib/analytics/types'

interface RecentAnalysis {
  scheme: string
  timestamp: number
  passed: boolean
  passCount: number
}

interface AppContextValue {
  favorites: string[]
  recentAnalyses: RecentAnalysis[]
  toggleFavorite: (scheme: string) => void
  addRecentAnalysis: (result: GoldenTriangleResult) => void
  isFavorite: (scheme: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

const FAVORITES_KEY = 'gt-favorites'
const RECENT_KEY = 'gt-recent'

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as RecentAnalysis[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentAnalyses))
  }, [recentAnalyses])

  const toggleFavorite = useCallback((scheme: string) => {
    setFavorites((prev) =>
      prev.includes(scheme) ? prev.filter((s) => s !== scheme) : [...prev, scheme],
    )
  }, [])

  /**
   * Returns the previous state untouched when the analysis is already the most
   * recent entry, so callers can fire this from an effect without looping.
   */
  const addRecentAnalysis = useCallback((result: GoldenTriangleResult) => {
    setRecentAnalyses((prev) => {
      const [latest] = prev
      if (latest?.scheme === result.fundName && latest.passCount === result.passCount) {
        return prev
      }
      return [
        {
          scheme: result.fundName,
          timestamp: Date.now(),
          passed: result.passed,
          passCount: result.passCount,
        },
        ...prev.filter((r) => r.scheme !== result.fundName),
      ].slice(0, 10)
    })
  }, [])

  const isFavorite = useCallback((scheme: string) => favorites.includes(scheme), [favorites])

  const value = useMemo<AppContextValue>(
    () => ({ favorites, recentAnalyses, toggleFavorite, addRecentAnalysis, isFavorite }),
    [favorites, recentAnalyses, toggleFavorite, addRecentAnalysis, isFavorite],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
