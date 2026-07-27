import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Loader2, Trophy, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer } from '@/components/layout/PageContainer'
import { ScrollTable } from '@/components/ui/scroll-table'
import { FundSearchDropdown } from '@/components/dashboard/search/FundSearchDropdown'
import { useFundSearch } from '@/hooks/useFundSearch'
import { fetchComparison } from '@/api/client'
import { getRadarData } from '@/lib/analytics/chartData'
import type { GoldenTriangleResult } from '@/api/schemas'
import {
  DEFAULT_PERIOD,
  MAX_COMPARE_FUNDS,
  SORT_OPTIONS,
  type Period,
  type SortOption,
} from '@/lib/constants'
import { CHART_SERIES } from '@/lib/charts/chartColors'
import { cn } from '@/lib/utils'
import { DOMAIN_0_100 } from '@/lib/charts/chartAxes'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CHART_TOOLTIP_CURSOR,
} from '@/components/ui/chart'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

const GOLDEN_TRIANGLE_RULES = 3
const SEARCH_SUGGESTION_MIN_CHARS = 2
const FUND_NAME_MAX_CHARS = 20
const RADAR_FILL_OPACITY = 0.15
const RADAR_METRICS = ['Rolling Return', 'COB', 'Sharpe', 'Alpha', 'Risk', 'Consistency']

function seriesColor(index: number) {
  return CHART_SERIES[index % CHART_SERIES.length]
}

export function ComparePage() {
  const [funds, setFunds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [results, setResults] = useState<GoldenTriangleResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('cob')
  const [sorting, setSorting] = useState<SortingState>([])
  const searchEnabled = showResults && query.trim().length >= SEARCH_SUGGESTION_MIN_CHARS
  const { schemes, loading: searchLoading } = useFundSearch(query, 'All', searchEnabled)
  const inputWrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [query, schemes])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (inputWrapRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setShowResults(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addFund = (scheme: string) => {
    if (funds.length >= MAX_COMPARE_FUNDS) {
      toast.error(`Maximum ${MAX_COMPARE_FUNDS} funds allowed`)
      return
    }
    if (funds.includes(scheme)) return
    setFunds((prev) => [...prev, scheme])
    setQuery('')
    setShowResults(false)
  }

  const removeFund = (scheme: string) => {
    setFunds((prev) => prev.filter((f) => f !== scheme))
    setResults((prev) => prev.filter((r) => r.fundName !== scheme))
  }

  const compare = useCallback(async () => {
    if (!funds.length) return
    setLoading(true)
    try {
      const analyzed = await fetchComparison(funds, DEFAULT_PERIOD as Period)
      setResults(analyzed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }, [funds])

  const sortedResults = useMemo(() => {
    const copy = [...results]
    const sorters: Record<SortOption, (a: GoldenTriangleResult, b: GoldenTriangleResult) => number> = {
      cob: (a, b) => b.metrics.cob - a.metrics.cob,
      sharpe: (a, b) => b.metrics.fundSharpe - a.metrics.fundSharpe,
      risk: (a, b) => a.metrics.fundVolatility - b.metrics.fundVolatility,
      alpha: (a, b) => b.metrics.alpha - a.metrics.alpha,
      rollingReturn: (a, b) => b.metrics.fundRollingAvg - a.metrics.fundRollingAvg,
    }
    copy.sort(sorters[sortBy])
    return copy
  }, [results, sortBy])

  const winner = sortedResults[0]

  const columns = useMemo<ColumnDef<GoldenTriangleResult>[]>(
    () => [
      { accessorKey: 'fundName', header: 'Fund', cell: (info) => <span className="line-clamp-2 max-w-xs">{String(info.getValue())}</span> },
      { accessorKey: 'passCount', header: 'Score', cell: (info) => `${info.getValue()}/${GOLDEN_TRIANGLE_RULES}` },
      { accessorKey: 'overallRating', header: 'Rating' },
      { id: 'cob', header: 'COB', accessorFn: (r) => r.metrics.cob, cell: (info) => `${Number(info.getValue()).toFixed(1)}%` },
      { id: 'sharpe', header: 'Sharpe', accessorFn: (r) => r.metrics.fundSharpe, cell: (info) => Number(info.getValue()).toFixed(2) },
      { id: 'alpha', header: 'Alpha', accessorFn: (r) => r.metrics.alpha, cell: (info) => `${Number(info.getValue()).toFixed(2)}%` },
      { id: 'rolling', header: 'Rolling Avg', accessorFn: (r) => r.metrics.fundRollingAvg, cell: (info) => `${Number(info.getValue()).toFixed(2)}%` },
      { id: 'risk', header: 'Risk', accessorFn: (r) => r.metrics.riskLevel },
    ],
    [],
  )

  const table = useReactTable({
    data: sortedResults,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const radarData = useMemo(() => {
    if (!results.length) return []
    const perFund = results.map(getRadarData)
    return RADAR_METRICS.map((metric) => {
      const point: Record<string, string | number> = { metric }
      perFund.forEach((data, i) => {
        point[`fund${i}`] = data.find((d) => d.metric === metric)?.fund ?? 0
      })
      return point
    })
  }, [results])

  const radarConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    results.forEach((r, i) => {
      config[`fund${i}`] = {
        label: r.fundName.split(' - ')[0].slice(0, FUND_NAME_MAX_CHARS),
        color: seriesColor(i),
      }
    })
    return config
  }, [results])

  return (
    <PageContainer width="wide">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Funds</h1>
        <p className="text-muted-foreground">Compare up to {MAX_COMPARE_FUNDS} mutual funds side by side</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Add Funds to Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative" ref={inputWrapRef}>
            <Input
              placeholder="Search funds to add..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => {
                if (!showResults || query.trim().length < SEARCH_SUGGESTION_MIN_CHARS) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  if (schemes.length) setActiveIndex((i) => (i + 1) % schemes.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  if (schemes.length) setActiveIndex((i) => (i - 1 + schemes.length) % schemes.length)
                } else if (e.key === 'Enter' && schemes[activeIndex]) {
                  e.preventDefault()
                  addFund(schemes[activeIndex])
                } else if (e.key === 'Escape') {
                  setShowResults(false)
                }
              }}
              autoComplete="off"
              role="combobox"
              aria-expanded={searchEnabled}
              aria-controls="fund-search-results"
            />
            <FundSearchDropdown
              open={searchEnabled}
              anchorRef={inputWrapRef}
              query={query}
              schemes={schemes}
              loading={searchLoading}
              selectedScheme={null}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onSelect={addFund}
              listRef={listRef}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {funds.map((f) => (
              <Badge key={f} variant="secondary" className="max-w-full gap-1 py-1.5 pl-3 pr-1 sm:max-w-[200px]">
                <span className="truncate">{f}</span>
                <button type="button" onClick={() => removeFund(f)} aria-label={`Remove ${f}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full space-y-2 sm:w-auto">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={compare} disabled={!funds.length || loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Compare {funds.length} Fund{funds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </CardContent>
      </Card>

      {winner && (
        <Card className="glass border-emerald-500/30">
          <CardContent className="flex items-center gap-3 p-6">
            <Trophy className="h-8 w-8 text-amber-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">Winner: {winner.fundName}</p>
              <p className="text-sm text-muted-foreground">
                {winner.passCount}/{GOLDEN_TRIANGLE_RULES} passed | COB {winner.metrics.cob.toFixed(1)}% | Sharpe {winner.metrics.fundSharpe.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <>
          <Card className="glass">
            <CardContent className="p-0">
              <ScrollTable minWidth={720}>
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-border/60">
                      {hg.headers.map((header, index) => (
                        <th
                          key={header.id}
                          className={cn(
                            'px-4 py-3 text-left font-medium text-muted-foreground',
                            index === 0 &&
                              'sticky left-0 z-10 min-w-[160px] bg-card after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 sm:min-w-[200px]',
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                      {row.getVisibleCells().map((cell, index) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-4 py-3',
                            index === 0 &&
                              'sticky left-0 z-10 bg-card after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/40',
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </ScrollTable>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Radar Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={CHART_PANEL_CLASS}>
              <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[400px]">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--chart-grid-stroke)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={DOMAIN_0_100} tick={{ fill: 'var(--chart-axis)', fontSize: 10 }} />
                  {results.map((result, i) => (
                    <Radar
                      key={result.fundName}
                      name={`fund${i}`}
                      dataKey={`fund${i}`}
                      stroke={seriesColor(i)}
                      fill={seriesColor(i)}
                      fillOpacity={RADAR_FILL_OPACITY}
                      isAnimationActive
                    />
                  ))}
                  <ChartLegend content={ChartLegendContent} />
                  <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
                </RadarChart>
              </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  )
}
