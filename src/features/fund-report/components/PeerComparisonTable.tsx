import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { PeerComparison } from '@/features/fund-report/schemas'
import { CHART_COLORS, TABLE_HEAD_CLASS, TABLE_SUBHEAD_CLASS, cobColor } from '@/lib/chartColors'
import { formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

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

export function PeerComparisonTable({ data, loading, error }: PeerComparisonTableProps) {
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

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-brand">Category peers</h3>
          <Badge variant="outline" className="border-brand/30 text-brand">
            {data.periodLabel} rolling windows
          </Badge>
        </div>
        {data.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.highlights.map((highlight) => (
              <Badge key={highlight} variant="secondary" className="font-normal">
                {highlight}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead rowSpan={2} className={`sticky left-0 z-10 min-w-[240px] text-left ${TABLE_HEAD_CLASS}`}>
                Fund
              </TableHead>
              <TableHead colSpan={4} className={`text-center ${TABLE_HEAD_CLASS}`}>
                Key Parameters
              </TableHead>
              <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                COB
              </TableHead>
              <TableHead rowSpan={2} className={`text-center ${TABLE_HEAD_CLASS}`}>
                Total Records
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
              const stripe = index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              return (
                <TableRow
                  key={peer.scheme}
                  className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}
                >
                  <TableCell className={cn('sticky left-0 z-10 min-w-[240px] bg-inherit align-top', stripe)}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-snug">{peer.scheme}</div>
                        {peer.selected && (
                          <div className="mt-1 text-xs font-medium text-brand">Selected fund</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold" style={{ color: statColor(peer.average) }}>
                    {formatPercent(peer.average)}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium" style={{ color: CHART_COLORS.fund }}>
                    {formatPercent(peer.maximum)}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium" style={{ color: statColor(peer.minimum) }}>
                    {formatPercent(peer.minimum)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatPercent(peer.stdDev)}</TableCell>
                  <TableCell
                    className="text-center tabular-nums font-semibold"
                    style={{ color: cobColor(peer.cob) }}
                  >
                    {formatPercent(peer.cob)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{peer.totalRecords.toLocaleString()}</TableCell>
                  <TableCell className="text-center tabular-nums font-medium">{peer.sharpe.toFixed(2)}</TableCell>
                  <TableCell
                    className="text-center tabular-nums font-medium"
                    style={{ color: statColor(peer.maxDrawdown, true) }}
                  >
                    {formatPercent(peer.maxDrawdown)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
