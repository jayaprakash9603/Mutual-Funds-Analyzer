import type {
  FundReport,
  FundReportPerformance,
  FundReportRisk,
} from './schemas'

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
    allTimeHighs: (report.allTimeHighs as FundReport['allTimeHighs'] | undefined) ?? EMPTY_ALL_TIME_HIGHS,
    calendarYearInsights:
      (report.calendarYearInsights as FundReport['calendarYearInsights'] | undefined)
      ?? EMPTY_CALENDAR_YEAR_INSIGHTS,
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
    allTimeHighs: section.allTimeHighs ?? EMPTY_ALL_TIME_HIGHS,
  }
}

export function normalizePerformanceSectionPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }
  const section = data as Record<string, unknown>
  return {
    ...section,
    calendarYearInsights: section.calendarYearInsights ?? EMPTY_CALENDAR_YEAR_INSIGHTS,
  }
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
