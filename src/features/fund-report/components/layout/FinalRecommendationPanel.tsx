import { Check, Scale, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { VerdictBadge } from '../charts/ReportVisuals'
import type { FundReportAssessment } from '../../schemas'
import {
  explainVerdictTier,
  formatRuleMetric,
  qualityComponentsForDisplay,
} from '../../lib/verdictPresentation'

type FinalRecommendationPanelProps = {
  assessment: FundReportAssessment
}

function ScoreMeter({ label, value, max, tone }: { label: string; value: number; max: number; tone?: 'primary' | 'amber' | 'destructive' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">
          {value}
          <span className="text-xs">/{max}</span>
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          'h-2',
          tone === 'destructive' && '[&>div]:bg-destructive',
          tone === 'amber' && '[&>div]:bg-amber-500',
        )}
      />
    </div>
  )
}

export function FinalRecommendationPanel({ assessment }: FinalRecommendationPanelProps) {
  const { recommendation, goldenTriangle, qualityScore, prosCons } = assessment
  const tier = explainVerdictTier(goldenTriangle, qualityScore.score, recommendation.verdict)
  const components = qualityComponentsForDisplay(qualityScore.components)
  const gtPct = Math.round((goldenTriangle.passCount / 3) * 100)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-gradient-to-br from-muted/30 via-background to-muted/20 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Scale className="size-4" aria-hidden="true" />
              Final recommendation
            </div>
            <VerdictBadge
              verdict={recommendation.verdict}
              confidence={recommendation.confidencePercent}
            />
          </div>
          <div className="max-w-xl space-y-2 text-center lg:text-left">
            <p className="text-base font-semibold text-foreground">{tier.headline}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{recommendation.summary}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Scores considered
        </h4>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card/50 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">Golden Triangle</p>
                <p className="text-xs text-muted-foreground">Rolling return · COB · Sharpe vs benchmark</p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  goldenTriangle.passed
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
                )}
              >
                {goldenTriangle.overallRating}
              </span>
            </div>
            <ScoreMeter label="Rules passed" value={goldenTriangle.passCount} max={3} tone={gtPct >= 67 ? 'primary' : 'amber'} />
            <ul className="mt-4 space-y-2">
              {goldenTriangle.rules.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                    rule.passed
                      ? 'border-emerald-500/25 bg-emerald-500/5'
                      : 'border-red-500/25 bg-red-500/5',
                  )}
                >
                  {rule.passed ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{rule.label}</p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatRuleMetric(rule)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/50 p-4 sm:p-5">
            <div className="mb-4">
              <p className="font-semibold text-foreground">Fund quality score</p>
              <p className="text-xs text-muted-foreground">Weighted NAV-based quality components</p>
            </div>
            <ScoreMeter
              label="Overall quality"
              value={qualityScore.score}
              max={100}
              tone={qualityScore.score >= 60 ? 'primary' : qualityScore.score >= 45 ? 'amber' : 'destructive'}
            />
            <ul className="mt-4 space-y-2">
              {components.map((component) => (
                <li
                  key={component.name}
                  className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{component.name}</span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      {component.score}/100
                    </span>
                  </div>
                  <Progress value={component.score} className="mt-2 h-1.5" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-foreground">Why this verdict</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tier.explanation}</p>
        <ul className="mt-3 space-y-1.5">
          {tier.checks.map((check) => (
            <li key={check} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {check}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
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
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
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
