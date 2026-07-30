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
import { fetchStepUpSipSimulation } from '../../../api'
import { enrichMonthlyAverageCorpus } from '../../../lib/sipTimeline'
import type {
  FundReportInvestment,
  SipTimelinePoint,
  StepUpMode,
  StepUpSipScenario,
} from '../../../schemas'
import { SipCorpusChart } from '../sip/SipCorpusChart'
import { StepUpSipScenarioTable } from './StepUpSipScenarioTable'

const INITIAL_AMOUNTS = [500, 1_000, 5_000, 10_000, 25_000] as const
const PERCENT_PRESETS = [5, 10, 15, 20] as const
const FIXED_PRESETS = [1_000, 2_000, 5_000, 10_000] as const
const SCHEDULE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

const EMPTY_STEP_UP_SIP: NonNullable<FundReportInvestment['stepUpSip']> = {
  scenarios: [],
}

type StepUpSipCalculatorPanelProps = {
  scheme: string
  stepUpSip?: FundReportInvestment['stepUpSip']
  startDate?: string
  isSharedView?: boolean
}

function summaryFromScenario(scenario: StepUpSipScenario) {
  const stcg = scenario.stcg ?? 0
  const ltcg = scenario.ltcg ?? 0
  return { scenario, totalTax: stcg + ltcg }
}

function stepUpLabel(mode: StepUpMode, percent: number, amount: number): string {
  return mode === 'PERCENT' ? `${percent}% annually` : `+₹${amount.toLocaleString('en-IN')} annually`
}

export function StepUpSipCalculatorPanel({
  scheme,
  stepUpSip: stepUpSipInput,
  startDate,
  isSharedView = false,
}: StepUpSipCalculatorPanelProps) {
  const stepUpSip = stepUpSipInput ?? EMPTY_STEP_UP_SIP
  const defaultInitial = stepUpSip.chartInitialAmount ?? 10_000
  const defaultDay = stepUpSip.scheduleDay ?? 1
  const defaultMode: StepUpMode = stepUpSip.stepUpMode ?? 'PERCENT'
  const defaultPercent = stepUpSip.stepUpPercent ?? 10
  const defaultFixed = stepUpSip.stepUpAmount ?? 2_000

  const [initialAmount, setInitialAmount] = useState(defaultInitial)
  const [scheduleDay, setScheduleDay] = useState(defaultDay)
  const [stepUpMode, setStepUpMode] = useState<StepUpMode>(defaultMode)
  const [stepUpPercent, setStepUpPercent] = useState(defaultPercent)
  const [stepUpAmount, setStepUpAmount] = useState(defaultFixed)
  const [timeline, setTimeline] = useState<SipTimelinePoint[]>(
    enrichMonthlyAverageCorpus(stepUpSip.timeline ?? []) as SipTimelinePoint[],
  )
  const [activeScenario, setActiveScenario] = useState<StepUpSipScenario | null>(
    stepUpSip.scenarios.find((row) => row.initialMonthlyAmount === defaultInitial) ??
      stepUpSip.scenarios[0] ??
      null,
  )
  const [tableScenarios, setTableScenarios] = useState(stepUpSip.scenarios)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const matchesDefaults =
    initialAmount === defaultInitial &&
    scheduleDay === defaultDay &&
    stepUpMode === defaultMode &&
    (stepUpMode === 'PERCENT' ? stepUpPercent === defaultPercent : stepUpAmount === defaultFixed)

  useEffect(() => {
    if (isSharedView || !scheme) return
    if (matchesDefaults) {
      setTableScenarios(stepUpSip.scenarios)
      return
    }

    const controller = new AbortController()
    Promise.all(
      INITIAL_AMOUNTS.map((amount) =>
        fetchStepUpSipSimulation(scheme, {
          initialAmount: amount,
          scheduleDay,
          stepUpMode,
          stepUpPercent,
          stepUpAmount,
          startDate,
          signal: controller.signal,
        }).then((result) => result.scenario),
      ),
    )
      .then(setTableScenarios)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
      })

    return () => controller.abort()
  }, [
    scheme,
    scheduleDay,
    stepUpMode,
    stepUpPercent,
    stepUpAmount,
    startDate,
    isSharedView,
    matchesDefaults,
    stepUpSip.scenarios,
  ])

  useEffect(() => {
    if (isSharedView || !scheme) {
      if (matchesDefaults) {
        setTimeline(enrichMonthlyAverageCorpus(stepUpSip.timeline ?? []) as SipTimelinePoint[])
        setTableScenarios(stepUpSip.scenarios)
        const row =
          stepUpSip.scenarios.find((s) => s.initialMonthlyAmount === initialAmount) ??
          stepUpSip.scenarios[0] ??
          null
        setActiveScenario(row)
      }
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)

      fetchStepUpSipSimulation(scheme, {
        initialAmount,
        scheduleDay,
        stepUpMode,
        stepUpPercent,
        stepUpAmount,
        startDate,
        signal: controller.signal,
      })
        .then((result) => {
          setActiveScenario(result.scenario)
          setTimeline(enrichMonthlyAverageCorpus(result.timeline) as SipTimelinePoint[])
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : 'Failed to load Step Up SIP simulation')
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [
    scheme,
    initialAmount,
    scheduleDay,
    stepUpMode,
    stepUpPercent,
    stepUpAmount,
    startDate,
    isSharedView,
    matchesDefaults,
    stepUpSip.timeline,
    stepUpSip.scenarios,
  ])

  const summary = activeScenario ? summaryFromScenario(activeScenario) : null
  const chartSubtitle = useMemo(
    () =>
      `₹${initialAmount.toLocaleString('en-IN')}/month starting, ${stepUpLabel(stepUpMode, stepUpPercent, stepUpAmount)} on day ${scheduleDay}`,
    [initialAmount, scheduleDay, stepUpAmount, stepUpMode, stepUpPercent],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="step-up-initial">
            Initial monthly amount
          </label>
          <Select value={String(initialAmount)} onValueChange={(v) => setInitialAmount(Number.parseInt(v, 10))}>
            <SelectTrigger id="step-up-initial" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INITIAL_AMOUNTS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  ₹{preset.toLocaleString('en-IN')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="step-up-day">
            SIP day of month
          </label>
          <Select value={String(scheduleDay)} onValueChange={(v) => setScheduleDay(Number.parseInt(v, 10))}>
            <SelectTrigger id="step-up-day" className="w-[120px]">
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
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="step-up-mode">
            Step-up type
          </label>
          <Select value={stepUpMode} onValueChange={(v) => setStepUpMode(v as StepUpMode)}>
            <SelectTrigger id="step-up-mode" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Percentage</SelectItem>
              <SelectItem value="FIXED">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="step-up-value">
            {stepUpMode === 'PERCENT' ? 'Annual increase' : 'Annual increment'}
          </label>
          {stepUpMode === 'PERCENT' ? (
            <Select value={String(stepUpPercent)} onValueChange={(v) => setStepUpPercent(Number.parseFloat(v))}>
              <SelectTrigger id="step-up-value" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERCENT_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={String(preset)}>
                    {preset}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={String(stepUpAmount)} onValueChange={(v) => setStepUpAmount(Number.parseInt(v, 10))}>
              <SelectTrigger id="step-up-value" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIXED_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={String(preset)}>
                    ₹{preset.toLocaleString('en-IN')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          SIP amount increases every 12 instalments (SIP anniversary). Uses nearest NAV within 7 days of your chosen day.
        </p>
      </div>

      {summary && (
        <InvestmentSummaryMetrics wide>
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
          <MetricTile
            size="sm"
            label="Current monthly SIP"
            value={`₹${summary.scenario.currentMonthlyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            hint="After step-ups"
          />
          <MetricTile
            size="sm"
            label="Total instalments"
            value={String(summary.scenario.instalmentCount)}
            hint={chartSubtitle}
          />
        </InvestmentSummaryMetrics>
      )}

      {loading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : (
        <div>
          <SipCorpusChart timeline={timeline} monthlyAmount={initialAmount} scheduleDay={scheduleDay} />
          <p className="mt-2 px-1 text-xs text-muted-foreground">{chartSubtitle}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <StepUpSipScenarioTable
        scenarios={tableScenarios}
        stepUpMode={stepUpMode}
        highlightInitialAmount={initialAmount}
      />
    </div>
  )
}
