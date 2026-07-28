import { ScrollTable } from '@/components/ui/scroll-table'
import { fiStickyLabelCell } from '@/components/fundsindia/tableStyles'
import { cn, formatPercent } from '@/lib/utils'
import type { StepUpMode, StepUpSipScenario } from '../../../schemas'

type StepUpSipScenarioTableProps = {
  scenarios: StepUpSipScenario[]
  stepUpMode: StepUpMode
  highlightInitialAmount?: number | null
}

function formatStepUp(mode: StepUpMode, value: number): string {
  return mode === 'PERCENT' ? `${value}%/yr` : `+₹${value.toLocaleString('en-IN')}/yr`
}

export function StepUpSipScenarioTable({
  scenarios,
  stepUpMode,
  highlightInitialAmount = null,
}: StepUpSipScenarioTableProps) {
  if (scenarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No Step Up SIP scenario data available.</p>
  }

  return (
    <ScrollTable minWidth={1100} className="rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className={cn('px-4 py-3', fiStickyLabelCell('normal-case'))}>Initial SIP</th>
            <th className="px-4 py-3">Current SIP</th>
            <th className="px-4 py-3">Step-up</th>
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
            const highlighted =
              highlightInitialAmount != null && s.initialMonthlyAmount === highlightInitialAmount
            return (
              <tr
                key={s.initialMonthlyAmount}
                className={cn(
                  'border-b border-border/40 last:border-0',
                  highlighted && 'bg-primary/5 ring-1 ring-inset ring-primary/25',
                )}
              >
                <td className={cn('px-4 py-3 font-medium', fiStickyLabelCell())}>
                  ₹{s.initialMonthlyAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.currentMonthlyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatStepUp(s.stepUpMode ?? stepUpMode, s.stepUpValue)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.moneyInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  ₹{s.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  ₹{s.totalGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatPercent(s.xirr)}</td>
                <td className="px-4 py-3 font-mono tabular-nums text-amber-700 dark:text-amber-400">
                  −₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    STCG ₹{stcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · LTCG ₹
                    {ltcg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatPercent(s.postTaxXirr ?? 0)}
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
