import type {
  FundReport,
  FundReportPerformance,
  FundReportRisk,
} from './schemas'

export const EMPTY_MULTIPLY_ODDS: FundReportPerformance['multiplyOdds'] = {
  periodLabel: '',
  holdingYears: [],
  rows: [],
  headline: '',
}

export const EMPTY_MISSING_BEST_QUARTER: FundReportRisk['missingBestQuarter'] = {
  periodLabel: '',
  series: [],
  averageLostPercent: 0,
  latestLostPercent: 0,
  latestQuarterLabel: '',
  headline: '',
}

export const EMPTY_VOLATILITY: FundReportRisk['volatility'] = {
  periodLabel: '',
  benchmarkAvailable: false,
  periods: [],
  rollingSeries: [],
  rollingSummary: {
    windowDays: 252,
    currentPercent: 0,
    averagePercent: 0,
    maxPercent: 0,
    maxDate: '',
    minPercent: 0,
    minDate: '',
    benchmarkAveragePercent: 0,
    timeAboveBenchmarkPercent: 0,
  },
  dailyDistribution: [],
  volatilityBand: '',
  headline: '',
}

export const EMPTY_BEST_DAYS: FundReportRisk['bestDays'] = {
  initialInvestment: 1_000_000,
  periodLabel: '',
  missingScenarios: [],
  topBestDays: [],
  crashPeriods: [],
  topDaysCumulative: [],
  proximityInsight: {
    bestDaysNearWorst: 0,
    worstDaysConsidered: 10,
    topRankLimit: 30,
    exampleText: '',
  },
  headlineSummary: '',
}

export const EMPTY_POST_ATH_RETURNS: FundReportRisk['allTimeHighs']['postAthReturns'] = {
  horizons: [],
  headline: '',
}

export const EMPTY_ATH_DECLINE_OUTLOOK: FundReportRisk['allTimeHighs']['athDeclineOutlook'] = {
  declineThresholdPercent: 10,
  totalAthInstances: 0,
  neverFellCount: 0,
  neverFellPercent: 0,
  fellCount: 0,
  fellPercent: 0,
  headline: '',
}

export const EMPTY_ALL_TIME_HIGHS: FundReportRisk['allTimeHighs'] = {
  periodLabel: '',
  series: [],
  yearlyMaxLevels: [],
  summary: {
    totalAllTimeHighDays: 0,
    calendarYears: 0,
    yearsWithNewHigh: 0,
    yearsWithNewHighPercent: 0,
    headline: '',
  },
  postAthReturns: EMPTY_POST_ATH_RETURNS,
  athDeclineOutlook: EMPTY_ATH_DECLINE_OUTLOOK,
}

function normalizeAllTimeHighs(value: unknown): FundReportRisk['allTimeHighs'] {
  if (!value || typeof value !== 'object') {
    return EMPTY_ALL_TIME_HIGHS
  }
  const raw = value as Record<string, unknown>
  const series = Array.isArray(raw.series)
    ? raw.series.map((point) => {
        const row = point as Record<string, unknown>
        return {
          date: String(row.date ?? ''),
          nav: Number(row.nav ?? 0),
          allTimeHigh: Boolean(row.allTimeHigh),
          fellBelowThreshold:
            row.fellBelowThreshold == null ? null : Boolean(row.fellBelowThreshold),
        }
      })
    : []
  return {
    ...(EMPTY_ALL_TIME_HIGHS as FundReportRisk['allTimeHighs']),
    ...(raw as Partial<FundReportRisk['allTimeHighs']>),
    series,
    postAthReturns:
      (raw.postAthReturns as FundReportRisk['allTimeHighs']['postAthReturns'] | undefined)
      ?? EMPTY_POST_ATH_RETURNS,
    athDeclineOutlook:
      (raw.athDeclineOutlook as FundReportRisk['allTimeHighs']['athDeclineOutlook'] | undefined)
      ?? EMPTY_ATH_DECLINE_OUTLOOK,
  }
}

export const EMPTY_CALENDAR_YEAR_INSIGHTS: FundReportPerformance['calendarYearInsights'] = {
  distribution: {
    buckets: [],
    positiveYearsPercent: 0,
    negativeYearsPercent: 0,
    positiveYearCount: 0,
    negativeYearCount: 0,
    totalYears: 0,
    headline: '',
  },
  sortedReturns: {
    periodLabel: '',
    cagrPercent: 0,
    moneyMultiple: 0,
    longTermBandLow: 10,
    longTermBandHigh: 15,
    years: [],
    headline: '',
  },
  profitBooking: {
    rollingWindowYears: 10,
    debtAnnualReturnPercent: 6,
    rows: [],
    headline: '',
    methodologyNote: '',
  },
}

export function withFundReportDefaults(report: Partial<FundReport> & Record<string, unknown>): FundReport {
  return {
    ...report,
    bestDays: (report.bestDays as FundReport['bestDays'] | undefined) ?? EMPTY_BEST_DAYS,
    allTimeHighs: normalizeAllTimeHighs(report.allTimeHighs),
    calendarYearInsights:
      (report.calendarYearInsights as FundReport['calendarYearInsights'] | undefined)
      ?? EMPTY_CALENDAR_YEAR_INSIGHTS,
    multiplyOdds:
      (report.multiplyOdds as FundReport['multiplyOdds'] | undefined) ?? EMPTY_MULTIPLY_ODDS,
    missingBestQuarter:
      (report.missingBestQuarter as FundReport['missingBestQuarter'] | undefined)
      ?? EMPTY_MISSING_BEST_QUARTER,
    volatility:
      (report.volatility as FundReport['volatility'] | undefined) ?? EMPTY_VOLATILITY,
  } as FundReport
}

export function normalizeRiskSectionPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }
  const section = data as Record<string, unknown>
  return {
    ...section,
    bestDays: section.bestDays ?? EMPTY_BEST_DAYS,
    missingBestQuarter: section.missingBestQuarter ?? EMPTY_MISSING_BEST_QUARTER,
    volatility: section.volatility ?? EMPTY_VOLATILITY,
    allTimeHighs: normalizeAllTimeHighs(section.allTimeHighs),
  }
}

export function normalizePerformanceSectionPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }
  const section = data as Record<string, unknown>
  const insights = section.calendarYearInsights
  if (!insights || typeof insights !== 'object') {
    return {
      ...section,
      multiplyOdds: section.multiplyOdds ?? EMPTY_MULTIPLY_ODDS,
      calendarYearInsights: EMPTY_CALENDAR_YEAR_INSIGHTS,
    }
  }
  const rawInsights = insights as Record<string, unknown>
  const distribution = rawInsights.distribution
  const normalizedDistribution =
    distribution && typeof distribution === 'object'
      ? {
          ...(distribution as Record<string, unknown>),
          buckets: Array.isArray((distribution as Record<string, unknown>).buckets)
            ? ((distribution as Record<string, unknown>).buckets as unknown[]).map((bucket) => {
                const row = bucket as Record<string, unknown>
                return {
                  ...row,
                  minInclusive: coerceBucketBound(row.minInclusive),
                  maxExclusive:
                    row.maxExclusive == null ? null : coerceBucketBound(row.maxExclusive),
                }
              })
            : [],
        }
      : EMPTY_CALENDAR_YEAR_INSIGHTS.distribution
  return {
    ...section,
    multiplyOdds: section.multiplyOdds ?? EMPTY_MULTIPLY_ODDS,
    calendarYearInsights: {
      ...EMPTY_CALENDAR_YEAR_INSIGHTS,
      ...rawInsights,
      distribution: normalizedDistribution,
    },
  }
}

function coerceBucketBound(value: unknown): number {
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
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function normalizeRiskEnvelope(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }
  const envelope = data as Record<string, unknown>
  return {
    ...envelope,
    data: normalizeRiskSectionPayload(envelope.data),
  }
}

export function normalizePerformanceEnvelope(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }
  const envelope = data as Record<string, unknown>
  return {
    ...envelope,
    data: normalizePerformanceSectionPayload(envelope.data),
  }
}
