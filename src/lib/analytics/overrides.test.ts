import { describe, it, expect } from 'vitest'
import { applyMetricOverrides } from '@/lib/analytics/overrides'
import { generateInsights } from '@/lib/analytics/metrics'
import type { GoldenTriangleResult, FundMetrics } from '@/lib/analytics/types'

function makeResult(overrides: Partial<FundMetrics> = {}): GoldenTriangleResult {
  const metrics = {
    fundRollingAvg: 23.08,
    benchmarkRollingAvg: 16.51,
    cob: 76.3,
    fundSharpe: 1.17,
    benchmarkSharpe: 0.66,
    fundVolatility: 17.14,
    benchmarkVolatility: 13,
    alpha: 6,
    beta: 0.9,
    sortino: 1.4,
    treynor: 0.2,
    informationRatio: 0.5,
    maxDrawdown: -40.26,
    benchmarkMaxDrawdown: -30,
    totalReturn: 470,
    benchmarkTotalReturn: 300,
    riskLevel: 'Medium',
    fundAgeYears: 12,
    consistencyScore: 80,
    ...overrides,
  } as FundMetrics

  return {
    rules: [
      {
        id: 'rollingReturn',
        label: 'Rolling Return',
        passed: true,
        fundValue: metrics.fundRollingAvg,
        benchmarkValue: metrics.benchmarkRollingAvg,
        description: '',
      },
      { id: 'cob', label: 'COB', passed: true, fundValue: metrics.cob, benchmarkValue: 70, description: '' },
      {
        id: 'sharpe',
        label: 'Sharpe Ratio',
        passed: true,
        fundValue: metrics.fundSharpe,
        benchmarkValue: metrics.benchmarkSharpe,
        description: '',
      },
    ],
    passCount: 3,
    overallRating: 'Passed',
    passed: true,
    metrics,
    fundName: 'Test Fund',
    benchmarkName: 'Test Benchmark',
    category: 'Small Cap',
    period: '5 Year',
  } as GoldenTriangleResult
}

describe('applyMetricOverrides', () => {
  it('ignores NaN from cleared number inputs instead of poisoning metrics', () => {
    const base = makeResult()
    const result = applyMetricOverrides(base, {
      cobOverride: NaN,
      fundSharpeOverride: NaN,
      benchmarkSharpeOverride: NaN,
    })

    expect(result.metrics.cob).toBe(76.3)
    expect(result.metrics.fundSharpe).toBe(1.17)
    expect(result.metrics.benchmarkSharpe).toBe(0.66)
  })

  it('keeps insights consistent with the rules after a NaN override', () => {
    const result = applyMetricOverrides(makeResult(), { cobOverride: NaN })
    const insights = generateInsights(result)

    expect(insights.join(' ')).not.toContain('NaN')
    expect(insights.join(' ')).toContain('76.3%')
  })

  it('re-evaluates the rules and score when a real override is applied', () => {
    const result = applyMetricOverrides(makeResult(), { cobOverride: 40 })

    expect(result.metrics.cob).toBe(40)
    expect(result.rules.find((r) => r.id === 'cob')?.passed).toBe(false)
    expect(result.rules.find((r) => r.id === 'cob')?.fundValue).toBe(40)
    expect(result.passCount).toBe(2)
    expect(result.passed).toBe(false)
  })

  it('returns the result untouched when no overrides are supplied', () => {
    const base = makeResult()
    expect(applyMetricOverrides(base, undefined)).toBe(base)
  })
})
