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
import { fetchLumpsumSimulation } from '../../../api'
import { enrichMonthlyAverageCorpus, scaleTimeline } from '../../../lib/sipTimeline'
import type { FundReportInvestment, SipTimelinePoint } from '../../../schemas'
import { SipCorpusChart } from '../sip/SipCorpusChart'
import { LumpsumScenarioTable } from './LumpsumScenarioTable'

const PRINCIPAL_PRESETS = [10_000, 50_000, 100_000, 500_000, 1_000_000] as const

type LumpsumCalculatorPanelProps = {
  scheme: string
  lumpsum: FundReportInvestment['lumpsum']
  startDate?: string
  isSharedView?: boolean
}

function formatPrincipalLabel(principal: number): string {
  if (principal >= 100_000) return `₹${(principal / 100_000).toFixed(principal >= 500_000 ? 0 : 1)}L`
  return `₹${(principal / 1_000).toFixed(principal >= 10_000 ? 0 : 1)}k`
}

export function LumpsumCalculatorPanel({
  scheme,
  lumpsum,
  startDate,
  isSharedView = false,
}: LumpsumCalculatorPanelProps) {
  const defaultPrincipal = lumpsum.chartAmount ?? 100_000
  const [principal, setPrincipal] = useState(defaultPrincipal)
  const [timeline, setTimeline] = useState<SipTimelinePoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeScenario = useMemo(
    () => lumpsum.scenarios.find((row) => row.principal === principal) ?? lumpsum.scenarios[0] ?? null,
    [lumpsum.scenarios, principal],
  )

  useEffect(() => {
    const embedded = lumpsum.timeline ?? []
    const baseAmount = lumpsum.chartAmount ?? defaultPrincipal
    const canScaleLocally =
      embedded.length > 0 && principal !== defaultPrincipal && baseAmount > 0

    if (canScaleLocally) {
      setTimeline(scaleTimeline(embedded, principal / baseAmount))
      setError(null)
      return
    }

    if (embedded.length > 0 && principal === defaultPrincipal) {
      setTimeline(enrichMonthlyAverageCorpus(embedded) as SipTimelinePoint[])
      setError(null)
      return
    }

    if (isSharedView || !scheme) {
      setTimeline(enrichMonthlyAverageCorpus(embedded) as SipTimelinePoint[])
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchLumpsumSimulation(scheme, { principal, startDate, signal: controller.signal })
      .then((result) => {
        setTimeline(result.timeline)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load lump sum chart')
        if (embedded.length > 0) {
          setTimeline(scaleTimeline(embedded, principal / baseAmount))
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [scheme, principal, startDate, isSharedView, lumpsum.timeline, lumpsum.chartAmount, defaultPrincipal])

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

      {loading ? (
        <Skeleton className="h-[360px] w-full rounded-xl" />
      ) : (
        <SipCorpusChart
          timeline={timeline}
          monthlyAmount={principal}
          scheduleDay={1}
          chartTitle="Lump sum corpus growth"
          chartSubtitle={`₹${principal.toLocaleString('en-IN')} invested at fund inception`}
          emptyMessage="No lump sum growth data available for this fund."
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <LumpsumScenarioTable scenarios={lumpsum.scenarios} highlightPrincipal={principal} />
    </div>
  )
}
