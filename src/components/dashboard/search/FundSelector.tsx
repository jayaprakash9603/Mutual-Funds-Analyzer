import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Search, Loader2, X } from 'lucide-react'
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
import { FundSearchDropdown } from '@/components/dashboard/search/FundSearchDropdown'
import { useFundSearch } from '@/hooks/useFundSearch'
import { CATEGORIES, PERIODS, SEARCH_MIN_QUERY_LENGTH, type Period } from '@/lib/constants'
import { useAppContext } from '@/context/AppContext'
import { cn } from '@/lib/utils'

interface FundSelectorProps {
  selectedScheme: string | null
  onSelectScheme: (scheme: string) => void
  /** Analyze page: full controls. Report page: fund search only. */
  mode?: 'full' | 'fund-only'
  /** Report page: single-line sticky bar without card chrome. */
  variant?: 'default' | 'compact'
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
  variant = 'default',
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

  const clearScheme = () => {
    setQuery('')
    setShowResults(false)
    onSelectScheme('')
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

  const searchField = (
    <div className={cn('relative w-full min-w-0')} ref={inputWrapRef}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground',
          variant === 'compact' || fundOnly ? 'left-3.5' : 'left-3',
        )}
        aria-hidden="true"
      />
      <Input
        id="fund-search"
        placeholder={
          variant === 'compact'
            ? 'Search funds e.g. Parag Parikh, HDFC, Axis…'
            : 'Search funds e.g. Parag Parikh, HDFC, Axis...'
        }
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowResults(true)
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={onKeyDown}
        className={cn(
          'pl-10',
          (variant === 'compact' || fundOnly) && [
            'h-11 w-full min-w-0 truncate rounded-full border-border/60 bg-muted/30 pr-10 text-sm shadow-inner',
            'transition-[border-color,background-color,box-shadow] duration-200',
            'placeholder:text-muted-foreground/75',
            'hover:border-primary/30 hover:bg-muted/45',
            'focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20',
            selectedScheme && 'font-medium',
          ],
        )}
        autoComplete="off"
        role="combobox"
        aria-label={variant === 'compact' ? 'Search mutual fund' : undefined}
        aria-expanded={dropdownOpen}
        aria-controls="fund-search-results"
        aria-autocomplete="list"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : variant === 'compact' && selectedScheme ? (
        <button
          type="button"
          className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear selected fund"
          onClick={clearScheme}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
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
  )

  if (variant === 'compact') {
    return (
      <div
        className={cn('relative w-full min-w-0', dropdownOpen && 'z-[60]')}
        ref={containerRef}
      >
        {searchField}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        fundOnly
          ? 'border-border/70 bg-background shadow-none'
          : 'glass',
        dropdownOpen && 'relative z-[60]',
      )}
    >
      <CardHeader className={fundOnly ? 'pb-3' : undefined}>
        <CardTitle>{fundOnly ? 'Select Fund' : 'Fund Selection'}</CardTitle>
      </CardHeader>
      <CardContent className={fundOnly ? 'space-y-2' : 'grid gap-4 md:grid-cols-2'}>
        <div className={fundOnly ? 'space-y-2' : 'space-y-2 md:col-span-2'} ref={containerRef}>
          <Label htmlFor="fund-search" className={fundOnly ? 'text-sm text-muted-foreground' : undefined}>
            Mutual Fund
          </Label>
          {searchField}
          {fundOnly && (
            <p className="text-xs leading-relaxed text-muted-foreground">
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
