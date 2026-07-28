import { useEffect, useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MetricTile } from '../../layout/SectionShell'
import { enrichMonthlyAverageCorpus, scaleTimeline } from '../../../lib/sipTimeline'
import type { FundReportInvestment, SipTimelinePoint } from '../../../schemas'
import { SipCorpusChart } from '../sip/SipCorpusChart'
import { LumpsumScenarioTable } from './LumpsumScenarioTable'

const PRINCIPAL_PRESETS = [10_000, 50_000, 100_000, 500_000, 1_000_000] as const

type LumpsumCalculatorPanelProps = {
  lumpsum: FundReportInvestment['lumpsum']
}

function formatPrincipalLabel(principal: number): string {
  if (principal >= 100_000) return `₹${(principal / 100_000).toFixed(principal >= 500_000 ? 0 : 1)}L`
  return `₹${(principal / 1_000).toFixed(principal >= 10_000 ? 0 : 1)}k`
}

export function LumpsumCalculatorPanel({ lumpsum }: LumpsumCalculatorPanelProps) {
  const defaultPrincipal = lumpsum.chartAmount ?? 100_000
  const [principal, setPrincipal] = useState(defaultPrincipal)

  const activeScenario = useMemo(
    () => lumpsum.scenarios.find((row) => row.principal === principal) ?? lumpsum.scenarios[0] ?? null,
    [lumpsum.scenarios, principal],
  )

  const [timeline, setTimeline] = useState<SipTimelinePoint[]>(
    enrichMonthlyAverageCorpus(lumpsum.timeline ?? []) as SipTimelinePoint[],
  )

  useEffect(() => {
    const baseAmount = lumpsum.chartAmount ?? defaultPrincipal
    const factor = principal / baseAmount
    setTimeline(scaleTimeline(lumpsum.timeline ?? [], factor))
  }, [principal, lumpsum.timeline, lumpsum.chartAmount, defaultPrincipal])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="lumpsum-principal">
            Investment amount
          </label>
          <Select value={String(principal)} onValueChange={(v) => setPrincipal(Number.parseInt(v, 10))}>
            <SelectTrigger id="lumpsum-principal" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRINCIPAL_PRESETS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  {formatPrincipalLabel(preset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          One-time investment at fund inception, tracked through daily NAV history.
        </p>
      </div>

      {activeScenario && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Principal invested"
            value={`₹${activeScenario.principal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            label="Current value"
            value={`₹${activeScenario.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            label="CAGR"
            value={`${activeScenario.cagr.toFixed(1)}%`}
            hint={`Gain ₹${activeScenario.gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <MetricTile
            label="Money multiplied"
            value={`${activeScenario.moneyMultiplied.toFixed(2)}x`}
            hint="Since inception"
          />
        </div>
      )}

      <SipCorpusChart
        timeline={timeline}
        monthlyAmount={principal}
        scheduleDay={1}
        chartTitle="Lump sum corpus growth"
        chartSubtitle={`₹${principal.toLocaleString('en-IN')} invested at fund inception`}
      />

      <LumpsumScenarioTable scenarios={lumpsum.scenarios} highlightPrincipal={principal} />
    </div>
  )
}
