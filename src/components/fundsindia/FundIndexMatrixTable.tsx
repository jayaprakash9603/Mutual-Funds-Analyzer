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
const TOTAL_COLUMNS = 7

const DATA_CELL = cn('border px-3 py-2.5 text-center tabular-nums', FI_GRID)
const YEAR_CELL = cn(
  'sticky left-0 z-10 min-w-[240px] border-r px-3 py-2.5 align-top',
  FI_GRID,
)

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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300/90 bg-white shadow-sm dark:border-slate-600 dark:bg-card">
      <div className="border-b border-brand/30 bg-brand px-6 py-3">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Key Parameters</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
          {data?.fundName && (
            <span className="max-w-[min(100%,20rem)] truncate font-medium" title={data.fundName}>
              {data.fundName}
            </span>
          )}
          {data?.fundName && data?.benchmarkName ? <span aria-hidden="true">·</span> : null}
          {data?.benchmarkName && (
            <span
              className="max-w-[min(100%,16rem)] truncate font-medium"
              style={{ color: '#fed7aa' }}
              title={data.benchmarkName}
            >
              {data.benchmarkName}
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-border/60 bg-muted/20 px-6 py-2">
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
        <div className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading multi-period comparison...
        </div>
      )}

      {error && !loading && (
        <div className="px-6 py-6 text-sm text-destructive">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={cn(
                    'sticky left-0 z-20 min-w-[240px] border-r border-white/25 text-left',
                    fiHeaderCell(),
                  )}
                >
                  Year
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
                    <tr key={`${period}-missing`} className="bg-muted/20">
                      <td colSpan={TOTAL_COLUMNS} className={cn(DATA_CELL, 'text-left text-muted-foreground')}>
                        {period} — {missing ? 'insufficient history' : 'loading...'}
                      </td>
                    </tr>,
                  ]
                }

                const benchmarkName = row.benchmarkName || data?.benchmarkName || 'Index'
                const avgColor = outperformanceColor(row.fund.avg >= row.benchmark.avg)
                const stripe = periodIndex % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50/90 dark:bg-muted/25'

                return [
                  <tr key={`${period}-fund`} className={stripe}>
                    <td rowSpan={2} className={cn(YEAR_CELL, stripe)}>
                      <div className="text-sm font-bold text-foreground">{period}</div>
                      <div className="mt-3 space-y-2.5">
                        <SeriesName name={row.fundName} color={FUND_COLOR} />
                        <SeriesName name={benchmarkName} color={BENCHMARK_COLOR} />
                      </div>
                    </td>
                    <td className={cn(DATA_CELL, 'font-semibold')} style={{ color: avgColor }}>
                      {formatPercent(row.fund.avg)}
                    </td>
                    <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.max)}
                    </td>
                    <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.min)}
                    </td>
                    <td className={cn(DATA_CELL, 'font-medium')} style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.stdDev)}
                    </td>
                    <td rowSpan={2} className={cn(DATA_CELL, 'align-middle text-base font-bold text-brand')}>
                      {formatPercent(row.cob)}
                    </td>
                    <td rowSpan={2} className={cn(DATA_CELL, 'align-middle text-base font-bold')}>
                      {row.fund.count.toLocaleString()}
                    </td>
                  </tr>,
                  <tr key={`${period}-index`} className={stripe} aria-label={`${period} ${benchmarkName}`}>
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
        <div className="border-t border-border/60 px-6 py-3 text-sm text-muted-foreground">
          Consistency score:{' '}
          <strong className="font-semibold text-brand">{consistencyScore.toFixed(0)}/100</strong>
        </div>
      )}
    </div>
  )
}

function SeriesName({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <p className="truncate text-xs leading-snug" style={{ color }} title={name}>
        {name}
      </p>
    </div>
  )
}
