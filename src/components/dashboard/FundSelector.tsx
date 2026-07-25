import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FundSearchDropdown } from '@/components/dashboard/FundSearchDropdown'
import { useFundSearch } from '@/hooks/useFundSearch'
import { CATEGORIES, PERIODS, SEARCH_MIN_QUERY_LENGTH, type Period } from '@/lib/constants'
import { useAppContext } from '@/context/AppContext'
import { cn } from '@/lib/utils'

interface FundSelectorProps {
  selectedScheme: string | null
  onSelectScheme: (scheme: string) => void
  /** Analyze page: full controls. Report page: fund search only. */
  mode?: 'full' | 'fund-only'
  period?: Period
  onPeriodChange?: (period: Period) => void
  category?: string
  onCategoryChange?: (category: string) => void
  benchmarkName?: string
}

export function FundSelector({
  selectedScheme,
  onSelectScheme,
  mode = 'full',
  period,
  onPeriodChange,
  category = 'All',
  onCategoryChange,
  benchmarkName,
}: FundSelectorProps) {
  const fundOnly = mode === 'fund-only'
  const [query, setQuery] = useState(selectedScheme ?? '')
  const [showResults, setShowResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const searchEnabled = showResults && query !== selectedScheme
  const { schemes, loading } = useFundSearch(
    query,
    fundOnly ? 'All' : category,
    searchEnabled,
    fundOnly ? 'mfapi' : 'investt',
  )
  const { toggleFavorite, isFavorite } = useAppContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputWrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(selectedScheme ?? '')
  }, [selectedScheme])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, schemes])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setShowResults(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectScheme = (scheme: string) => {
    onSelectScheme(scheme)
    setQuery(scheme)
    setShowResults(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showResults) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (schemes.length === 0) return
      setActiveIndex((i) => (i + 1) % schemes.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (schemes.length === 0) return
      setActiveIndex((i) => (i - 1 + schemes.length) % schemes.length)
      return
    }
    if (e.key === 'Enter' && schemes[activeIndex]) {
      e.preventDefault()
      selectScheme(schemes[activeIndex])
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setShowResults(false)
    }
  }

  const dropdownOpen =
    showResults && query.trim().length >= SEARCH_MIN_QUERY_LENGTH && query !== selectedScheme

  return (
    <Card className={cn('glass', dropdownOpen && 'relative z-[60]')}>
      <CardHeader>
        <CardTitle>{fundOnly ? 'Select Fund' : 'Fund Selection'}</CardTitle>
      </CardHeader>
      <CardContent className={fundOnly ? 'space-y-2' : 'grid gap-4 md:grid-cols-2'}>
        <div className={fundOnly ? 'space-y-2' : 'space-y-2 md:col-span-2'} ref={containerRef}>
          <Label htmlFor="fund-search">Mutual Fund</Label>
          <div className="relative" ref={inputWrapRef}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fund-search"
              placeholder="Search funds e.g. Parag Parikh, HDFC, Axis..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={onKeyDown}
              className="pl-10"
              autoComplete="off"
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls="fund-search-results"
              aria-autocomplete="list"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            <FundSearchDropdown
              open={dropdownOpen}
              anchorRef={inputWrapRef}
              query={query}
              schemes={schemes}
              loading={loading}
              selectedScheme={selectedScheme}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onSelect={selectScheme}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              listRef={listRef}
            />
          </div>
          {fundOnly && (
            <p className="text-xs text-muted-foreground">
              Category, benchmark, and rolling periods are shown in the report below after you select a fund.
            </p>
          )}
        </div>

        {!fundOnly && (
          <>
            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rolling Return Period</Label>
              <Select
                value={period}
                onValueChange={(v) => onPeriodChange?.(v as Period)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Benchmark (auto-resolved)</Label>
              <Input
                readOnly
                value={benchmarkName ?? 'Select a fund to resolve benchmark'}
                className="bg-muted/40"
                aria-readonly="true"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
