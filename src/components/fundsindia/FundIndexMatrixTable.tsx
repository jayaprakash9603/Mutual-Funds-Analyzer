import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import type { FundIndexComparison } from '@/api/schemas'
import { CHART_COLORS, outperformanceColor } from '@/lib/charts/chartColors'
import {
  fiHeaderCell,
  fiSubHeaderCell,
  fiMatrixDataCell,
  fiMatrixSchemeCell,
  fiStickyStripeBg,
  FI_TABLE,
} from '@/components/fundsindia/tableStyles'
import { ScrollTable } from '@/components/ui/scroll-table'
import {
  APP_TABLE_MIN_WIDTH,
  APP_TABLE_SHELL,
  APP_TABLE_SHELL_FOOTER,
  APP_TABLE_SHELL_HEADER,
  APP_TABLE_SHELL_META,
  APP_TABLE_SHELL_SUBTITLE,
  APP_TABLE_SHELL_TITLE,
} from '@/lib/ui/appTableStyles'
import { MATRIX_PERIODS } from '@/lib/constants'
import { shortPeriodLabel } from '@/lib/funds/shortPeriodLabel'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { cn, formatPercent } from '@/lib/utils'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark
const DATA_COLUMNS = 4
const METRIC_COLUMNS = 6

const YEAR_COL =
  'min-w-[2.75rem] max-w-[3.5rem] border-r px-1 py-1.5 text-center align-middle text-[11px] font-bold sm:min-w-[4.5rem] sm:max-w-none sm:px-2.5 sm:py-2 sm:text-xs'

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
  const isSmall = useIsSmallScreen()
  const computedAt = data?.computedAt
  const fundLabel = data?.fundName
  const benchmarkLabel = data?.benchmarkName

  const labelPane = !loading && !error ? (
    <table className={FI_TABLE}>
      <thead>
        <tr>
          <th className={cn(fiHeaderCell(), YEAR_COL, 'normal-case')}>
            {isSmall ? 'Yr' : 'Year'}
          </th>
          <th
            className={cn(
              fiHeaderCell(),
              'min-w-[7.5rem] max-w-[11rem] border-r border-white/25 text-left normal-case sm:min-w-[10rem] sm:max-w-[16rem]',
            )}
          >
            {isSmall ? 'Series' : 'Fund / Index'}
          </th>
        </tr>
        <tr>
          <th className={cn(fiSubHeaderCell(), YEAR_COL)} aria-hidden="true">
            &nbsp;
          </th>
          <th className={cn(fiSubHeaderCell(), 'text-left')} aria-hidden="true">
            &nbsp;
          </th>
        </tr>
      </thead>
      <tbody>
        {MATRIX_PERIODS.flatMap((period, periodIndex) => {
          const row = data?.rows.find((entry) => entry.period === period)
          const stripe = fiStickyStripeBg(periodIndex)
          const periodText = shortPeriodLabel(period, isSmall)

          if (!row) {
            const missing = data?.missingPeriods.includes(period)
            return [
              <tr key={`${period}-missing`} className={cn(stripe, 'border-b-2 border-border')}>
                <td className={cn(YEAR_COL, stripe)} title={period}>
                  {periodText}
                </td>
                <td
                  className={cn(
                    fiMatrixSchemeCell(),
                    stripe,
                    'text-left text-muted-foreground',
                  )}
                >
                  {missing ? 'insufficient history' : 'loading...'}
                </td>
              </tr>,
            ]
          }

          const benchmarkName = row.benchmarkName || data?.benchmarkName || 'Index'
          const isLastPeriod = periodIndex === MATRIX_PERIODS.length - 1

          return [
            <tr key={`${period}-fund`} className={stripe}>
              <td
                rowSpan={2}
                className={cn(YEAR_COL, stripe, 'border-b-2 border-border text-foreground')}
                title={period}
              >
                {periodText}
              </td>
              <td
                className={cn(
                  fiMatrixSchemeCell(),
                  stripe,
                  'border-b border-dashed border-border/70',
                )}
              >
                <SeriesName name={row.fundName} variant="fund" compact={isSmall} />
              </td>
            </tr>,
            <tr
              key={`${period}-index`}
              className={cn(stripe, !isLastPeriod && 'border-b-2 border-border')}
              aria-label={`${period} ${benchmarkName}`}
            >
              <td className={cn(fiMatrixSchemeCell(), stripe)}>
                <SeriesName name={benchmarkName} variant="benchmark" compact={isSmall} />
              </td>
            </tr>,
          ]
        })}
      </tbody>
    </table>
  ) : null

  return (
    <div className={APP_TABLE_SHELL}>
      <div className={APP_TABLE_SHELL_HEADER}>
        <h2 className={APP_TABLE_SHELL_TITLE}>Key Parameters</h2>
        <p className={APP_TABLE_SHELL_SUBTITLE}>Rolling return stats by holding period</p>
      </div>

      {fundLabel || benchmarkLabel ? (
        <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
          {fundLabel ? <SeriesLabel name={fundLabel} variant="fund" /> : null}
          {benchmarkLabel ? <SeriesLabel name={benchmarkLabel} variant="benchmark" /> : null}
        </div>
      ) : null}

      <div className={APP_TABLE_SHELL_META}>
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
        <ScrollTable
          pinnedLeading={labelPane}
          minWidth={isSmall ? 320 : APP_TABLE_MIN_WIDTH.matrix}
        >
          <table className={FI_TABLE}>
            <thead>
              <tr>
                <th colSpan={DATA_COLUMNS} className={cn('border border-white/20', fiHeaderCell())}>
                  Key Parameters
                </th>
                <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                  COB
                </th>
                <th rowSpan={2} className={cn('border border-white/20', fiHeaderCell())}>
                  {isSmall ? 'Recs' : 'Total Records'}
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
                const stripe = fiStickyStripeBg(periodIndex)

                if (!row) {
                  return [
                    <tr key={`${period}-missing`} className={cn(stripe, 'border-b-2 border-border')}>
                      <td
                        colSpan={METRIC_COLUMNS}
                        className={cn(fiMatrixDataCell(), 'text-left text-muted-foreground')}
                      >
                        —
                      </td>
                    </tr>,
                  ]
                }

                const avgColor = outperformanceColor(row.fund.avg >= row.benchmark.avg)
                const isLastPeriod = periodIndex === MATRIX_PERIODS.length - 1

                return [
                  <tr key={`${period}-fund`} className={stripe}>
                    <td
                      className={cn(
                        fiMatrixDataCell(),
                        'border-b border-dashed border-border/70 font-semibold',
                      )}
                      style={{ color: avgColor }}
                    >
                      {formatPercent(row.fund.avg)}
                    </td>
                    <td
                      className={cn(
                        fiMatrixDataCell(),
                        'border-b border-dashed border-border/70 font-medium',
                      )}
                      style={{ color: FUND_COLOR }}
                    >
                      {formatPercent(row.fund.max)}
                    </td>
                    <td
                      className={cn(
                        fiMatrixDataCell(),
                        'border-b border-dashed border-border/70 font-medium',
                      )}
                      style={{ color: FUND_COLOR }}
                    >
                      {formatPercent(row.fund.min)}
                    </td>
                    <td
                      className={cn(
                        fiMatrixDataCell(),
                        'border-b border-dashed border-border/70 font-medium',
                      )}
                      style={{ color: FUND_COLOR }}
                    >
                      {formatPercent(row.fund.stdDev)}
                    </td>
                    <td
                      rowSpan={2}
                      className={cn(
                        fiMatrixDataCell(),
                        'align-middle text-sm font-bold text-brand sm:text-base',
                        !isLastPeriod && 'border-b-2 border-border',
                      )}
                    >
                      {formatPercent(row.cob)}
                    </td>
                    <td
                      rowSpan={2}
                      className={cn(
                        fiMatrixDataCell(),
                        'align-middle text-sm font-bold text-foreground sm:text-base',
                        !isLastPeriod && 'border-b-2 border-border',
                      )}
                    >
                      {row.fund.count.toLocaleString()}
                    </td>
                  </tr>,
                  <tr
                    key={`${period}-index`}
                    className={cn(stripe, !isLastPeriod && 'border-b-2 border-border')}
                  >
                    <td className={fiMatrixDataCell()} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.avg)}
                    </td>
                    <td className={fiMatrixDataCell()} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.max)}
                    </td>
                    <td className={fiMatrixDataCell()} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.min)}
                    </td>
                    <td className={fiMatrixDataCell()} style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.stdDev)}
                    </td>
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </ScrollTable>
      )}

      {consistencyScore != null && !loading && !error && (
        <div className={APP_TABLE_SHELL_FOOTER}>
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
        <p
          className={cn(
            'break-words text-xs font-medium leading-snug sm:text-sm',
            seriesTextClass(variant),
          )}
          title={name}
        >
          {name}
        </p>
      </div>
    </div>
  )
}

function SeriesName({
  name,
  variant,
  compact,
}: {
  name: string
  variant: 'fund' | 'benchmark'
  compact?: boolean
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-background sm:h-2.5 sm:w-2.5"
        style={{ backgroundColor: seriesDotColor(variant) }}
        aria-hidden="true"
      />
      <p
        className={cn(
          'min-w-0 font-medium leading-snug',
          compact
            ? 'line-clamp-2 break-words text-[10px] sm:text-xs'
            : 'break-words text-xs sm:text-sm',
          seriesTextClass(variant),
        )}
        title={name}
      >
        {name}
      </p>
    </div>
  )
}
