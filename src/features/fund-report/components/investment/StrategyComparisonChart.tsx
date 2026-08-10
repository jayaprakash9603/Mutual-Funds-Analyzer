import { useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer } from '@/components/ui/chart'
import { FundSearchDropdown } from '@/components/dashboard/search/FundSearchDropdown'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { useFundSearch } from '@/hooks/useFundSearch'
import { formatPercent } from '@/lib/utils'
import { useStrategyComparison } from '../../hooks/useStrategyComparison'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import { MetricTile } from '../layout/SectionShell'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'

const SEARCH_MIN_CHARS = 3

type VisibleSeries = {
  sip: boolean
  lumpsum: boolean
  stp: boolean
}

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function StrategyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const invested = payload.find((item) => item.dataKey === 'investedSoFar')?.value
  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {payload
        .filter((item) => item.dataKey !== 'investedSoFar' && item.value != null)
        .map((item) => (
          <p key={String(item.dataKey)} className="tabular-nums" style={{ color: item.color }}>
            {item.name}: {formatInr(Number(item.value))}
          </p>
        ))}
      {invested != null ? (
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          SIP invested so far: {formatInr(Number(invested))}
        </p>
      ) : null}
    </div>
  )
}

export function StrategyComparisonChart({
  scheme,
  startDate,
  principal = 100_000,
  isSharedView = false,
}: {
  scheme: string
  startDate?: string
  principal?: number
  isSharedView?: boolean
}) {
  const [enabled, setEnabled] = useState(false)
  const [sourceScheme, setSourceScheme] = useState<string | null>(null)
  const [sourceQuery, setSourceQuery] = useState('')
  const [showSourceResults, setShowSourceResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState<VisibleSeries>({ sip: true, lumpsum: true, stp: true })
  const sourceInputRef = useRef<HTMLDivElement>(null)
  const sourceListRef = useRef<HTMLDivElement>(null)
  const axis = useResponsiveAxis({ dense: true })

  const searchEnabled = enabled && sourceQuery.trim().length >= SEARCH_MIN_CHARS
  const { schemes, loading: searchLoading } = useFundSearch(sourceQuery, '', searchEnabled)

  const { data, loading, error, retry, sipMonthlyAmount, transferMonths } = useStrategyComparison({
    scheme,
    sourceScheme,
    startDate,
    principal,
    enabled: enabled && !isSharedView,
  })

  const chartData = useMemo(() => data?.series ?? [], [data])

  if (isSharedView) {
    return (
      <p className="text-sm text-muted-foreground">
        Strategy comparison needs live simulations and is not included in shared snapshots.
      </p>
    )
  }

  return (
    <ReportInsightCard
      title="Which strategy wins for this fund?"
      subtitle="Compare SIP, lumpsum, and STP on the same invested amount and start date."
    >
      <div className="space-y-4">
        {!enabled ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setEnabled(true)}>
            Compare strategies
          </Button>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="strategy-stp-source">
                  STP source fund (optional)
                </label>
                <div ref={sourceInputRef}>
                  <Input
                    id="strategy-stp-source"
                    value={sourceQuery}
                    placeholder="Search liquid / debt fund for STP…"
                    onChange={(event) => {
                      setSourceQuery(event.target.value)
                      setShowSourceResults(true)
                    }}
                    onFocus={() => setShowSourceResults(true)}
                    autoComplete="off"
                  />
                </div>
                <FundSearchDropdown
                  open={showSourceResults}
                  anchorRef={sourceInputRef}
                  query={sourceQuery}
                  schemes={schemes.filter((item) => item !== scheme)}
                  loading={searchLoading}
                  selectedScheme={sourceScheme}
                  activeIndex={activeIndex}
                  onActiveIndexChange={setActiveIndex}
                  onSelect={(value) => {
                    setSourceScheme(value)
                    setSourceQuery(value)
                    setShowSourceResults(false)
                  }}
                  listRef={sourceListRef}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                SIP ≈ ₹{sipMonthlyAmount.toLocaleString('en-IN')}/mo · STP transfer {transferMonths} mo ·
                Principal {formatInr(principal)}
              </p>
            </div>

            {loading && !data ? <Skeleton className="h-[320px] w-full rounded-xl" /> : null}
            {error ? (
              <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <p>{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={retry}>
                  Retry
                </Button>
              </div>
            ) : null}

            {data && chartData.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Same rupee budget, three paths. Toggle legend items to hide a series. STP appears
                  once a different source fund is selected.
                </p>
                <div className={CHART_PANEL_RESPONSIVE_CLASS}>
                  <ChartContainer
                    config={{}}
                    className="aspect-auto h-[280px] w-full sm:h-[340px] lg:h-[380px]"
                  >
                    <LineChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis
                        dataKey="date"
                        tickLine={TICK_LINE}
                        axisLine={AXIS_LINE}
                        tick={axis.tick}
                        minTickGap={axis.xGap}
                        height={axis.xHeight}
                        angle={axis.xAngle}
                        textAnchor={axis.xAnchor}
                        interval="preserveStartEnd"
                        tickFormatter={axis.formatMonthYearTick}
                      >
                        {axis.showXLabel ? <Label {...xLabel('Date')} /> : null}
                      </XAxis>
                      <YAxis
                        tickLine={TICK_LINE}
                        axisLine={AXIS_LINE}
                        tick={axis.tick}
                        width={axis.yWidth}
                        tickFormatter={(value) =>
                          Number(value) >= 100_000
                            ? `${(Number(value) / 100_000).toFixed(1)}L`
                            : `${Math.round(Number(value) / 1000)}k`
                        }
                      >
                        {axis.showYLabel ? <Label {...yLabel('Corpus')} /> : null}
                      </YAxis>
                      <Tooltip content={<StrategyTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        onClick={(entry) => {
                          const key = String(entry.dataKey)
                          if (key === 'sipCorpus') setVisible((v) => ({ ...v, sip: !v.sip }))
                          if (key === 'lumpsumCorpus') setVisible((v) => ({ ...v, lumpsum: !v.lumpsum }))
                          if (key === 'stpCorpus') setVisible((v) => ({ ...v, stp: !v.stp }))
                        }}
                      />
                      {visible.sip ? (
                        <Line
                          type="monotone"
                          dataKey="sipCorpus"
                          name="SIP"
                          stroke={CHART_COLORS.fund}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ) : null}
                      {visible.lumpsum ? (
                        <Line
                          type="monotone"
                          dataKey="lumpsumCorpus"
                          name="Lumpsum"
                          stroke={CHART_COLORS.blue}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ) : null}
                      {visible.stp && sourceScheme ? (
                        <Line
                          type="monotone"
                          dataKey="stpCorpus"
                          name="STP"
                          stroke={CHART_COLORS.violet}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ) : null}
                    </LineChart>
                  </ChartContainer>
                </div>

                <AppMetricGrid className="lg:grid-cols-3">
                  <MetricTile
                    size="sm"
                    label={data.summary.winner === 'SIP' ? 'SIP final ★' : 'SIP final'}
                    value={data.summary.sip ? formatInr(data.summary.sip.currentValue) : '—'}
                    hint={
                      data.summary.sip
                        ? `XIRR ${formatPercent(data.summary.sip.xirr, 1)}`
                        : undefined
                    }
                  />
                  <MetricTile
                    size="sm"
                    label={data.summary.winner === 'Lumpsum' ? 'Lumpsum final ★' : 'Lumpsum final'}
                    value={data.summary.lumpsum ? formatInr(data.summary.lumpsum.currentValue) : '—'}
                    hint={
                      data.summary.lumpsum
                        ? `CAGR ${formatPercent(data.summary.lumpsum.cagr, 1)}`
                        : undefined
                    }
                  />
                  <MetricTile
                    size="sm"
                    label={data.summary.winner === 'STP' ? 'STP final ★' : 'STP final'}
                    value={data.summary.stp ? formatInr(data.summary.stp.totalValue) : 'Select source'}
                    hint={
                      data.summary.stp
                        ? `XIRR ${formatPercent(data.summary.stp.xirr, 1)}`
                        : 'Needs liquid/debt source'
                    }
                  />
                </AppMetricGrid>
                {data.summary.winner ? (
                  <p className="text-sm font-medium text-foreground">
                    Winner on final corpus: {data.summary.winner}
                  </p>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </ReportInsightCard>
  )
}
