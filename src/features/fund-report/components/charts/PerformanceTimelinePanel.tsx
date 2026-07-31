import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PerformanceTimeline } from '@/components/dashboard/charts/PerformanceTimeline'
import { FeatureGate } from '@/components/common/FeatureGate'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { DEFAULT_PERIOD, PERIODS, type Period } from '@/lib/constants'
import { buildPerformanceTimelineAnalysis } from '@/lib/analytics/performanceTimelineAnalysis'
import { ReportInsightCard } from '../layout/ReportInsightCard'
import { ChartSkeleton } from '../layout/ReportGroupBoundary'
import { PerformanceTimelineMilestoneChart } from './PerformanceTimelineMilestoneChart'
import {
  PerformanceTimelineDetailCards,
  PerformanceTimelineSummaryStrip,
} from './PerformanceTimelineDetailCards'

type PerformanceTimelinePanelProps = {
  scheme: string
  fundName: string
  benchmarkName: string
  startDate?: string
  offlineView?: boolean
}

export function PerformanceTimelinePanel({
  scheme,
  fundName,
  benchmarkName,
  startDate,
  offlineView = false,
}: PerformanceTimelinePanelProps) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const {
    data,
    result,
    timeline,
    loading,
    error,
  } = useFundAnalysis(offlineView ? null : scheme, period, startDate)

  const analysis = useMemo(() => {
    if (!data) return null
    return buildPerformanceTimelineAnalysis(
      { fund: data.fund, benchmark: data.benchmark, period },
      result,
      timeline,
    )
  }, [data, period, result, timeline])

  const resolvedFundName = result?.fundName ?? fundName
  const resolvedBenchmarkName = result?.benchmarkName ?? benchmarkName

  const timelineEvents = useMemo(
    () =>
      analysis?.milestones.map((milestone) => ({
        title: milestone.title,
        date: milestone.dateLabel.toUpperCase(),
        value: `${milestone.fundReturn.toFixed(2)}%`,
        explanation: milestone.explanation,
        sortKey: milestone.sortKey,
      })) ?? timeline,
    [analysis, timeline],
  )

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Performance timeline requires live rolling return data and is not included in shared snapshots.
      </p>
    )
  }

  return (
    <FeatureGate
      name="ui.performanceTimeline"
      fallback={
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Performance timeline is currently disabled.
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Milestones are computed from aligned {period} rolling windows — inception, peak, trough, midpoint, and
            latest — with fund vs benchmark alpha at each point.
          </p>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-full sm:w-[140px]" aria-label="Rolling window">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading && !analysis ? <ChartSkeleton /> : null}

        {analysis ? (
          <>
            <PerformanceTimelineSummaryStrip
              fundName={resolvedFundName}
              benchmarkName={resolvedBenchmarkName}
              summary={analysis.summary}
            />

            <ReportInsightCard
              title="Performance Timeline"
              subtitle="Key milestones across the fund's rolling return history"
            >
              <PerformanceTimeline events={timelineEvents} variant="embedded" />
            </ReportInsightCard>

            <ReportInsightCard
              title="Rolling return journey"
              subtitle={`Fund vs ${resolvedBenchmarkName} with milestone markers on the ${period} series`}
            >
              <PerformanceTimelineMilestoneChart
                points={analysis.chartPoints}
                fundName={resolvedFundName}
                benchmarkName={resolvedBenchmarkName}
              />
            </ReportInsightCard>

            <ReportInsightCard
              title="Milestone deep dive"
              subtitle="Window dates, NAV endpoints, benchmark comparison, and alpha at each historical checkpoint"
            >
              <PerformanceTimelineDetailCards milestones={analysis.milestones} />
            </ReportInsightCard>

            <ReportInsightCard
              title="How these milestones are calculated"
              subtitle="Transparent methodology aligned with the Golden Triangle analysis engine"
            >
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <p>
                  Each milestone uses a <strong className="text-foreground">{period} rolling return</strong> — the
                  annualised return from NAV at the window start to NAV at the window end. Windows slide forward one
                  trading day at a time across the fund&apos;s history.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong className="text-foreground">Inception</strong> — first available window in the dataset.
                  </li>
                  <li>
                    <strong className="text-foreground">Best / Worst</strong> — highest and lowest fund rolling return
                    across all aligned windows.
                  </li>
                  <li>
                    <strong className="text-foreground">Mid-period</strong> — window at the 50th percentile of the
                    series (by date).
                  </li>
                  <li>
                    <strong className="text-foreground">Latest</strong> — most recent window ending on the latest NAV
                    date, evaluated with Golden Triangle Sharpe and rule pass count.
                  </li>
                </ul>
                <p>
                  <strong className="text-foreground">Alpha</strong> at each point is fund rolling return minus
                  benchmark rolling return for the identical window dates.{' '}
                  <strong className="text-foreground">Vs series average</strong> compares the milestone return to the
                  mean of all fund windows in the selected period.
                </p>
              </div>
            </ReportInsightCard>
          </>
        ) : !loading && !error ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No rolling return history available for {period}.
          </p>
        ) : null}
      </div>
    </FeatureGate>
  )
}
