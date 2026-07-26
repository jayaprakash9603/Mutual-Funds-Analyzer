import { z } from 'zod'
import { goldenTriangleResultSchema } from '@/api/schemas'

const periodReturnSchema = z.object({
  label: z.string(),
  absoluteReturn: z.number(),
  cagr: z.number(),
  growthOfTenThousand: z.number(),
  moneyMultiplied: z.number(),
})

export const fundReportSchema = z.object({
  scheme: z.string(),
  profile: z.object({
    fundName: z.string(),
    amc: z.string(),
    category: z.string(),
    benchmarkName: z.string(),
    planType: z.string().nullable(),
    optionType: z.string().nullable(),
    launchDate: z.string().nullable(),
    fundAgeYears: z.number(),
    fundManager: z.string().nullable(),
    expenseRatio: z.number().nullable(),
    exitLoad: z.string().nullable(),
    minimumInvestment: z.string().nullable(),
    aum: z.string().nullable(),
    latestNav: z.number(),
    riskometer: z.string().nullable(),
    sebiRiskCategory: z.string().nullable(),
    overallRatingLabel: z.string(),
    overallRatingStars: z.number(),
    dataFrom: z.string(),
    dataTo: z.string(),
  }),
  goldenTriangle: goldenTriangleResultSchema,
  trailingReturns: z.object({ periods: z.array(periodReturnSchema) }),
  rollingReturns: z.object({
    periods: z.array(z.object({
      periodLabel: z.string(),
      average: z.number(),
      maximum: z.number(),
      minimum: z.number(),
      median: z.number(),
      stdDev: z.preprocess((value) => value ?? 0, z.number()),
      count: z.preprocess((value) => value ?? 0, z.number().int()),
      percentAbove10: z.number(),
      percentAbove7: z.number(),
      percentNegative: z.number(),
    })),
    consistencyScore: z.number(),
  }),
  benchmarkComparison: z.object({
    fundTotalReturn: z.number(),
    benchmarkTotalReturn: z.number(),
    difference: z.number(),
    outperformed: z.boolean(),
    outperformancePercent: z.number(),
    winningPercent: z.number(),
    explanation: z.string(),
  }),
  probability: z.object({
    positiveReturn: z.number(),
    beatInflation: z.number(),
    beatBenchmark: z.number(),
    above10Cagr: z.number(),
    doubleMoney: z.number(),
    tripleMoney: z.number(),
  }),
  risk: z.object({
    volatility: z.number(),
    standardDeviation: z.number(),
    sharpeRatio: z.number(),
    sortinoRatio: z.number(),
    treynorRatio: z.number(),
    beta: z.number(),
    alpha: z.number(),
    rSquared: z.number(),
    maxDrawdown: z.number(),
    recoveryTimeYears: z.number(),
    downsideCapture: z.number(),
    upsideCapture: z.number(),
    informationRatio: z.number(),
    trackingError: z.number(),
    ulcerIndex: z.number(),
    calmarRatio: z.number(),
    valueAtRisk95: z.number(),
    riskLevel: z.string(),
  }),
  consistency: z.object({
    calendarYears: z.array(z.object({
      year: z.number(),
      returnPercent: z.number(),
      intraYearDrawdown: z.number(),
    })),
    monthlyHeatmap: z.array(z.object({
      year: z.number(),
      month: z.number(),
      returnPercent: z.number(),
    })),
    worstYear: z.number(),
    bestYear: z.number(),
    worstMonth: z.number(),
    bestMonth: z.number(),
    longestWinningStreak: z.number(),
    longestLosingStreak: z.number(),
    consistencyRating: z.string(),
  }),
  drawdown: z.object({
    biggestCrash: z.number(),
    recoveryTimeYears: z.number(),
    maximumLoss: z.number(),
    averageRecoveryYears: z.number(),
    currentDrawdown: z.number().optional().default(0),
    series: z.array(z.object({ date: z.string(), drawdownPercent: z.number() })),
    episodes: z.array(z.object({
      peakDate: z.string(),
      troughDate: z.string(),
      recoveryDate: z.string(),
      fallPercent: z.number(),
      recoveryYears: z.number(),
      recovered: z.boolean().optional().default(true),
    })),
    bearMarketDecades: z.array(z.object({
      decadeLabel: z.string(),
      percentOfDays: z.number(),
      daysInBearMarket: z.number(),
      totalDays: z.number(),
      partial: z.boolean(),
    })).optional().default([]),
    thresholdRows: z.array(z.object({
      thresholdPercent: z.number(),
      fundPercentOfDays: z.number(),
      fundDaysBelow: z.number(),
      benchmarkPercentOfDays: z.number(),
    })).optional().default([]),
    phases: z.array(z.object({
      type: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      changePercent: z.number(),
      durationLabel: z.string(),
      durationYears: z.number(),
      ongoing: z.boolean(),
    })).optional().default([]),
    indexedNav: z.array(z.object({
      date: z.string(),
      indexValue: z.number(),
    })).optional().default([]),
  }),
  bestDays: z.object({
    initialInvestment: z.number(),
    periodLabel: z.string(),
    missingScenarios: z.array(z.object({
      missCount: z.number(),
      label: z.string(),
      finalValue: z.number(),
      cagrPercent: z.number(),
      lowerByPercent: z.number(),
    })),
    topBestDays: z.array(z.object({
      rank: z.number(),
      date: z.string(),
      returnPercent: z.number(),
    })),
    crashPeriods: z.array(z.object({
      periodLabel: z.string(),
      marketFallLabel: z.string(),
      topDaysInPeriod: z.number(),
      topRankLimit: z.number(),
      bestDays: z.array(z.object({
        rank: z.number(),
        date: z.string(),
        returnPercent: z.number(),
      })),
    })),
    topDaysCumulative: z.array(z.object({
      topCount: z.number(),
      cumulativeReturnPercent: z.number(),
    })),
    proximityInsight: z.object({
      bestDaysNearWorst: z.number(),
      worstDaysConsidered: z.number(),
      topRankLimit: z.number(),
      exampleText: z.string(),
    }),
    headlineSummary: z.string(),
  }),
  sip: z.object({
    scenarios: z.array(z.object({
      monthlyAmount: z.number(),
      currentValue: z.number(),
      totalGain: z.number(),
      xirr: z.number(),
      moneyInvested: z.number(),
      projectedValue10Y: z.number(),
      stcg: z.number().optional(),
      ltcg: z.number().optional(),
      postTaxXirr: z.number().optional(),
    })),
  }),
  lumpsum: z.object({
    scenarios: z.array(z.object({
      principal: z.number(),
      currentValue: z.number(),
      gain: z.number(),
      cagr: z.number(),
      moneyMultiplied: z.number(),
    })),
  }),
  tax: z.object({
    stcg: z.number(),
    ltcg: z.number(),
    indexationBenefit: z.number(),
    postTaxReturn: z.number(),
    explanation: z.string(),
  }),
  expense: z.object({
    expenseRatio: z.number().nullable(),
    costOver10Years: z.number().nullable(),
    costOver20Years: z.number().nullable(),
    categoryAverageExpense: z.number().nullable(),
    explanation: z.string(),
  }),
  qualityScore: z.object({
    score: z.number(),
    components: z.array(z.object({
      name: z.string(),
      score: z.number(),
      weight: z.number(),
    })),
  }),
  insights: z.array(z.string()),
  prosCons: z.object({ pros: z.array(z.string()), cons: z.array(z.string()) }),
  investorFit: z.object({
    suitableFor: z.array(z.string()),
    notSuitableFor: z.array(z.string()),
  }),
  recommendation: z.object({
    verdict: z.string(),
    confidencePercent: z.number(),
    summary: z.string(),
  }),
  computedAt: z.string(),
})

export type FundReport = z.infer<typeof fundReportSchema>

export const reportFreshnessSchema = z.enum(['FRESH', 'STALE', 'REFRESHING'])
export type ReportFreshness = z.infer<typeof reportFreshnessSchema>

export const fundReportOverviewSchema = fundReportSchema.pick({
  scheme: true,
  profile: true,
})
export type FundReportOverview = z.infer<typeof fundReportOverviewSchema>

export const fundReportPerformanceSchema = fundReportSchema.pick({
  trailingReturns: true,
  rollingReturns: true,
  benchmarkComparison: true,
  probability: true,
})
export type FundReportPerformance = z.infer<typeof fundReportPerformanceSchema>

export const fundReportRiskSchema = fundReportSchema.pick({
  risk: true,
  consistency: true,
  drawdown: true,
  bestDays: true,
})
export type FundReportRisk = z.infer<typeof fundReportRiskSchema>

export const fundReportInvestmentSchema = fundReportSchema.pick({
  sip: true,
  lumpsum: true,
  tax: true,
  expense: true,
})
export type FundReportInvestment = z.infer<typeof fundReportInvestmentSchema>

export const fundReportAssessmentSchema = fundReportSchema.pick({
  goldenTriangle: true,
  qualityScore: true,
  insights: true,
  prosCons: true,
  investorFit: true,
  recommendation: true,
})
export type FundReportAssessment = z.infer<typeof fundReportAssessmentSchema>

export function createReportSectionEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    freshness: reportFreshnessSchema,
    watermarkNavDate: z.string().nullable(),
    computedAt: z.string(),
    schemaVersion: z.number(),
  })
}

export const fundReportOverviewEnvelopeSchema = createReportSectionEnvelopeSchema(fundReportOverviewSchema)
export const fundReportPerformanceEnvelopeSchema = createReportSectionEnvelopeSchema(fundReportPerformanceSchema)
export const fundReportRiskEnvelopeSchema = createReportSectionEnvelopeSchema(fundReportRiskSchema)
export const fundReportInvestmentEnvelopeSchema = createReportSectionEnvelopeSchema(fundReportInvestmentSchema)
export const fundReportAssessmentEnvelopeSchema = createReportSectionEnvelopeSchema(fundReportAssessmentSchema)

export type FundReportOverviewEnvelope = z.infer<typeof fundReportOverviewEnvelopeSchema>
export type FundReportPerformanceEnvelope = z.infer<typeof fundReportPerformanceEnvelopeSchema>
export type FundReportRiskEnvelope = z.infer<typeof fundReportRiskEnvelopeSchema>
export type FundReportInvestmentEnvelope = z.infer<typeof fundReportInvestmentEnvelopeSchema>
export type FundReportAssessmentEnvelope = z.infer<typeof fundReportAssessmentEnvelopeSchema>

export type ReportSectionEnvelope<T> = {
  data: T
  freshness: ReportFreshness
  watermarkNavDate: string | null
  computedAt: string
  schemaVersion: number
}

export function splitFundReport(report: FundReport): {
  overview: FundReportOverview
  performance: FundReportPerformance
  risk: FundReportRisk
  investment: FundReportInvestment
  assessment: FundReportAssessment
} {
  return {
    overview: { scheme: report.scheme, profile: report.profile },
    performance: {
      trailingReturns: report.trailingReturns,
      rollingReturns: report.rollingReturns,
      benchmarkComparison: report.benchmarkComparison,
      probability: report.probability,
    },
    risk: {
      risk: report.risk,
      consistency: report.consistency,
      drawdown: report.drawdown,
      bestDays: report.bestDays,
    },
    investment: {
      sip: report.sip,
      lumpsum: report.lumpsum,
      tax: report.tax,
      expense: report.expense,
    },
    assessment: {
      goldenTriangle: report.goldenTriangle,
      qualityScore: report.qualityScore,
      insights: report.insights,
      prosCons: report.prosCons,
      investorFit: report.investorFit,
      recommendation: report.recommendation,
    },
  }
}

export const matrixReportSchema = z.object({
  mode: z.string(),
  startLabels: z.array(z.string()),
  holdingYears: z.array(z.number()),
  summaryRows: z.array(z.object({ label: z.string(), values: z.array(z.number().nullable()) })),
  dataRows: z.array(z.object({
    startLabel: z.string(),
    cells: z.array(z.object({
      holdingYears: z.number(),
      value: z.number().nullable(),
      band: z.string().nullable(),
    })),
  })),
  recovery: z.object({
    baselineHoldingYears: z.number(),
    strongReturnThreshold: z.number(),
    instancesBelowBaseline: z.number(),
    recoveredByExtension: z.number(),
    neverRecovered: z.number(),
    recoveryRatePercent: z.number(),
    maxExtensionYears: z.number().nullable(),
    rows: z.array(z.object({
      startLabel: z.string(),
      baselineReturn: z.number().nullable(),
      recoveryHoldingYears: z.number().nullable(),
      recoveryReturn: z.number().nullable(),
      recovered: z.boolean(),
      exception: z.boolean(),
    })),
    exceptionStartLabels: z.array(z.string()),
    headline: z.string(),
    summary: z.string(),
  }).optional(),
  lastNavDate: z.string().nullable().optional(),
  computedAt: z.string().nullable().optional(),
  fromSnapshot: z.boolean().optional(),
})

export type MatrixReport = z.infer<typeof matrixReportSchema>

export const peerComparisonSchema = z.object({
  peers: z.array(z.object({
    scheme: z.string(),
    average: z.number(),
    maximum: z.number(),
    minimum: z.number(),
    stdDev: z.number(),
    cob: z.number(),
    totalRecords: z.number(),
    sharpe: z.number(),
    maxDrawdown: z.number(),
    consistencyScore: z.number(),
    selected: z.boolean(),
  })),
  highlights: z.array(z.string()),
  periodLabel: z.string(),
})

export type PeerComparison = z.infer<typeof peerComparisonSchema>

export const drawdownPeersSchema = z.object({
  thresholdRows: z.array(z.object({
    thresholdPercent: z.number(),
    peerMedianPercentOfDays: z.number(),
  })),
  peerCount: z.number(),
})

export type DrawdownPeers = z.infer<typeof drawdownPeersSchema>
