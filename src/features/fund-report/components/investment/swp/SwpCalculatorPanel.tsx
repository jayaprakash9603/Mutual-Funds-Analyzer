import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricTile } from '../../layout/SectionShell'
import { InvestmentSummaryMetrics } from '../InvestmentSummaryMetrics'
import { fetchSwpSimulation } from '../../../api'
import type { SwpScenario, SwpTimelinePoint } from '../../../schemas'
import { SwpCorpusChart } from './SwpCorpusChart'

const CORPUS_PRESETS = [10_00_000, 25_00_000, 50_00_000, 1_00_00_000] as const
const WITHDRAWAL_PRESETS = [5_000, 10_000, 25_000, 50_000] as const
const SCHEDULE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

function formatCorpus(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`
  return `₹${value.toLocaleString('en-IN')}`
}

type SwpCalculatorPanelProps = {
  scheme: string
  startDate?: string
  isSharedView?: boolean
}

export function SwpCalculatorPanel({ scheme, startDate, isSharedView = false }: SwpCalculatorPanelProps) {
  const [initialCorpus, setInitialCorpus] = useState<number>(10_00_000)
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<number>(10_000)
  const [scheduleDay, setScheduleDay] = useState(1)
  const [timeline, setTimeline] = useState<SwpTimelinePoint[]>([])
  const [activeScenario, setActiveScenario] = useState<SwpScenario | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSharedView || !scheme) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchSwpSimulation(scheme, {
      initialCorpus,
      monthlyWithdrawal,
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
        setError(err instanceof Error ? err.message : 'Failed to load SWP simulation')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [scheme, initialCorpus, monthlyWithdrawal, scheduleDay, startDate, isSharedView])

  const totalTax = activeScenario ? (activeScenario.stcg ?? 0) + (activeScenario.ltcg ?? 0) : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="swp-corpus">
            Initial corpus
          </label>
          <Select
            value={String(initialCorpus)}
            onValueChange={(v) => setInitialCorpus(Number.parseInt(v, 10))}
          >
            <SelectTrigger id="swp-corpus" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CORPUS_PRESETS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  {formatCorpus(preset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="swp-withdrawal">
            Monthly withdrawal
          </label>
          <Select
            value={String(monthlyWithdrawal)}
            onValueChange={(v) => setMonthlyWithdrawal(Number.parseInt(v, 10))}
          >
            <SelectTrigger id="swp-withdrawal" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WITHDRAWAL_PRESETS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  ₹{preset.toLocaleString('en-IN')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="swp-day">
            SWP day of month
          </label>
          <Select value={String(scheduleDay)} onValueChange={(v) => setScheduleDay(Number.parseInt(v, 10))}>
            <SelectTrigger id="swp-day" className="w-[120px]">
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
          Lump sum invested at fund inception, then fixed monthly withdrawals on your chosen calendar day.
        </p>
      </div>

      {activeScenario && (
        <InvestmentSummaryMetrics>
          <MetricTile
            size="sm"
            label="Total withdrawn"
            value={`₹${activeScenario.totalWithdrawn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint={`${activeScenario.withdrawalCount} instalments`}
          />
          <MetricTile
            size="sm"
            label="Remaining corpus"
            value={`₹${activeScenario.remainingCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint={activeScenario.depleted ? 'Corpus depleted' : 'At latest NAV'}
          />
          <MetricTile
            size="sm"
            label="Tax on withdrawals"
            value={`−₹${totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            size="sm"
            label="Post-tax remaining"
            value={`₹${activeScenario.postTaxRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint="If remaining corpus redeemed today"
          />
        </InvestmentSummaryMetrics>
      )}

      {loading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : (
        <SwpCorpusChart
          timeline={timeline}
          initialCorpus={initialCorpus}
          monthlyWithdrawal={monthlyWithdrawal}
          scheduleDay={scheduleDay}
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
