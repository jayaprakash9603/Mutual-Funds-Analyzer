import { Loader2 } from 'lucide-react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { INSIDE_CARD_TABLE_CLASS } from '@/lib/charts/chartSurface'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FI_TABLE, fiStickyStripeBg } from '@/components/fundsindia/tableStyles'
import type { PeerComparison } from '@/features/fund-report/schemas'
import { CHART_COLORS, TABLE_HEAD_CLASS, TABLE_SUBHEAD_CLASS, cobColor } from '@/lib/charts/chartColors'
import { shortSchemeLabel } from '@/lib/funds/shortSchemeLabel'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PeerLongRunAnalysisTable } from './PeerLongRunAnalysisTable'
import { ReportInsightCard } from '../layout/ReportInsightCard'

interface PeerComparisonTableProps {
  data: PeerComparison | null
  loading: boolean
  error?: string | null
}

function statColor(value: number, invert = false) {
  if (value < 0) return CHART_COLORS.red
  if (invert) return CHART_COLORS.benchmark
  return CHART_COLORS.fund
}

const FUND_COL =
  'min-w-[7.5rem] max-w-[9.5rem] border-r px-1.5 py-1.5 text-left align-middle sm:min-w-[11rem] sm:max-w-[14rem] sm:px-3'
const ROW_MIN = 'min-h-[2.75rem]'

export function PeerComparisonTable({ data, loading, error }: PeerComparisonTableProps) {
  const isSmall = useIsSmallScreen()
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-6 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading peer comparison…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-6 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!data || data.peers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
        No peer funds loaded yet.
      </div>
    )
  }

  const fundPane = (
    <table className={FI_TABLE}>
      <thead>
        <tr>
          <th className={cn(FUND_COL, TABLE_HEAD_CLASS, 'font-semibold normal-case')}>Fund</th>
        </tr>
        <tr>
          <th className={cn(FUND_COL, TABLE_SUBHEAD_CLASS)} aria-hidden="true">
            &nbsp;
          </th>
        </tr>
      </thead>
      <tbody>
        {data.peers.map((peer, index) => {
          const stripe = fiStickyStripeBg(index)
          return (
            <tr
              key={peer.scheme}
              className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}
            >
              <td
                className={cn(FUND_COL, ROW_MIN, stripe, 'text-[11px] font-semibold leading-snug sm:text-sm')}
                title={peer.scheme}
              >
                <span className="line-clamp-2">
                  {shortSchemeLabel(peer.scheme, isSmall)}
                  {peer.selected ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-brand sm:text-xs">
                      Selected
                    </span>
                  ) : null}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeerLongRunAnalysisTable data={data} compact={isSmall} />

      <ReportInsightCard
        title="Category peers"
        subtitle={`${data.periodLabel} rolling windows (investt.in average)`}
        callout={
          data.highlights.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.highlights.map((highlight) => (
                <Badge key={highlight} variant="secondary" className="font-normal">
                  {highlight}
                </Badge>
              ))}
            </div>
          ) : null
        }
      >
        <ScrollTable
          pinnedLeading={fundPane}
          minWidth={isSmall ? 480 : 720}
          className={INSIDE_CARD_TABLE_CLASS}
        >
          <Table>
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead colSpan={4} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  {isSmall ? 'Params' : 'Key Parameters'}
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  COB
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  {isSmall ? 'Recs' : 'Total Records'}
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  Sharpe
                </TableHead>
                <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                  Max DD
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
              {data.peers.map((peer, index) => {
                const stripe = fiStickyStripeBg(index)
                return (
                  <TableRow
                    key={peer.scheme}
                    className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}
                  >
                    <TableCell
                      className={cn(ROW_MIN, 'tabular-nums font-semibold')}
                      style={{ color: statColor(peer.average) }}
                    >
                      {formatPercent(peer.average)}
                    </TableCell>
                    <TableCell
                      className={cn(ROW_MIN, 'tabular-nums font-medium')}
                      style={{ color: CHART_COLORS.fund }}
                    >
                      {formatPercent(peer.maximum)}
                    </TableCell>
                    <TableCell
                      className={cn(ROW_MIN, 'tabular-nums font-medium')}
                      style={{ color: statColor(peer.minimum) }}
                    >
                      {formatPercent(peer.minimum)}
                    </TableCell>
                    <TableCell className={cn(ROW_MIN, 'tabular-nums text-muted-foreground')}>
                      {formatPercent(peer.stdDev)}
                    </TableCell>
                    <TableCell
                      className={cn(ROW_MIN, 'text-center tabular-nums font-semibold')}
                      style={{ color: cobColor(peer.cob) }}
                    >
                      {formatPercent(peer.cob)}
                    </TableCell>
                    <TableCell className={cn(ROW_MIN, 'text-center tabular-nums')}>
                      {peer.totalRecords.toLocaleString()}
                    </TableCell>
                    <TableCell className={cn(ROW_MIN, 'text-center tabular-nums font-medium')}>
                      {peer.sharpe.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(ROW_MIN, 'text-center tabular-nums font-medium')}
                      style={{ color: statColor(peer.maxDrawdown, true) }}
                    >
                      {formatPercent(peer.maxDrawdown)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollTable>
      </ReportInsightCard>
    </div>
  )
}
