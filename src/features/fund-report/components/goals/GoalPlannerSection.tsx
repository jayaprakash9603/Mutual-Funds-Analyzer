import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import { SectionShell } from '../layout/SectionShell'
import type { FundReportPerformance } from '../../schemas'
import { TargetAmountTable } from './TargetAmountTable'
import { DoublingTimeChart } from './DoublingTimeChart'
import { RequiredCagrGrid } from './RequiredCagrGrid'
import { SavingsRateTable } from './SavingsRateTable'
import { IncrementalCroreTable } from './IncrementalCroreTable'
import { StepUpMilestoneChart } from './StepUpMilestoneChart'

const CAGR_PRESETS = [8, 10, 12, 15] as const
const SIP_PRESETS = [10_000, 30_000, 50_000, 70_000] as const
const STEP_UP_PRESETS = [0, 5, 10] as const
const HORIZON_PRESETS = [20, 25, 30] as const

function resolveDefaultCagr(performance?: FundReportPerformance): number {
  const sinceInception = performance?.trailingReturns.periods.find((period) =>
    /since inception|all/i.test(period.label),
  )
  if (sinceInception && sinceInception.cagr > 0) {
    return Math.round(sinceInception.cagr * 10) / 10
  }
  return 12
}

export function GoalPlannerSection({
  performance,
}: {
  performance?: FundReportPerformance
}) {
  const defaultCagr = resolveDefaultCagr(performance)
  const [cagrPercent, setCagrPercent] = useState(defaultCagr)
  const [monthlySip, setMonthlySip] = useState(50_000)
  const [stepUpPercent, setStepUpPercent] = useState(10)
  const [horizonYears, setHorizonYears] = useState(25)

  const assumptions = useMemo(
    () => ({ cagrPercent, monthlySip, stepUpPercent, horizonYears }),
    [cagrPercent, horizonYears, monthlySip, stepUpPercent],
  )

  return (
    <SectionShell
      id="goal-planner"
      variant="stack"
      title="Goal Planners"
      description="FundsIndia-style compounding planners using editable CAGR and SIP assumptions."
    >
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
        <AssumptionSelect
          id="goal-cagr"
          label="Expected CAGR"
          value={String(cagrPercent)}
          onChange={(value) => setCagrPercent(Number.parseFloat(value))}
          options={CAGR_PRESETS.map((value) => ({ value: String(value), label: `${value}%` }))}
        />
        <AssumptionSelect
          id="goal-sip"
          label="Monthly SIP"
          value={String(monthlySip)}
          onChange={(value) => setMonthlySip(Number.parseInt(value, 10))}
          options={SIP_PRESETS.map((value) => ({
            value: String(value),
            label: `₹${value.toLocaleString('en-IN')}`,
          }))}
        />
        <AssumptionSelect
          id="goal-step-up"
          label="Annual SIP step-up"
          value={String(stepUpPercent)}
          onChange={(value) => setStepUpPercent(Number.parseFloat(value))}
          options={STEP_UP_PRESETS.map((value) => ({ value: String(value), label: `${value}%` }))}
        />
        <AssumptionSelect
          id="goal-horizon"
          label="Horizon"
          value={String(horizonYears)}
          onChange={(value) => setHorizonYears(Number.parseInt(value, 10))}
          options={HORIZON_PRESETS.map((value) => ({
            value: String(value),
            label: `${value} years`,
          }))}
        />
      </div>

      <ReportInsightCard title="How to reach your target amount">
        <TargetAmountTable cagrPercent={assumptions.cagrPercent} stepUpPercent={assumptions.stepUpPercent} />
      </ReportInsightCard>

      <ReportInsightCard title="Years to double your money">
        <DoublingTimeChart />
      </ReportInsightCard>

      <ReportInsightCard title="Required CAGR to multiply your investment">
        <RequiredCagrGrid />
      </ReportInsightCard>

      <ReportInsightCard title="Portfolio growth vs annual expenses">
        <SavingsRateTable cagrPercent={assumptions.cagrPercent} />
      </ReportInsightCard>

      <ReportInsightCard title="The first crore is the hardest">
        <IncrementalCroreTable cagrPercent={assumptions.cagrPercent} />
      </ReportInsightCard>

      <ReportInsightCard title="Step-up SIP milestone journey">
        <StepUpMilestoneChart
          monthlySip={assumptions.monthlySip}
          stepUpPercent={assumptions.stepUpPercent}
          cagrPercent={assumptions.cagrPercent}
          horizonYears={assumptions.horizonYears}
        />
      </ReportInsightCard>
    </SectionShell>
  )
}

function AssumptionSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
