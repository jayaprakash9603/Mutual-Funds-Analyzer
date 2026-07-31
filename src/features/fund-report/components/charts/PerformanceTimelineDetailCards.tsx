import { Check, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'
import { Badge } from '@/components/ui/badge'
import { appMetricCardClasses, appHighlightCard } from '@/lib/ui/appCardStyles'
import { cn, formatPercent } from '@/lib/utils'
import type {
  PerformanceMilestone,
  PerformanceTimelineSummary,
} from '@/lib/analytics/performanceTimelineAnalysis'
import { MetricTile } from '../layout/SectionShell'

const MILESTONE_ACCENT: Record<
  PerformanceMilestone['kind'],
  { border: string; badge: 'default' | 'secondary' | 'success' | 'danger' }
> = {
  inception: { border: 'border-blue-500/30 bg-blue-500/5', badge: 'secondary' },
  best: { border: 'border-emerald-500/30 bg-emerald-500/5', badge: 'success' },
  worst: { border: 'border-red-500/30 bg-red-500/5', badge: 'danger' },
  mid: { border: 'border-amber-500/30 bg-amber-500/5', badge: 'secondary' },
  latest: { border: 'border-violet-500/30 bg-violet-500/5', badge: 'default' },
}

function formatSigned(value: number, suffix = '%') {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}${suffix}`
}

function MilestoneDetailCard({ milestone, index }: { milestone: PerformanceMilestone; index: number }) {
  const accent = MILESTONE_ACCENT[milestone.kind]
  const returnTone =
    milestone.kind === 'worst'
      ? 'text-red-600 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400'

  return (
    <article
      className={cn(
        appMetricCardClasses('md'),
        'flex h-full flex-col gap-3 border',
        accent.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
            {milestone.dateLabel}
          </p>
          <h4 className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
            {index + 1}. {milestone.title}
          </h4>
        </div>
        <Badge variant={accent.badge} className="shrink-0 text-[10px] capitalize sm:text-xs">
          {milestone.kind.replace('-', ' ')}
        </Badge>
      </div>

      <p className={cn('text-2xl font-bold tabular-nums sm:text-3xl', returnTone)}>
        {formatPercent(milestone.fundReturn)}
      </p>

      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{milestone.explanation}</p>

      <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          Window calculation
        </p>
        <p className="font-mono text-[11px] leading-relaxed text-foreground sm:text-xs">
          {milestone.windowRange}
        </p>
        <AppMetricGrid variant="nested" className="mt-2">
          <MetricTile
            size="sm"
            label="Benchmark"
            value={formatPercent(milestone.benchmarkReturn)}
            hint="Same rolling window on the index"
          />
          <MetricTile
            size="sm"
            label="Alpha"
            value={formatSigned(milestone.alpha)}
            hint="Fund minus benchmark return"
          />
          <MetricTile
            size="sm"
            label="Vs series avg"
            value={formatSigned(milestone.vsSeriesAverage)}
            hint="Compared to all windows in this period"
          />
          <MetricTile
            size="sm"
            label="Beat benchmark"
            value={milestone.beatBenchmark ? 'Yes' : 'No'}
            valueVariant="text"
            hint="Fund return ≥ benchmark for this window"
          />
        </AppMetricGrid>
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
          <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <p className="text-muted-foreground">NAV at start</p>
            <p className="font-mono font-medium tabular-nums">₹{milestone.navAtStart.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <p className="text-muted-foreground">NAV at end</p>
            <p className="font-mono font-medium tabular-nums">₹{milestone.navAtEnd.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function PerformanceTimelineDetailCards({ milestones }: { milestones: PerformanceMilestone[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {milestones.map((milestone, index) => (
        <MilestoneDetailCard key={milestone.kind} milestone={milestone} index={index} />
      ))}
    </div>
  )
}

export function PerformanceTimelineSummaryStrip({
  fundName,
  benchmarkName,
  summary,
}: {
  fundName: string
  benchmarkName: string
  summary: PerformanceTimelineSummary
}) {
  return (
    <div className="space-y-4">
      <AppMetricGrid variant="compact">
        <MetricTile
          label={`${summary.period} windows`}
          value={String(summary.windowCount)}
          hint="Rolling windows aligned with benchmark dates"
        />
        <MetricTile
          label="Fund average"
          value={formatPercent(summary.fundAverage)}
          hint={`Mean ${summary.period} rolling return across history`}
        />
        <MetricTile
          label="Best vs worst"
          value={formatPercent(summary.spread)}
          hint={`Range from ${formatPercent(summary.fundWorst)} to ${formatPercent(summary.fundBest)}`}
        />
        <MetricTile
          label="Beat benchmark"
          value={`${summary.beatBenchmarkPct.toFixed(0)}%`}
          hint="Share of windows where fund matched or beat the index"
        />
      </AppMetricGrid>

      <div className={cn(appHighlightCard, 'grid gap-3 sm:grid-cols-3')}>
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Latest window — {fundName}</p>
            <p className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatPercent(summary.latestFundReturn)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Latest — {benchmarkName}</p>
            <p className="font-mono text-lg font-bold tabular-nums">{formatPercent(summary.latestBenchmarkReturn)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          {summary.latestAlpha >= 0 ? (
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : (
            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Latest alpha</p>
            <p
              className={cn(
                'font-mono text-lg font-bold tabular-nums',
                summary.latestAlpha >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {formatSigned(summary.latestAlpha)}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(appHighlightCard, 'flex flex-wrap items-center gap-3 text-sm')}>
        <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <p className="text-muted-foreground">
          Golden Triangle on latest window:{' '}
          <span className="font-semibold text-foreground">
            {summary.goldenTrianglePasses}/{summary.goldenTriangleTotal} rules passed
          </span>
          {' · '}
          Sharpe {summary.fundSharpe.toFixed(2)} vs benchmark {summary.benchmarkSharpe.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
