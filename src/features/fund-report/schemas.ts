import { z } from 'zod'
import { goldenTriangleResultSchema } from '@/api/schemas'
import { withFundReportDefaults } from './sectionDefaults'

function coerceFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'nan' || lower === 'infinity' || lower === '-infinity') {
      return fallback
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const numericField = (fallback = 0) => z.preprocess((value) => coerceFiniteNumber(value, fallback), z.number())

function coerceNumericBound(value: unknown): unknown {
  if (value == null) {
    return value
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : value < 0 ? -1000 : 1000
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === '-infinity') {
      return -1000
    }
    if (lower === 'infinity') {
      return 1000
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }
  return value
}

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
  calendarYearInsights: z.object({
    distribution: z.object({
      buckets: z.array(z.object({
        label: z.string(),
        minInclusive: z.preprocess(coerceNumericBound, z.number()),
        maxExclusive: z.preprocess((value) => value == null ? null : coerceNumericBound(value), z.number().nullable()),
        percentOfYears: z.number(),
        yearCount: z.number(),
      })),
      positiveYearsPercent: z.number(),
      negativeYearsPercent: z.number(),
      positiveYearCount: z.number(),
      negativeYearCount: z.number(),
      totalYears: z.number(),
      headline: z.string(),
    }),
    sortedReturns: z.object({
      periodLabel: z.string(),
      cagrPercent: z.number(),
      moneyMultiple: z.number(),
      longTermBandLow: z.number(),
      longTermBandHigh: z.number(),
      years: z.array(z.object({
        year: z.number(),
        returnPercent: z.number(),
        inLongTermBand: z.boolean(),
      })),
      headline: z.string(),
    }),
    profitBooking: z.object({
      rollingWindowYears: z.number(),
      debtAnnualReturnPercent: z.number(),
      rows: z.array(z.object({
        periodLabel: z.string(),
        startYear: z.number(),
        endYear: z.number(),
        buyHoldCagrPercent: z.number(),
        outperformanceAt20Percent: z.number(),
        outperformanceAt30Percent: z.number(),
        outperformanceAt50Percent: z.number(),
        outperformanceAtAllTimeHighPercent: z.number(),
      })),
      headline: z.string(),
      methodologyNote: z.string(),
    }),
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
      finalValue: numericField(),
      cagrPercent: numericField(),
      lowerByPercent: numericField(),
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
  allTimeHighs: z.object({
    periodLabel: z.string(),
    series: z.array(z.object({
      date: z.string(),
      nav: z.number(),
      allTimeHigh: z.boolean(),
      fellBelowThreshold: z.boolean().nullable(),
    })),
    yearlyMaxLevels: z.array(z.object({
      year: z.number(),
      yearLabel: z.string(),
      maxNav: z.number(),
      allTimeHighYear: z.boolean(),
    })),
    summary: z.object({
      totalAllTimeHighDays: z.number(),
      calendarYears: z.number(),
      yearsWithNewHigh: z.number(),
      yearsWithNewHighPercent: z.number(),
      headline: z.string(),
    }),
    postAthReturns: z.object({
      horizons: z.array(z.object({
        label: z.string(),
        years: z.number(),
        sampleCount: z.number(),
        averageCagrPercent: z.number(),
        thresholds: z.array(z.object({
          label: z.string(),
          boundPercent: z.number(),
          above: z.boolean(),
          shareOfTimesPercent: z.number(),
        })),
      })),
      headline: z.string(),
    }),
    athDeclineOutlook: z.object({
      declineThresholdPercent: z.number(),
      totalAthInstances: z.number(),
      neverFellCount: z.number(),
      neverFellPercent: z.number(),
      fellCount: z.number(),
      fellPercent: z.number(),
      headline: z.string(),
    }),
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
  calendarYearInsights: true,
  benchmarkComparison: true,
  probability: true,
})
export type FundReportPerformance = z.infer<typeof fundReportPerformanceSchema>

export const fundReportRiskSchema = fundReportSchema.pick({
  risk: true,
  consistency: true,
  drawdown: true,
  bestDays: true,
  allTimeHighs: true,
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
  const normalized = withFundReportDefaults(report as Partial<FundReport> & Record<string, unknown>)
  return {
    overview: { scheme: normalized.scheme, profile: normalized.profile },
    performance: {
      trailingReturns: normalized.trailingReturns,
      rollingReturns: normalized.rollingReturns,
      calendarYearInsights: normalized.calendarYearInsights,
      benchmarkComparison: normalized.benchmarkComparison,
      probability: normalized.probability,
    },
    risk: {
      risk: normalized.risk,
      consistency: normalized.consistency,
      drawdown: normalized.drawdown,
      bestDays: normalized.bestDays,
      allTimeHighs: normalized.allTimeHighs,
    },
    investment: {
      sip: normalized.sip,
      lumpsum: normalized.lumpsum,
      tax: normalized.tax,
      expense: normalized.expense,
    },
    assessment: {
      goldenTriangle: normalized.goldenTriangle,
      qualityScore: normalized.qualityScore,
      insights: normalized.insights,
      prosCons: normalized.prosCons,
      investorFit: normalized.investorFit,
      recommendation: normalized.recommendation,
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
    horizonReturns: z.array(z.object({
      label: z.string(),
      cagrPercent: z.number().nullable(),
      moneyMultiplied: z.number().nullable(),
    })).optional().default([]),
  })),
  highlights: z.array(z.string()),
  periodLabel: z.string(),
  longRunAnalysis: z.object({
    categoryLabel: z.string(),
    asOfDate: z.string(),
    horizonLabels: z.array(z.string()),
    twentyYearCagrLow: z.number().nullable(),
    twentyYearCagrHigh: z.number().nullable(),
    twentyYearMultiplyLow: z.number().nullable(),
    twentyYearMultiplyHigh: z.number().nullable(),
  }).optional(),
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
