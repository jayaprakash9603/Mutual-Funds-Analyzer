import type { FundReportAssessment } from '../schemas'

type QualityComponent = FundReportAssessment['qualityScore']['components'][number]

export type VerdictTierExplanation = {
  headline: string
  explanation: string
  checks: string[]
}

export function qualityComponentsForDisplay(components: QualityComponent[]): QualityComponent[] {
  return components.filter(
    (component) => component.name !== 'Expense Ratio' && component.name !== 'Diversification',
  )
}

export function explainVerdictTier(
  goldenTriangle: FundReportAssessment['goldenTriangle'],
  qualityScore: number,
  verdict: string,
): VerdictTierExplanation {
  const gtPasses = goldenTriangle.passCount
  const gtPassedAll = goldenTriangle.passed || goldenTriangle.overallRating === 'Passed'

  if (verdict === 'Strong Buy') {
    return {
      headline: 'Strong conviction',
      explanation:
        'All three Golden Triangle rules passed and the quality score is in the top tier (75+).',
      checks: [
        `Golden Triangle: ${gtPasses}/3 rules passed (all required)`,
        `Quality score: ${qualityScore}/100 (≥ 75 required)`,
      ],
    }
  }

  if (verdict === 'Buy') {
    return {
      headline: 'Positive bias',
      explanation:
        'At least two Golden Triangle rules passed with a solid quality score (60+).',
      checks: [
        `Golden Triangle: ${gtPasses}/3 rules passed (≥ 2 required)`,
        `Quality score: ${qualityScore}/100 (≥ 60 required)`,
      ],
    }
  }

  if (verdict === 'Hold') {
    return {
      headline: 'Mixed signals',
      explanation:
        'Some Golden Triangle support exists, but quality or consistency is not strong enough for a buy call.',
      checks: [
        `Golden Triangle: ${gtPasses}/3 rules passed (≥ 1 required)`,
        `Quality score: ${qualityScore}/100`,
        gtPassedAll ? 'All triangle rules passed — quality score capped the verdict.' : '',
      ].filter(Boolean),
    }
  }

  if (verdict === 'Watchlist') {
    return {
      headline: 'Wait for confirmation',
      explanation:
        'Golden Triangle score is weak, but quality still shows some merit — monitor before committing.',
      checks: [
        `Golden Triangle: ${gtPasses}/3 rules passed (0 required for watchlist path)`,
        `Quality score: ${qualityScore}/100 (≥ 45 required)`,
      ],
    }
  }

  return {
    headline: 'High caution',
    explanation:
      'Both Golden Triangle and quality scores fall below our minimum thresholds for a constructive rating.',
    checks: [
      `Golden Triangle: ${gtPasses}/3 rules passed`,
      `Quality score: ${qualityScore}/100 (< 45 on avoid path)`,
    ],
  }
}

export function formatRuleMetric(
  rule: FundReportAssessment['goldenTriangle']['rules'][number],
): string {
  if (rule.id === 'cob') {
    return `${rule.fundValue.toFixed(1)}% vs ${rule.benchmarkValue.toFixed(1)}% bench`
  }
  return `${rule.fundValue.toFixed(2)} vs ${rule.benchmarkValue.toFixed(2)} bench`
}
