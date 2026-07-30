import { Progress } from '@/components/ui/progress'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReportAssessment, FundReportRisk } from '../../schemas'
import { buildRiskHeadline } from '../../lib/headlines/sectionHeadlines'
import { qualityComponentsForDisplay } from '../../lib/verdictPresentation'
import { averageRiskQualityScore } from '../../lib/risk/riskPresentation'
import { GaugeMeter } from '../charts/ReportVisuals'
import { ReportInsightCard } from './ReportInsightCard'
import { RiskVerdictSummary } from './RiskVerdictSummary'
import { SectionHeadline } from './StatHeadline'
import { MetricTile } from './SectionShell'

type RiskAnalysisPanelProps = {
  risk: FundReportRisk
  assessment: FundReportAssessment
  fundName: string
}

function ScoreBar({
  label,
  value,
  max,
  tone,
}: {
  label: string
  value: number
  max: number
  tone?: 'primary' | 'amber' | 'destructive'
}) {
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

function QualityComponentRow({ name, score }: { name: string; score: number }) {
  return (
    <li className="rounded-lg border border-border/60 bg-background/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">{name}</span>
        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{score}/100</span>
      </div>
      <Progress value={score} className="mt-2 h-1.5" />
    </li>
  )
}

export function RiskAnalysisPanel({ risk, assessment, fundName }: RiskAnalysisPanelProps) {
  const metrics = risk.risk
  const { qualityScore } = assessment
  const qualityComponents = qualityComponentsForDisplay(qualityScore.components)
  const riskQualityAverage = averageRiskQualityScore(qualityScore.components)

  return (
    <div className="space-y-6">
      <SectionHeadline headline={buildRiskHeadline(risk, qualityScore, fundName)} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Volatility"
          value={formatPercent(metrics.volatility)}
          metricKey="volatility"
          size="lg"
        />
        <MetricTile label="Beta" value={metrics.beta.toFixed(2)} metricKey="beta" size="lg" />
        <MetricTile
          label="Max Drawdown"
          value={formatPercent(metrics.maxDrawdown)}
          metricKey="maxDrawdown"
          size="lg"
        />
        <MetricTile label="Risk Level" value={metrics.riskLevel} size="lg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportInsightCard
          title="Final recommendation"
          subtitle="Verdict from Golden Triangle rules — quality breakdown is in the panel beside this"
        >
          <RiskVerdictSummary assessment={assessment} />
        </ReportInsightCard>

        <ReportInsightCard
          title="Fund quality score"
          subtitle="NAV-based components — each scored out of 100"
        >
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <GaugeMeter score={qualityScore.score} label="Overall quality" />
              {riskQualityAverage != null ? (
                <div className="w-full flex-1 space-y-3">
                  <ScoreBar
                    label="Risk dimension average"
                    value={riskQualityAverage}
                    max={100}
                    tone={
                      riskQualityAverage >= 70 ? 'primary' : riskQualityAverage >= 50 ? 'amber' : 'destructive'
                    }
                  />
                </div>
              ) : null}
            </div>
            <ul className="space-y-2">
              {qualityComponents.map((component) => (
                <QualityComponentRow key={component.name} name={component.name} score={component.score} />
              ))}
            </ul>
          </div>
        </ReportInsightCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ReportInsightCard
          title="Risk-adjusted returns"
          subtitle="Reward earned per unit of risk"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Sharpe" value={metrics.sharpeRatio.toFixed(2)} metricKey="sharpe" />
            <MetricTile label="Sortino" value={metrics.sortinoRatio.toFixed(2)} metricKey="sortino" />
            <MetricTile label="Treynor" value={metrics.treynorRatio.toFixed(2)} metricKey="treynor" />
            <MetricTile label="Calmar" value={metrics.calmarRatio.toFixed(2)} metricKey="calmar" />
          </div>
        </ReportInsightCard>

        <ReportInsightCard
          title="Market sensitivity"
          subtitle="Movement relative to the benchmark"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Alpha" value={formatPercent(metrics.alpha)} metricKey="alpha" />
            <MetricTile
              label="Info Ratio"
              value={metrics.informationRatio.toFixed(2)}
              metricKey="informationRatio"
            />
            <MetricTile
              label="Tracking Error"
              value={formatPercent(metrics.trackingError)}
              metricKey="trackingError"
            />
            <MetricTile
              label="R-squared"
              value={metrics.rSquared.toFixed(2)}
            />
          </div>
        </ReportInsightCard>

        <ReportInsightCard
          title="Stress and downside"
          subtitle="Worst-case moves and drawdown depth"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile
              label="Downside capture"
              value={formatPercent(metrics.downsideCapture)}
              metricKey="downsideCapture"
            />
            <MetricTile
              label="Upside capture"
              value={formatPercent(metrics.upsideCapture)}
              metricKey="upsideCapture"
            />
            <MetricTile label="Ulcer index" value={metrics.ulcerIndex.toFixed(2)} metricKey="ulcerIndex" />
            <MetricTile
              label="VaR (95%)"
              value={formatPercent(metrics.valueAtRisk95)}
              metricKey="valueAtRisk95"
            />
          </div>
        </ReportInsightCard>
      </div>
    </div>
  )
}
