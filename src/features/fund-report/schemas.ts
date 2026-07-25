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
    series: z.array(z.object({ date: z.string(), drawdownPercent: z.number() })),
    episodes: z.array(z.object({
      peakDate: z.string(),
      troughDate: z.string(),
      recoveryDate: z.string(),
      fallPercent: z.number(),
      recoveryYears: z.number(),
    })),
  }),
  sip: z.object({
    scenarios: z.array(z.object({
      monthlyAmount: z.number(),
      currentValue: z.number(),
      totalGain: z.number(),
      xirr: z.number(),
      moneyInvested: z.number(),
      projectedValue10Y: z.number(),
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
