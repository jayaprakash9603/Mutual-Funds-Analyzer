import { useEffect, useMemo, useState } from 'react'
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
import { fetchSipSimulation } from '../../../api'
import { enrichMonthlyAverageCorpus, findScenarioForAmount, scaleTimeline } from '../../../lib/sipTimeline'
import type { FundReportInvestment, SipScenario, SipTimelinePoint } from '../../../schemas'
import { SipCorpusChart } from './SipCorpusChart'
import { SipScenarioTable } from './SipScenarioTable'

const PRESET_AMOUNTS = [500, 1_000, 5_000, 10_000, 25_000] as const
const SCHEDULE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

type SipCalculatorPanelProps = {
  scheme: string
  sip: FundReportInvestment['sip']
  startDate?: string
  isSharedView?: boolean
}

function summaryFromScenario(scenario: SipScenario) {
  const stcg = scenario.stcg ?? 0
  const ltcg = scenario.ltcg ?? 0
  return { scenario, totalTax: stcg + ltcg }
}

function applyLocalProjection(
  sip: FundReportInvestment['sip'],
  amount: number,
  scheduleDay: number,
  defaultAmount: number,
  defaultDay: number,
): { scenario: SipScenario | null; timeline: SipTimelinePoint[] } | null {
  if (scheduleDay !== defaultDay || !sip.timeline?.length) return null
  const tableRow = findScenarioForAmount(sip.scenarios, amount)
  if (!tableRow) return null

  const factor = amount / defaultAmount
  return {
    scenario: tableRow,
    timeline: scaleTimeline(sip.timeline, factor),
  }
}

export function SipCalculatorPanel({
  scheme,
  sip,
  startDate,
  isSharedView = false,
}: SipCalculatorPanelProps) {
  const defaultAmount = sip.chartAmount ?? 10_000
  const defaultDay = sip.scheduleDay ?? 1

  const [amount, setAmount] = useState(defaultAmount)
  const [scheduleDay, setScheduleDay] = useState(defaultDay)
  const initialLocal = applyLocalProjection(sip, defaultAmount, defaultDay, defaultAmount, defaultDay)
  const [timeline, setTimeline] = useState<SipTimelinePoint[]>(
    enrichMonthlyAverageCorpus(initialLocal?.timeline ?? sip.timeline ?? []) as SipTimelinePoint[],
  )
  const [activeScenario, setActiveScenario] = useState<SipScenario | null>(
    initialLocal?.scenario ?? findScenarioForAmount(sip.scenarios, defaultAmount),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tableScenarios = useMemo(() => {
    if (scheduleDay === defaultDay) return sip.scenarios
    if (activeScenario && amount === activeScenario.monthlyAmount) {
      return sip.scenarios.map((row) =>
        row.monthlyAmount === amount ? activeScenario : row,
      )
    }
    return sip.scenarios
  }, [activeScenario, amount, defaultDay, scheduleDay, sip.scenarios])

  useEffect(() => {
    const local = applyLocalProjection(sip, amount, scheduleDay, defaultAmount, defaultDay)
    if (local) {
      setActiveScenario(local.scenario)
      setTimeline(local.timeline)
    }

    if (isSharedView || !scheme) {
      if (!local) {
        const row = findScenarioForAmount(sip.scenarios, amount)
        if (row) setActiveScenario(row)
        if (amount === defaultAmount && scheduleDay === defaultDay) {
          setTimeline(enrichMonthlyAverageCorpus(sip.timeline ?? []) as SipTimelinePoint[])
        }
      }
      return
    }

    if (local) {
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchSipSimulation(scheme, { amount, scheduleDay, startDate, signal: controller.signal })
      .then((result) => {
        setActiveScenario(result.scenario)
        setTimeline(result.timeline)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const fallback = applyLocalProjection(sip, amount, defaultDay, defaultAmount, defaultDay)
        if (fallback) {
          setActiveScenario(fallback.scenario)
          setTimeline(fallback.timeline)
          setError('Using default schedule projection — custom day simulation unavailable.')
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load SIP simulation')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [scheme, amount, scheduleDay, startDate, isSharedView, defaultAmount, defaultDay, sip])

  const summary = activeScenario ? summaryFromScenario(activeScenario) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/70 bg-card/40 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="sip-amount">
            Monthly amount
          </label>
          <Select value={String(amount)} onValueChange={(v) => setAmount(Number.parseInt(v, 10))}>
            <SelectTrigger id="sip-amount" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_AMOUNTS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  ₹{preset.toLocaleString('en-IN')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="sip-day">
            SIP day of month
          </label>
          <Select value={String(scheduleDay)} onValueChange={(v) => setScheduleDay(Number.parseInt(v, 10))}>
            <SelectTrigger id="sip-day" className="w-[120px]">
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
          Uses the nearest available NAV within 7 days of your chosen calendar day each month.
        </p>
      </div>

      {summary && (
        <InvestmentSummaryMetrics>
          <MetricTile
            size="sm"
            label="Total invested"
            value={`₹${summary.scenario.moneyInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            size="sm"
            label="Current value"
            value={`₹${summary.scenario.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            size="sm"
            label="XIRR"
            value={`${summary.scenario.xirr.toFixed(1)}%`}
            hint={`Post-tax ${(summary.scenario.postTaxXirr ?? 0).toFixed(1)}%`}
          />
          <MetricTile
            size="sm"
            label="Tax if redeemed today"
            value={`−₹${summary.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint={`10Y projection ₹${summary.scenario.projectedValue10Y.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
        </InvestmentSummaryMetrics>
      )}

      {loading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : (
        <SipCorpusChart timeline={timeline} monthlyAmount={amount} scheduleDay={scheduleDay} />
      )}

      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}

      <SipScenarioTable scenarios={tableScenarios} highlightAmount={amount} />
    </div>
  )
}
