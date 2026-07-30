import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import type { FundIndexComparison } from '@/api/schemas'
import { CHART_COLORS, outperformanceColor } from '@/lib/charts/chartColors'
import { fiHeaderCell, fiSubHeaderCell, FI_GRID } from '@/components/fundsindia/tableStyles'
import { MATRIX_PERIODS } from '@/lib/constants'
import { cn, formatPercent } from '@/lib/utils'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark
const DATA_COLUMNS = 4
const TOTAL_COLUMNS = 8

const DATA_CELL = cn('border px-3 py-2.5 text-center tabular-nums', FI_GRID)
const YEAR_CELL = cn(
  'sticky left-0 z-10 min-w-[96px] border-r px-3 py-2.5 align-middle text-center font-bold text-foreground',
  FI_GRID,
)
const SCHEME_CELL = cn('min-w-[240px] max-w-[320px] border-r px-3 py-2.5 align-middle text-left', FI_GRID)

interface FundIndexMatrixTableProps {
  data: FundIndexComparison | null
  loading: boolean
  error: string | null
  consistencyScore?: number
}

export function FundIndexMatrixTable({
  data,
  loading,
  error,
  consistencyScore,
}: FundIndexMatrixTableProps) {
  const computedAt = data?.computedAt
  const fundLabel = data?.fundName
  const benchmarkLabel = data?.benchmarkName

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-brand/30 bg-brand px-4 py-3 sm:px-6">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Key Parameters</h2>
        <p className="mt-1 text-sm text-white/85">Rolling return stats by holding period</p>
      </div>

      {fundLabel || benchmarkLabel ? (
        <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
          {fundLabel ? <SeriesLabel name={fundLabel} variant="fund" /> : null}
          {benchmarkLabel ? <SeriesLabel name={benchmarkLabel} variant="benchmark" /> : null}
        </div>
      ) : null}

      <div className="border-b border-border/60 px-4 py-2 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Fund vs index rolling return comparison
          {computedAt ? ` · updated ${format(new Date(computedAt), 'dd MMM yyyy')}` : ''}
          {data?.stale ? (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              refreshing
            </span>
          ) : null}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading multi-period comparison...
        </div>
      )}

      {error && !loading && (
        <div className="px-4 py-6 text-sm text-destructive sm:px-6">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={cn(
                    'sticky left-0 z-20 min-w-[96px] border-r border-white/25',
                    fiHeaderCell(),
                  )}
                >
                  Year
                </th>
                <th
                  rowSpan={2}
                  className={cn('min-w-[240px] border-r border-white/25 text-left', fiHeaderCell())}
                >
                  Fund / Index
                </th>
                <th colSpan={DATA_COLUMNS} className={cn('border border-white/20', fiHeaderCell())}>
                  Key Parameters
                </th>
                <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                  COB
                </th>
                <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                  Total Records
                </th>
              </tr>
              <tr>
                <th className={cn('border border-white/15', fiSubHeaderCell())}>AVG</th>
                <th className={cn('border border-white/15', fiSubHeaderCell())}>MAX</th>
                <th className={cn('border border-white/15', fiSubHeaderCell())}>MIN</th>
                <th className={cn('border border-white/15', fiSubHeaderCell())}>STD</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_PERIODS.flatMap((period, periodIndex) => {
                const row = data?.rows.find((entry) => entry.period === period)
                if (!row) {
                  const missing = data?.missingPeriods.includes(period)
                  return [
                    <tr key={`${period}-missing`} className="border-b-2 border-border bg-muted/20">
                      <td colSpan={TOTAL_COLUMNS} className={cn(DATA_CELL, 'text-left text-muted-foreground')}>
                        {period} — {missing ? 'insufficient history' : 'loading...'}
                      </td>
                    </tr>,
                  ]
                }

                const benchmarkName = row.benchmarkName || data?.benchmarkName || 'Index'
                const avgColor = outperformanceColor(row.fund.avg >= row.benchmark.avg)
                const stripe = periodIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                const isLastPeriod = periodIndex === MATRIX_PERIODS.length - 1

                return [
                  <tr key={`${period}-fund`} className={stripe}>
                    <td rowSpan={2} className={cn(YEAR_CELL, stripe, 'border-b-2 border-border')}>
                      {period}
                    </td>
                    <td className={cn(SCHEME_CELL, stripe, 'border-b border-dashed border-border/70')}>
                      <SeriesName name={row.fundName} variant="fund" />
                    </td>
                    <td className={cn(DATA_CELL, 'border-b border-dashed border-border/70 font-semibold')} style={{ color: avgColor }}>
                      {formatPercent(row.fund.avg)}
                    </td>
                    <td className={cn(DATA_CELL, 'border-b border-dashed border-border/70 font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.max)}
                    </td>
                    <td className={cn(DATA_CELL, 'border-b border-dashed border-border/70 font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.min)}
                    </td>
                    <td className={cn(DATA_CELL, 'border-b border-dashed border-border/70 font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.stdDev)}
                    </td>
                    <td rowSpan={2} className={cn(DATA_CELL, 'align-middle text-base font-bold text-brand', !isLastPeriod && 'border-b-2 border-border')}>
                      {formatPercent(row.cob)}
                    </td>
                    <td rowSpan={2} className={cn(DATA_CELL, 'align-middle text-base font-bold text-foreground', !isLastPeriod && 'border-b-2 border-border')}>
                      {row.fund.count.toLocaleString()}
                    </td>
                  </tr>,
                  <tr
                    key={`${period}-index`}
                    className={cn(stripe, !isLastPeriod && 'border-b-2 border-border')}
                    aria-label={`${period} ${benchmarkName}`}
                  >
                    <td className={cn(SCHEME_CELL, stripe)}>
                      <SeriesName name={benchmarkName} variant="benchmark" />
                    </td>
                    <td className={DATA_CELL} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.avg)}
                    </td>
                    <td className={DATA_CELL} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.max)}
                    </td>
                    <td className={DATA_CELL} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.min)}
                    </td>
                    <td className={DATA_CELL} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.stdDev)}
                    </td>
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </div>
      )}

      {consistencyScore != null && !loading && !error && (
        <div className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground sm:px-6">
          Consistency score:{' '}
          <strong className="font-semibold text-brand">{consistencyScore.toFixed(0)}/100</strong>
        </div>
      )}
    </div>
  )
}

function seriesTextClass(variant: 'fund' | 'benchmark') {
  return variant === 'fund'
    ? 'text-emerald-800 dark:text-emerald-300'
    : 'text-amber-800 dark:text-amber-300'
}

function seriesDotColor(variant: 'fund' | 'benchmark') {
  return variant === 'fund' ? FUND_COLOR : BENCHMARK_COLOR
}

function SeriesLabel({ name, variant }: { name: string; variant: 'fund' | 'benchmark' }) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-2.5 rounded-lg border px-3 py-2',
        variant === 'fund'
          ? 'border-emerald-500/25 bg-emerald-500/8'
          : 'border-amber-500/25 bg-amber-500/8',
      )}
    >
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: seriesDotColor(variant) }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {variant === 'fund' ? 'Fund' : 'Benchmark'}
        </p>
        <p className={cn('text-sm font-medium leading-snug break-words', seriesTextClass(variant))} title={name}>
          {name}
        </p>
      </div>
    </div>
  )
}

function SeriesName({ name, variant }: { name: string; variant: 'fund' | 'benchmark' }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
        style={{ backgroundColor: seriesDotColor(variant) }}
        aria-hidden="true"
      />
      <p className={cn('text-sm font-medium leading-snug break-words', seriesTextClass(variant))} title={name}>
        {name}
      </p>
    </div>
  )
}
