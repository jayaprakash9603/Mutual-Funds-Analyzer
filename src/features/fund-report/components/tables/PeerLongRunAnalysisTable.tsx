import { ScrollTable } from '@/components/ui/scroll-table'
import { INSIDE_CARD_TABLE_CLASS } from '@/lib/charts/chartSurface'
import type { PeerComparison } from '@/features/fund-report/schemas'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  FI_TABLE,
  fiBodyCell,
  fiHeaderCell,
  fiMultiplyHeaderCell,
  fiStickyStripeBg,
  fiSubHeaderCell,
} from '@/components/fundsindia/tableStyles'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { shortSchemeLabel } from '@/lib/funds/shortSchemeLabel'
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

const SCHEME_COL =
  'min-w-[7.5rem] max-w-[9.5rem] border-r px-1.5 py-1.5 text-left align-middle sm:min-w-[11rem] sm:max-w-[14rem] sm:px-2.5 sm:py-2'
const ROW_MIN = 'min-h-[2.75rem]'

export function PeerLongRunAnalysisTable({
  data,
  horizons: horizonsOverride,
  compact = false,
}: PeerLongRunAnalysisTableProps) {
  const isSmall = useIsSmallScreen()
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
          Usually because rolling return data is unavailable from investt.in for one or more schemes.
        </p>
      </ReportInsightCard>
    )
  }

  const asOfSuffix = analysis?.asOfDate ? ` (as on ${analysis.asOfDate})` : ''
  const asOfHeader = isSmall ? 'Scheme' : `Scheme${asOfSuffix}`
  const metricsMinWidth = compact ? (isSmall ? 420 : 560) : 800

  const schemePane = (
    <table className={FI_TABLE}>
      <thead>
        <tr>
          <th
            className={cn(fiHeaderCell(), SCHEME_COL, 'normal-case')}
            title={asOfSuffix ? `Scheme${asOfSuffix}` : 'Scheme'}
          >
            {asOfHeader}
          </th>
        </tr>
        <tr>
          <th className={cn(fiSubHeaderCell(), SCHEME_COL)} aria-hidden="true">
            &nbsp;
          </th>
        </tr>
      </thead>
      <tbody>
        {data.peers.map((peer, index) => {
          const stripe = fiStickyStripeBg(index)
          const schemeLabel = shortSchemeLabel(peer.scheme, isSmall)
          return (
            <tr
              key={peer.scheme}
              className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}
            >
              <td className={cn(SCHEME_COL, ROW_MIN, stripe, 'text-[11px] font-semibold leading-snug sm:text-sm')} title={peer.scheme}>
                <span className="line-clamp-2">
                  {schemeLabel}
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
      footer="Horizons show the average rolling return from investt.in for each holding period. Money multiplied is derived from that average CAGR."
    >
      <ScrollTable
        pinnedLeading={schemePane}
        minWidth={metricsMinWidth}
        className={INSIDE_CARD_TABLE_CLASS}
      >
        <table className={FI_TABLE}>
          <thead>
            <tr>
              <th colSpan={horizons.length} className={fiHeaderCell()}>
                {isSmall ? 'CAGR (%)' : 'Compounded Annualized Returns (%)'}
              </th>
              <th colSpan={horizons.length} className={fiMultiplyHeaderCell()}>
                {isSmall ? 'Money ×' : 'No of Times Your Money Multiplied'}
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
              const stripe = fiStickyStripeBg(index)
              return (
                <tr
                  key={peer.scheme}
                  className={cn(stripe, peer.selected && 'ring-1 ring-inset ring-brand/40')}
                >
                  {horizons.map((label) => {
                    const row = byLabel.get(label)
                    const value = row?.cagrPercent
                    return (
                      <td
                        key={`${peer.scheme}-cagr-${label}`}
                        className={cn(
                          fiBodyCell(),
                          ROW_MIN,
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
                          ROW_MIN,
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
