import { ScrollTable } from '@/components/ui/scroll-table'
import type { PeerComparison } from '@/features/fund-report/schemas'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  FI_TABLE,
  fiBodyCell,
  fiHeaderCell,
  fiMultiplyHeaderCell,
  fiStickyYearCell,
  fiSubHeaderCell,
} from '@/components/fundsindia/tableStyles'
import { cn, formatPercent } from '@/lib/utils'
import { ReportInsightCard } from '../layout/ReportInsightCard'

type PeerLongRunAnalysisTableProps = {
  data: PeerComparison
  horizons?: string[]
  compact?: boolean
}

const DEFAULT_HORIZONS = ['1 Year', '3 Year', '5 Year', '10 Year', '15 Year', '20 Year']
const PRIMARY_HORIZONS = ['1 Year', '3 Year', '5 Year']

function shortHorizon(label: string): string {
  return label.replace(' Year', 'Y')
}

function formatMultiple(value: number): string {
  if (value >= 10) return `${value.toFixed(0)}x`
  return `${value.toFixed(1)}x`
}

function cagrCellClass(label: string, value: number | null | undefined): string {
  if (value == null) return 'text-muted-foreground'
  const base = value < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
  if (label === '15 Year' || label === '20 Year') {
    return cn(base, 'font-bold')
  }
  return base
}

function isTwentyYearColumn(label: string): boolean {
  return label === '20 Year'
}

function isPrimaryHorizon(label: string): boolean {
  return PRIMARY_HORIZONS.includes(label)
}

export function PeerLongRunAnalysisTable({
  data,
  horizons: horizonsOverride,
  compact = false,
}: PeerLongRunAnalysisTableProps) {
  const analysis = data.longRunAnalysis
  const allHorizons = analysis?.horizonLabels?.length ? analysis.horizonLabels : DEFAULT_HORIZONS
  const baseHorizons = horizonsOverride?.length ? horizonsOverride : allHorizons
  const horizons = compact
    ? PRIMARY_HORIZONS.filter((label) => baseHorizons.includes(label))
    : baseHorizons
  const hasHorizonData = data.peers.some((peer) =>
    peer.horizonReturns.some(
      (h) => horizons.includes(h.label) && (h.cagrPercent != null || h.moneyMultiplied != null),
    ),
  )

  if (!hasHorizonData) {
    if (compact) {
      return null
    }
    return (
      <ReportInsightCard
        title="1Y, 3Y & 5Y compounded returns across category peers"
        subtitle="Trailing horizon returns could not be loaded for these peers."
      >
        <p className="text-sm text-muted-foreground">
          Usually because NAV history is unavailable for one or more schemes.
        </p>
      </ReportInsightCard>
    )
  }

  const asOfSuffix = analysis?.asOfDate ? ` (as on ${analysis.asOfDate})` : ''
  const tableMinWidth = compact ? 720 : 960

  return (
    <ReportInsightCard
      title={
        compact
          ? '1Y, 3Y & 5Y compounded returns across category peers'
          : 'Many well-managed category funds have outperformed over the long run'
      }
      subtitle={
        compact ? (
          <>
            Short-horizon CAGR and money multiplication for {analysis?.categoryLabel ?? 'category peers'}
            {asOfSuffix} — the first three standard holding periods.
          </>
        ) : (
          <>
            Compounded annualized returns and money multiplication for{' '}
            {analysis?.categoryLabel ?? 'category peers'}
            {asOfSuffix}. The first three horizons (1Y, 3Y, 5Y) show near-term compounding; longer
            windows highlight sustained outperformance.
          </>
        )
      }
      footer="Horizons with insufficient NAV history show an em dash. Figures use trailing compounded returns from each fund's latest NAV."
    >
      <ScrollTable minWidth={tableMinWidth} className="rounded-xl border border-border/60 bg-background">
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th rowSpan={2} className={fiStickyYearCell('min-w-[240px] align-middle')}>
                Scheme{asOfSuffix}
              </th>
              <th colSpan={horizons.length} className={fiHeaderCell()}>
                Compounded Annualized Returns (%)
              </th>
              <th colSpan={horizons.length} className={fiMultiplyHeaderCell()}>
                No of Times Your Money Multiplied
              </th>
            </tr>
            <tr>
              {horizons.map((label) => (
                <th
                  key={`cagr-${label}`}
                  className={cn(
                    fiSubHeaderCell(),
                    isPrimaryHorizon(label) && 'bg-brand/95 ring-1 ring-inset ring-white/25',
                    isTwentyYearColumn(label) && 'ring-2 ring-inset ring-sky-400/80',
                  )}
                >
                  {shortHorizon(label)}
                </th>
              ))}
              {horizons.map((label) => (
                <th
                  key={`mult-${label}`}
                  className={cn(
                    fiMultiplyHeaderCell('text-[11px]'),
                    isPrimaryHorizon(label) && 'bg-emerald-700/95 ring-1 ring-inset ring-white/20',
                    isTwentyYearColumn(label) && 'ring-2 ring-inset ring-sky-400/80',
                  )}
                >
                  {shortHorizon(label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.peers.map((peer, index) => {
              const byLabel = new Map(peer.horizonReturns.map((row) => [row.label, row]))
              const stripe = index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              return (
                <tr key={peer.scheme} className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}>
                  <td className={cn(fiStickyYearCell(), stripe)}>
                    <div className="text-sm font-semibold leading-snug">{peer.scheme}</div>
                    {peer.selected ? (
                      <div className="mt-1 text-xs font-medium text-brand">Selected fund</div>
                    ) : null}
                  </td>
                  {horizons.map((label) => {
                    const row = byLabel.get(label)
                    const value = row?.cagrPercent
                    return (
                      <td
                        key={`${peer.scheme}-cagr-${label}`}
                        className={cn(
                          fiBodyCell(),
                          cagrCellClass(label, value),
                          isPrimaryHorizon(label) && 'bg-brand/5 font-semibold',
                          isTwentyYearColumn(label) && 'ring-2 ring-inset ring-sky-400/50',
                        )}
                      >
                        {value == null ? '—' : formatPercent(value, 1)}
                      </td>
                    )
                  })}
                  {horizons.map((label) => {
                    const row = byLabel.get(label)
                    const value = row?.moneyMultiplied
                    return (
                      <td
                        key={`${peer.scheme}-mult-${label}`}
                        className={cn(
                          fiBodyCell('font-medium text-emerald-800 dark:text-emerald-300'),
                          isPrimaryHorizon(label) && 'bg-emerald-50/80 font-semibold dark:bg-emerald-950/20',
                          (label === '15 Year' || label === '20 Year') && 'font-bold',
                          isTwentyYearColumn(label) && 'ring-2 ring-inset ring-sky-400/50',
                        )}
                      >
                        {value == null ? '—' : formatMultiple(value)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollTable>

      {analysis?.twentyYearCagrLow != null && analysis.twentyYearCagrHigh != null ? (
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold" style={{ color: CHART_COLORS.fund }}>
              ~{formatPercent(analysis.twentyYearCagrLow, 0)} to{' '}
              {formatPercent(analysis.twentyYearCagrHigh, 0)}
            </span>{' '}
            CAGR over 20 years across peers with sufficient history
          </p>
          {analysis.twentyYearMultiplyLow != null && analysis.twentyYearMultiplyHigh != null ? (
            <p>
              <span className="font-semibold" style={{ color: CHART_COLORS.fund }}>
                ~{formatMultiple(analysis.twentyYearMultiplyLow)} to{' '}
                {formatMultiple(analysis.twentyYearMultiplyHigh)}
              </span>{' '}
              money multiplied over 20 years
            </p>
          ) : null}
        </div>
      ) : null}
    </ReportInsightCard>
  )
}
