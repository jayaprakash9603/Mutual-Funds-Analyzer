import { z } from 'zod'

export const rollingReturnRowSchema = z.object({
  id: z.number(),
  scheme_company: z.string().optional(),
  scheme_category: z.string().optional().default(''),
  scheme_name: z.string(),
  period: z.string().optional(),
  nav_date: z.string(),
  scheme_nav: z.number(),
  scheme_forward_date: z.string(),
  scheme_forward_nav: z.number(),
  scheme_rolling_returns: z.number(),
})

export type RollingReturnRow = z.infer<typeof rollingReturnRowSchema>

export function normalizeRollingRows(
  rows: unknown[],
  period: string,
): RollingReturnRow[] {
  return rows.map((row) => {
    const r = row as Record<string, unknown>
    return rollingReturnRowSchema.parse({
      ...r,
      period: typeof r.period === 'string' ? r.period : period,
      scheme_category: typeof r.scheme_category === 'string' ? r.scheme_category : '',
    })
  })
}

export const schemesResponseSchema = z.array(z.string())

export type RollingReturnsResponse = {
  fund: RollingReturnRow[]
  benchmark: RollingReturnRow[]
}

export const ruleResultSchema = z.object({
  id: z.enum(['rollingReturn', 'cob', 'sharpe']),
  label: z.string(),
  passed: z.boolean(),
  fundValue: z.number(),
  benchmarkValue: z.number(),
  description: z.string(),
})

export const fundMetricsSchema = z.object({
  fundRollingAvg: z.number(),
  benchmarkRollingAvg: z.number(),
  fundRollingMax: z.number(),
  fundRollingMin: z.number(),
  benchmarkRollingMax: z.number(),
  benchmarkRollingMin: z.number(),
  cob: z.number(),
  fundSharpe: z.number(),
  benchmarkSharpe: z.number(),
  fundAnnReturn: z.number(),
  benchmarkAnnReturn: z.number(),
  fundVolatility: z.number(),
  benchmarkVolatility: z.number(),
  alpha: z.number(),
  beta: z.number(),
  sortino: z.number(),
  treynor: z.number(),
  informationRatio: z.number(),
  maxDrawdown: z.number(),
  benchmarkMaxDrawdown: z.number(),
  totalReturn: z.number(),
  benchmarkTotalReturn: z.number(),
  riskLevel: z.string(),
  fundAgeYears: z.number(),
  consistencyScore: z.number(),
})

export const goldenTriangleResultSchema = z.object({
  rules: z.array(ruleResultSchema),
  passCount: z.number(),
  overallRating: z.enum(['Passed', 'Average', 'Weak', 'Avoid']),
  passed: z.boolean(),
  metrics: fundMetricsSchema,
  fundName: z.string(),
  benchmarkName: z.string(),
  category: z.string(),
  period: z.string(),
})

export type GoldenTriangleResult = z.infer<typeof goldenTriangleResultSchema>

export const timelineEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  value: z.string(),
  explanation: z.string(),
  sortKey: z.number(),
})

export type TimelineEvent = z.infer<typeof timelineEventSchema>

export const analysisResponseSchema = z.object({
  result: goldenTriangleResultSchema,
  insights: z.array(z.string()),
  timeline: z.array(timelineEventSchema),
  data: z.object({
    fund: z.array(rollingReturnRowSchema),
    benchmark: z.array(rollingReturnRowSchema),
  }),
})

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>

export const compareResponseSchema = z.object({
  results: z.array(goldenTriangleResultSchema),
})

export const featureFlagsSchema = z.record(z.string(), z.boolean())

export const seriesStatsSchema = z.object({
  avg: z.number(),
  max: z.number(),
  min: z.number(),
  stdDev: z.number(),
  count: z.number(),
})

export const periodComparisonRowSchema = z.object({
  period: z.string(),
  fundName: z.string(),
  benchmarkName: z.string(),
  fund: seriesStatsSchema,
  benchmark: seriesStatsSchema,
  cob: z.number(),
  totalRecords: z.number(),
})

export const fundIndexComparisonSchema = z.object({
  scheme: z.string(),
  fundName: z.string(),
  benchmarkName: z.string(),
  category: z.string(),
  rows: z.array(periodComparisonRowSchema),
  missingPeriods: z.array(z.string()),
  computedAt: z.string(),
  stale: z.boolean(),
  partial: z.boolean(),
})

export type SeriesStats = z.infer<typeof seriesStatsSchema>
export type PeriodComparisonRow = z.infer<typeof periodComparisonRowSchema>
export type FundIndexComparison = z.infer<typeof fundIndexComparisonSchema>
