import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FundIndexComparison } from '@/api/schemas'
import { CHART_COLORS, TABLE_HEAD_CLASS, TABLE_SUBHEAD_CLASS, outperformanceColor } from '@/lib/chartColors'
import { MATRIX_PERIODS } from '@/lib/constants'
import { formatPercent } from '@/lib/utils'

const FUND_COLOR = CHART_COLORS.fund
const BENCHMARK_COLOR = CHART_COLORS.benchmark
const DATA_COLUMNS = 4
const TOTAL_COLUMNS = 7

interface FundIndexMatrixTableProps {
  data: FundIndexComparison | null
  loading: boolean
  error: string | null
}

export function FundIndexMatrixTable({ data, loading, error }: FundIndexMatrixTableProps) {
  const computedAt = data?.computedAt

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-brand">Rolling Returns</h2>
          {data?.fundName && (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
              {data.fundName}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Fund vs index comparison across rolling periods
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
        <div className="overflow-x-auto border-t border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead
                  rowSpan={2}
                  className={`sticky left-0 z-10 min-w-[240px] text-left ${TABLE_HEAD_CLASS}`}
                >
                  Year
                </TableHead>
                <TableHead colSpan={DATA_COLUMNS} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  Key Parameters
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  COB
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  Total Records
                </TableHead>
              </TableRow>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className={TABLE_SUBHEAD_CLASS}>AVG</TableHead>
                <TableHead className={TABLE_SUBHEAD_CLASS}>MAX</TableHead>
                <TableHead className={TABLE_SUBHEAD_CLASS}>MIN</TableHead>
                <TableHead className={TABLE_SUBHEAD_CLASS}>STD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX_PERIODS.flatMap((period, periodIndex) => {
                const row = data?.rows.find((entry) => entry.period === period)
                if (!row) {
                  const missing = data?.missingPeriods.includes(period)
                  return [
                    <TableRow key={`${period}-missing`} className="bg-muted/20">
                      <TableCell
                        colSpan={TOTAL_COLUMNS}
                        className="sticky left-0 z-10 bg-muted/20 py-3 text-sm text-muted-foreground"
                      >
                        {period} — {missing ? 'insufficient history' : 'loading...'}
                      </TableCell>
                    </TableRow>,
                  ]
                }

                const avgColor = outperformanceColor(row.fund.avg >= row.benchmark.avg)
                const stripe = periodIndex % 2 === 0 ? 'bg-background/60' : 'bg-muted/10'

                return [
                  <TableRow key={`${period}-fund`} className={stripe}>
                    <TableCell rowSpan={2} className={`sticky left-0 z-10 ${stripe} align-top font-medium`}>
                      <div className="text-sm font-semibold">{period}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{row.fundName}</div>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium" style={{ color: avgColor }}>
                      {formatPercent(row.fund.avg)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.max)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.min)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: FUND_COLOR }}>
                      {formatPercent(row.fund.stdDev)}
                    </TableCell>
                    <TableCell rowSpan={2} className="align-middle text-center tabular-nums font-semibold text-brand">
                      {formatPercent(row.cob)}
                    </TableCell>
                    <TableCell rowSpan={2} className="align-middle text-center tabular-nums">
                      {row.totalRecords.toLocaleString()}
                    </TableCell>
                  </TableRow>,
                  <TableRow key={`${period}-index`} className={stripe}>
                    <TableCell className="tabular-nums" style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.avg)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.max)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.min)}
                    </TableCell>
                    <TableCell className="tabular-nums" style={{ color: BENCHMARK_COLOR }}>
                      {formatPercent(row.benchmark.stdDev)}
                    </TableCell>
                  </TableRow>,
                ]
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
