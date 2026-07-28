import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FundSearchDropdown } from '@/components/dashboard/search/FundSearchDropdown'
import { useFundSearch } from '@/hooks/useFundSearch'
import { MetricTile } from '../../layout/SectionShell'
import { fetchStpSimulation } from '../../../api'
import type { StpScenario, StpTimelinePoint } from '../../../schemas'
import { StpCorpusChart } from './StpCorpusChart'

const LUMP_SUM_PRESETS = [5_00_000, 10_00_000, 25_00_000, 50_00_000, 1_00_00_000] as const
const TRANSFER_MONTHS = [3, 6, 12] as const
const SCHEDULE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)
const SEARCH_MIN_CHARS = 2

function formatCorpus(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`
  return `₹${value.toLocaleString('en-IN')}`
}

type StpCalculatorPanelProps = {
  targetScheme: string
  startDate?: string
  isSharedView?: boolean
}

export function StpCalculatorPanel({
  targetScheme,
  startDate,
  isSharedView = false,
}: StpCalculatorPanelProps) {
  const [sourceScheme, setSourceScheme] = useState<string | null>(null)
  const [sourceQuery, setSourceQuery] = useState('')
  const [showSourceResults, setShowSourceResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const sourceInputRef = useRef<HTMLDivElement>(null)
  const sourceListRef = useRef<HTMLDivElement>(null)

  const [lumpSum, setLumpSum] = useState<number>(10_00_000)
  const [transferMonths, setTransferMonths] = useState<number>(6)
  const [scheduleDay, setScheduleDay] = useState(1)
  const [timeline, setTimeline] = useState<StpTimelinePoint[]>([])
  const [activeScenario, setActiveScenario] = useState<StpScenario | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthlyTransfer = useMemo(
    () => Math.max(1, Math.round(lumpSum / transferMonths)),
    [lumpSum, transferMonths],
  )

  const searchEnabled =
    showSourceResults && sourceQuery.trim().length >= SEARCH_MIN_CHARS && sourceQuery !== sourceScheme
  const { schemes, loading: searchLoading } = useFundSearch(sourceQuery, 'All', searchEnabled)

  useEffect(() => {
    setActiveIndex(0)
  }, [sourceQuery, schemes])

  useEffect(() => {
    if (isSharedView || !targetScheme || !sourceScheme) {
      if (!sourceScheme) {
        setTimeline([])
        setActiveScenario(null)
      }
      return
    }
    if (sourceScheme === targetScheme) {
      setError('Source and target funds must be different.')
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchStpSimulation(targetScheme, {
      sourceScheme,
      lumpSum,
      monthlyTransfer,
      transferMonths,
      scheduleDay,
      startDate,
      signal: controller.signal,
    })
      .then((result) => {
        setActiveScenario(result.scenario)
        setTimeline(result.timeline)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load STP simulation')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [
    targetScheme,
    sourceScheme,
    lumpSum,
    monthlyTransfer,
    transferMonths,
    scheduleDay,
    startDate,
    isSharedView,
  ])

  const selectSource = (scheme: string) => {
    setSourceScheme(scheme)
    setSourceQuery(scheme)
    setShowSourceResults(false)
  }

  const onSourceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSourceResults || schemes.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, schemes.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && schemes[activeIndex]) {
      event.preventDefault()
      selectSource(schemes[activeIndex])
    } else if (event.key === 'Escape') {
      setShowSourceResults(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <div className="min-w-[240px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="stp-source">
            Source fund (park lump sum)
          </label>
          <div ref={sourceInputRef}>
            <Input
              id="stp-source"
              value={sourceQuery}
              placeholder="Search liquid / debt fund…"
              onChange={(e) => {
                setSourceQuery(e.target.value)
                setShowSourceResults(true)
              }}
              onFocus={() => setShowSourceResults(true)}
              onKeyDown={onSourceKeyDown}
              autoComplete="off"
            />
          </div>
          <FundSearchDropdown
            open={showSourceResults}
            anchorRef={sourceInputRef}
            query={sourceQuery}
            schemes={schemes.filter((s) => s !== targetScheme)}
            loading={searchLoading}
            selectedScheme={sourceScheme}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onSelect={selectSource}
            listRef={sourceListRef}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Target fund</label>
          <p className="max-w-xs truncate rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            {targetScheme}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="stp-lump-sum">
            Lump sum parked
          </label>
          <Select value={String(lumpSum)} onValueChange={(v) => setLumpSum(Number.parseInt(v, 10))}>
            <SelectTrigger id="stp-lump-sum" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LUMP_SUM_PRESETS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  {formatCorpus(preset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="stp-months">
            Transfer over
          </label>
          <Select
            value={String(transferMonths)}
            onValueChange={(v) => setTransferMonths(Number.parseInt(v, 10))}
          >
            <SelectTrigger id="stp-months" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_MONTHS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {months} months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="stp-day">
            STP day of month
          </label>
          <Select value={String(scheduleDay)} onValueChange={(v) => setScheduleDay(Number.parseInt(v, 10))}>
            <SelectTrigger id="stp-day" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_DAYS.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}
                  {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="max-w-md text-xs text-muted-foreground">
          ₹{monthlyTransfer.toLocaleString('en-IN')}/month moves from source to target. Both balances
          grow with their own NAV history after each transfer.
        </p>
      </div>

      {activeScenario && sourceScheme && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Transferred to target"
            value={`₹${activeScenario.totalTransferred.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint={`${activeScenario.transferCount} instalments`}
          />
          <MetricTile
            label="Source remaining"
            value={`₹${activeScenario.sourceRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint="Parked balance at latest NAV"
          />
          <MetricTile
            label="Target value"
            value={`₹${activeScenario.targetValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint="Deployed balance at latest NAV"
          />
          <MetricTile
            label="Total portfolio"
            value={`₹${activeScenario.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint={`CAGR ${activeScenario.xirr.toFixed(1)}% · Gain ₹${activeScenario.totalGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
        </div>
      )}

      {!sourceScheme && (
        <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Search and select a source fund (typically liquid or debt) where the lump sum is parked before
          monthly transfers into this fund.
        </p>
      )}

      {loading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : sourceScheme ? (
        <StpCorpusChart
          timeline={timeline}
          sourceScheme={sourceScheme}
          targetScheme={targetScheme}
          lumpSum={lumpSum}
          monthlyTransfer={monthlyTransfer}
          transferMonths={transferMonths}
          scheduleDay={scheduleDay}
        />
      ) : null}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
