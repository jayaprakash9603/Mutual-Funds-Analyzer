import { ScrollTable } from '@/components/ui/scroll-table'
import { fiStickyLabelCell } from '@/components/fundsindia/tableStyles'
import { cn } from '@/lib/utils'
import type { FundReportInvestment } from '../../../schemas'

type LumpsumScenario = FundReportInvestment['lumpsum']['scenarios'][number]

type LumpsumScenarioTableProps = {
  scenarios: LumpsumScenario[]
  highlightPrincipal?: number | null
}

export function LumpsumScenarioTable({
  scenarios,
  highlightPrincipal = null,
}: LumpsumScenarioTableProps) {
  if (scenarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No lump sum scenario data available.</p>
  }

  return (
    <ScrollTable minWidth={720} className="rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className={cn('px-4 py-3', fiStickyLabelCell('normal-case'))}>Principal</th>
            <th className="px-4 py-3">Current value</th>
            <th className="px-4 py-3">Gain</th>
            <th className="px-4 py-3">CAGR</th>
            <th className="px-4 py-3">Multiplier</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => {
            const highlighted = highlightPrincipal != null && scenario.principal === highlightPrincipal
            return (
              <tr
                key={scenario.principal}
                className={cn(
                  'border-b border-border/40 last:border-0',
                  highlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/25',
                )}
              >
                <td className={cn('px-4 py-3 font-medium', fiStickyLabelCell())}>
                  ₹{scenario.principal.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{scenario.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +₹{scenario.gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{scenario.cagr.toFixed(1)}%</td>
                <td className="px-4 py-3 font-mono tabular-nums">{scenario.moneyMultiplied.toFixed(2)}x</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}
