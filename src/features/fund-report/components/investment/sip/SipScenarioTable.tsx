import { ScrollTable } from '@/components/ui/scroll-table'
import { fiStickyLabelCell } from '@/components/fundsindia/tableStyles'
import { cn, formatPercent } from '@/lib/utils'
import type { SipScenario } from '../../../schemas'

type SipScenarioTableProps = {
  scenarios: SipScenario[]
  highlightAmount?: number | null
}

export function SipScenarioTable({ scenarios, highlightAmount = null }: SipScenarioTableProps) {
  if (scenarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No SIP scenario data available.</p>
  }

  return (
    <ScrollTable minWidth={960} className="rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className={cn('px-4 py-3', fiStickyLabelCell('normal-case'))}>Monthly SIP</th>
            <th className="px-4 py-3">Invested</th>
            <th className="px-4 py-3">Current value</th>
            <th className="px-4 py-3">Gain</th>
            <th className="px-4 py-3">XIRR</th>
            <th className="px-4 py-3">Tax payable</th>
            <th className="px-4 py-3">Post-tax XIRR</th>
            <th className="px-4 py-3">10Y projection</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const stcg = s.stcg ?? 0
            const ltcg = s.ltcg ?? 0
            const totalTax = stcg + ltcg
            const highlighted = highlightAmount != null && s.monthlyAmount === highlightAmount
            return (
              <tr
                key={s.monthlyAmount}
                className={cn(
                  'border-b border-border/40 last:border-0',
                  highlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/25',
                )}
              >
                <td className={cn('px-4 py-3 font-medium', fiStickyLabelCell())}>
                  ₹{s.monthlyAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.moneyInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +₹{s.totalGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{s.xirr.toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <span className="block font-mono font-medium tabular-nums text-amber-700 dark:text-amber-400">
                    −₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    STCG ₹{stcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · LTCG ₹
                    {ltcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatPercent(s.postTaxXirr ?? 0, 1)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.projectedValue10Y.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}
