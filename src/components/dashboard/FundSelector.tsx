import { useEffect, useRef, useState } from 'react'
import { Search, Star, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFundSearch } from '@/hooks/useFundSearch'
import { CATEGORIES, PERIODS, type Period } from '@/lib/constants'
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
  const searchEnabled = showResults && query !== selectedScheme
  const { schemes, loading } = useFundSearch(query, fundOnly ? 'All' : category, searchEnabled)
  const { toggleFavorite, isFavorite } = useAppContext()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(selectedScheme ?? '')
  }, [selectedScheme])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{fundOnly ? 'Select Fund' : 'Fund Selection'}</CardTitle>
      </CardHeader>
      <CardContent className={fundOnly ? 'space-y-2' : 'grid gap-4 md:grid-cols-2'}>
        <div className={fundOnly ? 'space-y-2' : 'space-y-2 md:col-span-2'} ref={containerRef}>
          <Label htmlFor="fund-search">Mutual Fund</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fund-search"
              placeholder="Search funds e.g. Parag Parikh, HDFC, Axis..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="pl-10"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {showResults && schemes.length > 0 && (
              <ul
                className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg"
                role="listbox"
              >
                {schemes.map((scheme) => (
                  <li
                    key={scheme}
                    className="flex items-center justify-between gap-1 rounded-lg pr-1 hover:bg-accent"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedScheme === scheme}
                      className="flex-1 rounded-lg px-3 py-2 text-left text-sm"
                      onClick={() => {
                        onSelectScheme(scheme)
                        setQuery(scheme)
                        setShowResults(false)
                      }}
                    >
                      <span className="line-clamp-2 pr-2">{scheme}</span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={isFavorite(scheme) ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={() => toggleFavorite(scheme)}
                    >
                      <Star
                        className={cn('h-4 w-4', isFavorite(scheme) && 'fill-amber-400 text-amber-400')}
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
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
