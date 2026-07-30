import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerdictBadge } from '../charts/ReportVisuals'
import type { FundReportAssessment } from '../../schemas'
import { explainVerdictTier, formatRuleMetric } from '../../lib/verdictPresentation'

type RiskVerdictSummaryProps = {
  assessment: FundReportAssessment
}

export function RiskVerdictSummary({ assessment }: RiskVerdictSummaryProps) {
  const { recommendation, goldenTriangle, qualityScore, prosCons } = assessment
  const tier = explainVerdictTier(goldenTriangle, qualityScore.score, recommendation.verdict)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <VerdictBadge
          verdict={recommendation.verdict}
          confidence={recommendation.confidencePercent}
          variant="inline"
        />
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{tier.explanation}</p>
      </div>

      <div className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">Golden Triangle</p>
            <p className="text-xs text-muted-foreground">Fund vs benchmark on three core rules</p>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
              goldenTriangle.passed
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
            )}
          >
            {goldenTriangle.passCount}/3 passed · {goldenTriangle.overallRating}
          </span>
        </div>
        <ul className="space-y-2">
          {goldenTriangle.rules.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm',
                rule.passed ? 'bg-emerald-500/8' : 'bg-red-500/8',
              )}
            >
              {rule.passed ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-foreground">{rule.label}</p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatRuleMetric(rule)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-6 sm:gap-3">
        <div className="rounded-lg bg-emerald-500/8 px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Supporting factors
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground">
            {prosCons.pros.slice(0, 3).map((pro) => (
              <li key={pro} className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-red-500/8 px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Risks to weigh
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground">
            {prosCons.cons.slice(0, 3).map((con) => (
              <li key={con} className="flex gap-2">
                <X className="mt-0.5 size-3.5 shrink-0 text-red-600" aria-hidden="true" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
