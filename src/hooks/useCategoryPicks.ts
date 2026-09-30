import { useEffect, useState } from 'react'

export type CategoryRule = { id: 'rollingReturn' | 'cob' | 'sharpe'; passed: boolean; fundValue: number; benchmarkValue: number }

export type CategoryFund = {
  id: string
  amc: string
  tag: string
  fundName: string
  rollingAvg: number
  rollingMin: number
  rollingMax: number
  stdDev: number
  cob: number
  sharpe: number
  maxDrawdown: number
  horizons: { y1: number | null; y3: number | null; y5: number | null; y10: number | null }
  rules: CategoryRule[]
  failsAt: 1 | 2 | 3 | null
}

export type FundCategory = {
  id: string
  label: string
  benchmark: string
  period: string
  benchRollingAvg: number
  benchRollingMin: number
  benchRollingMax: number
  benchSharpe: number
  benchMaxDrawdown: number
  funds: CategoryFund[]
}

export const HORIZONS = [
  { key: 'y1', label: '1Y' },
  { key: 'y3', label: '3Y' },
  { key: 'y5', label: '5Y' },
  { key: 'y10', label: '10Y' },
] as const

export function shortFundName(name: string) {
  return name
    .replace(/\s*[-(]\s*(Direct|Regular|Growth).*$/i, '')
    .replace(/\s+Fund$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Winners of a category, best 5-year rolling average first. */
export function categoryWinners(category: FundCategory) {
  return category.funds.filter((f) => f.failsAt === null).sort((a, b) => b.rollingAvg - a.rollingAvg)
}

let cache: Promise<FundCategory[]> | null = null

function loadCategories() {
  cache ??= fetch(`${import.meta.env.BASE_URL}landing/category-picks.json`)
    .then((response) => (response.ok ? response.json() : { categories: [] }))
    .then((data: { categories?: FundCategory[] }) => data.categories ?? [])
    .catch(() => [])
  return cache
}

export function useCategoryPicks() {
  const [categories, setCategories] = useState<FundCategory[]>([])

  useEffect(() => {
    let active = true
    loadCategories().then((next) => {
      if (active) setCategories(next)
    })
    return () => {
      active = false
    }
  }, [])

  return categories
}
