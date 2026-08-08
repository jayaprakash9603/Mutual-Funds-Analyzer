/**
 * Fills gaps in captured demo fixtures so Report tabs show charts instead of
 * "no data" empty states. Capture often omits heavy series (indexed NAV, SIP
 * timelines) and newer section payloads; we synthesize those from what *was*
 * captured (calendar years, drawdown spine, SIP scenarios, peer averages).
 */

import type { FundReport, PeerComparison } from '@/features/fund-report/schemas'

type IndexedNavPoint = NonNullable<FundReport['drawdown']['indexedNav']>[number]
type CalendarYear = FundReport['consistency']['calendarYears'][number]
type SipTimelinePoint = NonNullable<FundReport['sip']['timeline']>[number]

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.includes('T') ? value.slice(0, 10) : value.slice(0, 10)
  const date = new Date(`${trimmed}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime())
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}

function yearsBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

function moneyMultiple(cagrPercent: number, years: number): number {
  if (!Number.isFinite(cagrPercent) || years <= 0) return 1
  return (1 + cagrPercent / 100) ** years
}

function defaultCagr(report: Partial<FundReport>): number {
  const fromLumpsum = report.lumpsum?.scenarios?.[0]?.cagr
  if (typeof fromLumpsum === 'number' && Number.isFinite(fromLumpsum)) return fromLumpsum
  const years = report.consistency?.calendarYears ?? []
  if (years.length > 0) {
    const product = years.reduce((acc, row) => acc * (1 + row.returnPercent / 100), 1)
    return (product ** (1 / years.length) - 1) * 100
  }
  return 14
}

function resolveDateRange(report: Partial<FundReport>): { start: Date; end: Date } {
  const fromProfileStart = parseDate(report.profile?.dataFrom)
  const fromProfileEnd = parseDate(report.profile?.dataTo)
  const series = report.drawdown?.series ?? []
  const seriesStart = series.length > 0 ? parseDate(series[0].date) : null
  const seriesEnd = series.length > 0 ? parseDate(series[series.length - 1].date) : null
  const start = fromProfileStart ?? seriesStart ?? new Date('2013-01-01T00:00:00Z')
  const end = fromProfileEnd ?? seriesEnd ?? new Date('2026-07-01T00:00:00Z')
  return start <= end ? { start, end } : { start: end, end: start }
}

/** Year-end NAV units from calendar returns, scaled so the final point matches latestNav. */
function buildYearEndNavMap(
  years: CalendarYear[],
  latestNav: number,
): Map<number, number> {
  const sorted = [...years].sort((a, b) => a.year - b.year)
  const map = new Map<number, number>()
  if (sorted.length === 0) return map
  let units = 1
  for (const row of sorted) {
    units *= 1 + row.returnPercent / 100
    map.set(row.year, units)
  }
  const scale = latestNav / units
  for (const [year, value] of map) {
    map.set(year, value * scale)
  }
  return map
}

function navAtDate(
  date: Date,
  yearEndNav: Map<number, number>,
  fallbackCagr: number,
  latestNav: number,
  rangeStart: Date,
): number {
  const year = date.getUTCFullYear()
  const monthFraction = (date.getUTCMonth() + date.getUTCDate() / 28) / 12
  const prev = yearEndNav.get(year - 1)
  const curr = yearEndNav.get(year)
  if (prev != null && curr != null) {
    const logPrev = Math.log(Math.max(prev, 0.01))
    const logCurr = Math.log(Math.max(curr, 0.01))
    return Math.exp(logPrev + (logCurr - logPrev) * Math.min(1, Math.max(0, monthFraction)))
  }
  if (curr != null) {
    return curr / (1 + (1 - monthFraction) * 0.05)
  }
  if (prev != null) {
    return prev * (1 + monthFraction * (fallbackCagr / 100))
  }
  const elapsed = Math.max(0, yearsBetween(rangeStart, date))
  return latestNav / moneyMultiple(fallbackCagr, Math.max(0.25, yearsBetween(rangeStart, new Date())))
    * moneyMultiple(fallbackCagr, elapsed)
}

function sampleDates(report: Partial<FundReport>, start: Date, end: Date): string[] {
  const series = report.drawdown?.series ?? []
  if (series.length > 0) {
    const maxPoints = 420
    const step = Math.max(1, Math.ceil(series.length / maxPoints))
    const dates: string[] = []
    for (let i = 0; i < series.length; i += step) {
      dates.push(series[i].date.slice(0, 10))
    }
    const last = series[series.length - 1].date.slice(0, 10)
    if (dates[dates.length - 1] !== last) dates.push(last)
    return dates
  }
  const dates: string[] = []
  let cursor = new Date(start.getTime())
  while (cursor <= end) {
    dates.push(toIsoDate(cursor))
    cursor = addMonths(cursor, 1)
  }
  if (dates.length === 0 || dates[dates.length - 1] !== toIsoDate(end)) {
    dates.push(toIsoDate(end))
  }
  return dates
}

function buildIndexedNav(report: Partial<FundReport>): IndexedNavPoint[] {
  const existing = report.drawdown?.indexedNav
  if (Array.isArray(existing) && existing.length > 0) return existing

  const { start, end } = resolveDateRange(report)
  const latestNav = report.profile?.latestNav && report.profile.latestNav > 0
    ? report.profile.latestNav
    : 100
  const cagr = defaultCagr(report)
  const yearEndNav = buildYearEndNavMap(report.consistency?.calendarYears ?? [], latestNav)
  const dates = sampleDates(report, start, end)
  if (dates.length === 0) return []

  const points: IndexedNavPoint[] = dates.map((date) => {
    const parsed = parseDate(date) ?? end
    const nav = navAtDate(parsed, yearEndNav, cagr, latestNav, start)
    return { date, nav, indexValue: 0 }
  })
  const firstNav = points[0].nav ?? 1
  for (const point of points) {
    const nav = point.nav ?? firstNav
    point.nav = nav
    point.indexValue = (nav / firstNav) * 100
  }
  const last = points[points.length - 1]
  const lastNav = last.nav ?? 0
  if (lastNav > 0 && Math.abs(lastNav - latestNav) / latestNav > 0.02) {
    const scale = latestNav / lastNav
    for (const point of points) {
      point.nav = (point.nav ?? 0) * scale
      point.indexValue *= scale
    }
  }
  return points
}

function buildCalendarYearInsights(
  report: Partial<FundReport>,
): FundReport['calendarYearInsights'] | null {
  const existing = report.calendarYearInsights
  if (
    existing
    && Array.isArray(existing.profitBooking?.rows)
    && existing.profitBooking.rows.length > 0
    && Array.isArray(existing.distribution?.buckets)
    && existing.distribution.buckets.length > 0
  ) {
    return existing
  }

  const years = [...(report.consistency?.calendarYears ?? [])].sort((a, b) => a.year - b.year)
  if (years.length === 0) return null

  const positive = years.filter((y) => y.returnPercent >= 0)
  const negative = years.filter((y) => y.returnPercent < 0)
  const bucketDefs = [
    { label: '< -20%', minInclusive: -1000, maxExclusive: -20 },
    { label: '-20% to 0%', minInclusive: -20, maxExclusive: 0 },
    { label: '0% to 20%', minInclusive: 0, maxExclusive: 20 },
    { label: '20% to 40%', minInclusive: 20, maxExclusive: 40 },
    { label: '40%+', minInclusive: 40, maxExclusive: null as number | null },
  ]
  const buckets = bucketDefs.map((def) => {
    const matched = years.filter((y) => {
      if (y.returnPercent < def.minInclusive) return false
      if (def.maxExclusive == null) return true
      return y.returnPercent < def.maxExclusive
    })
    return {
      label: def.label,
      minInclusive: def.minInclusive,
      maxExclusive: def.maxExclusive,
      yearCount: matched.length,
      percentOfYears: (matched.length / years.length) * 100,
    }
  })

  const product = years.reduce((acc, y) => acc * (1 + y.returnPercent / 100), 1)
  const cagrPercent = (product ** (1 / years.length) - 1) * 100
  const bandLow = 10
  const bandHigh = 20

  const windowYears = 10
  const profitRows = []
  for (let i = 0; i + windowYears - 1 < years.length; i += 1) {
    const slice = years.slice(i, i + windowYears)
    const startYear = slice[0].year
    const endYear = slice[slice.length - 1].year
    const buyHold = slice.reduce((acc, y) => acc * (1 + y.returnPercent / 100), 1)
    const buyHoldCagr = (buyHold ** (1 / windowYears) - 1) * 100
    const debtCagr = 6
    profitRows.push({
      periodLabel: `${startYear}–${endYear}`,
      startYear,
      endYear,
      buyHoldCagrPercent: buyHoldCagr,
      outperformanceAt20Percent: buyHoldCagr - debtCagr - 1.2,
      outperformanceAt30Percent: buyHoldCagr - debtCagr - 2.1,
      outperformanceAt50Percent: buyHoldCagr - debtCagr - 3.4,
      outperformanceAtAllTimeHighPercent: buyHoldCagr - debtCagr - 2.8,
    })
  }

  return {
    distribution: {
      buckets,
      positiveYearsPercent: (positive.length / years.length) * 100,
      negativeYearsPercent: (negative.length / years.length) * 100,
      positiveYearCount: positive.length,
      negativeYearCount: negative.length,
      totalYears: years.length,
      headline: `${positive.length} of ${years.length} calendar years were positive.`,
    },
    sortedReturns: {
      periodLabel: `${years[0].year}–${years[years.length - 1].year}`,
      cagrPercent,
      moneyMultiple: product,
      longTermBandLow: bandLow,
      longTermBandHigh: bandHigh,
      years: years.map((y) => ({
        year: y.year,
        returnPercent: y.returnPercent,
        inLongTermBand: y.returnPercent >= bandLow && y.returnPercent <= bandHigh,
      })),
      headline: `Long-term CAGR about ${cagrPercent.toFixed(1)}% across ${years.length} calendar years.`,
    },
    profitBooking: {
      rollingWindowYears: windowYears,
      debtAnnualReturnPercent: 6,
      rows: profitRows,
      headline:
        profitRows.length > 0
          ? 'Buy-and-hold beat profit-booking into a 6% debt proxy across most rolling decades.'
          : 'Need at least ten calendar years for profit-booking comparisons.',
      methodologyNote:
        'Demo illustration: each row is a rolling 10-year window. Outperformance columns compare buy-and-hold CAGR with booking gains into a 6% debt proxy after return triggers.',
    },
  }
}

function buildSipTimeline(
  indexedNav: IndexedNavPoint[],
  monthlyAmount: number,
  targetCorpus?: number,
): SipTimelinePoint[] {
  if (indexedNav.length === 0 || monthlyAmount <= 0) return []
  const byMonth = new Map<string, IndexedNavPoint>()
  for (const point of indexedNav) {
    byMonth.set(point.date.slice(0, 7), point)
  }
  const months = [...byMonth.keys()].sort()
  let invested = 0
  let units = 0
  const timeline: SipTimelinePoint[] = []
  for (const month of months) {
    const point = byMonth.get(month)!
    const nav = point.nav && point.nav > 0 ? point.nav : Math.max(point.indexValue / 100, 0.01)
    invested += monthlyAmount
    units += monthlyAmount / Math.max(nav, 0.01)
    timeline.push({
      date: `${month}-01`,
      invested,
      corpus: units * nav,
      nav,
    })
  }
  if (targetCorpus && targetCorpus > 0 && timeline.length > 0) {
    const endCorpus = timeline[timeline.length - 1].corpus
    if (endCorpus > 0) {
      const corpusScale = targetCorpus / endCorpus
      for (const point of timeline) {
        point.corpus *= corpusScale
      }
    }
  }
  return timeline
}

function buildLumpsumTimeline(
  indexedNav: IndexedNavPoint[],
  principal: number,
  targetValue?: number,
): SipTimelinePoint[] {
  if (indexedNav.length === 0 || principal <= 0) return []
  const first = indexedNav[0]
  const startNav = first.nav && first.nav > 0 ? first.nav : 1
  const units = principal / startNav
  const timeline = indexedNav
    .filter((_, index) => index % Math.max(1, Math.floor(indexedNav.length / 180)) === 0
      || index === indexedNav.length - 1)
    .map((point) => {
      const nav = point.nav && point.nav > 0 ? point.nav : startNav
      return {
        date: point.date,
        invested: principal,
        corpus: units * nav,
        nav,
      }
    })
  if (targetValue && timeline.length > 0) {
    const last = timeline[timeline.length - 1].corpus
    if (last > 0) {
      const scale = targetValue / last
      for (const point of timeline) point.corpus *= scale
    }
  }
  return timeline
}

function buildMultiplyOdds(report: Partial<FundReport>): FundReport['multiplyOdds'] {
  const existing = report.multiplyOdds
  if (existing && existing.rows.length > 0) return existing

  const holdingYears = [3, 5, 7, 10]
  const multiplies = [2, 3, 5]
  const base = report.probability
  const rows = multiplies.map((multiply) => {
    const baseHit =
      multiply <= 2
        ? (base?.doubleMoney ?? 70)
        : multiply <= 3
          ? (base?.tripleMoney ?? 55)
          : Math.max(15, (base?.tripleMoney ?? 40) * 0.55)
    return {
      multiply,
      cells: holdingYears.map((years) => {
        const boost = Math.min(25, Math.max(0, years - 3) * 4)
        const percent = Math.min(99, Math.max(5, baseHit + boost - (multiply - 2) * 8))
        const sampleCount = 800 + years * 40
        return {
          holdingYears: years,
          percent,
          sampleCount,
          hitCount: Math.round((percent / 100) * sampleCount),
        }
      }),
      highlightYears: [5, 10],
      calloutPercent: null,
    }
  })
  return {
    periodLabel: 'Since inception (demo)',
    holdingYears,
    rows,
    headline: 'Longer holding windows raise the odds of multiplying capital.',
  }
}

function buildBestDays(report: Partial<FundReport>, indexedNav: IndexedNavPoint[]): FundReport['bestDays'] {
  const existing = report.bestDays
  if (existing && (existing.missingScenarios.length > 0 || existing.topBestDays.length > 0)) {
    return existing
  }
  const initial = 1_000_000
  const cagr = defaultCagr(report)
  const age = report.profile?.fundAgeYears ?? 10
  const fullValue = initial * moneyMultiple(cagr, age)
  const missingScenarios = [5, 10, 20, 30].map((missCount) => {
    const drag = missCount * 0.8
    const finalValue = fullValue * (1 - drag / 100)
    return {
      missCount,
      label: `Miss top ${missCount} days`,
      finalValue,
      cagrPercent: cagr - drag / age,
      lowerByPercent: drag,
    }
  })
  const topBestDays = indexedNav.slice(-40).map((point, index) => ({
    rank: index + 1,
    date: point.date,
    returnPercent: 1.2 + (index % 7) * 0.35,
  })).slice(0, 10)
  const episodes = report.drawdown?.episodes ?? []
  const crashPeriods = episodes.slice(0, 3).map((ep, index) => ({
    periodLabel: `${ep.peakDate?.slice(0, 4) ?? 'Crash'} decline`,
    marketFallLabel: `${Math.abs(ep.fallPercent).toFixed(0)}% fall`,
    topDaysInPeriod: 3 + index,
    topRankLimit: 30,
    bestDays: topBestDays.slice(0, 3),
  }))
  return {
    initialInvestment: initial,
    periodLabel: 'Since inception (demo)',
    missingScenarios,
    topBestDays,
    crashPeriods,
    topDaysCumulative: [5, 10, 20, 30].map((topCount) => ({
      topCount,
      cumulativeReturnPercent: topCount * 2.1,
    })),
    proximityInsight: {
      bestDaysNearWorst: 4,
      worstDaysConsidered: 10,
      topRankLimit: 30,
      exampleText: 'Several of the best days arrived during sharp sell-offs (demo illustration).',
    },
    headlineSummary: 'Missing a handful of the best days materially lowers long-term compounding.',
  }
}

function buildAllTimeHighs(
  report: Partial<FundReport>,
  indexedNav: IndexedNavPoint[],
): FundReport['allTimeHighs'] {
  const existing = report.allTimeHighs
  if (existing && existing.series.length > 0) return existing
  if (indexedNav.length === 0) {
    return {
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
      postAthReturns: { horizons: [], headline: '' },
      athDeclineOutlook: {
        declineThresholdPercent: 10,
        totalAthInstances: 0,
        neverFellCount: 0,
        neverFellPercent: 0,
        fellCount: 0,
        fellPercent: 0,
        headline: '',
      },
    }
  }

  let peak = -Infinity
  let athCount = 0
  const series = indexedNav.map((point) => {
    const nav = point.nav ?? point.indexValue
    const isAth = nav >= peak
    if (isAth) {
      peak = nav
      athCount += 1
    }
    return {
      date: point.date,
      nav,
      allTimeHigh: isAth,
      fellBelowThreshold: isAth ? false : nav < peak * 0.9,
    }
  })

  const byYear = new Map<number, number>()
  for (const point of series) {
    const year = Number(point.date.slice(0, 4))
    byYear.set(year, Math.max(byYear.get(year) ?? 0, point.nav))
  }
  let runningMax = 0
  const yearlyMaxLevels = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, maxNav]) => {
      const allTimeHighYear = maxNav >= runningMax
      if (allTimeHighYear) runningMax = maxNav
      return {
        year,
        yearLabel: String(year),
        maxNav,
        allTimeHighYear,
      }
    })
  const yearsWithNewHigh = yearlyMaxLevels.filter((row) => row.allTimeHighYear).length

  return {
    periodLabel: 'Since inception (demo)',
    series: series.filter((_, i) => i % Math.max(1, Math.floor(series.length / 220)) === 0
      || series[i].allTimeHigh
      || i === series.length - 1),
    yearlyMaxLevels,
    summary: {
      totalAllTimeHighDays: athCount,
      calendarYears: yearlyMaxLevels.length,
      yearsWithNewHigh,
      yearsWithNewHighPercent: yearlyMaxLevels.length
        ? (yearsWithNewHigh / yearlyMaxLevels.length) * 100
        : 0,
      headline: `${yearsWithNewHigh} of ${yearlyMaxLevels.length} years printed a new all-time high.`,
    },
    postAthReturns: {
      horizons: [1, 3, 5].map((years) => ({
        label: `${years}Y after ATH`,
        years,
        sampleCount: 40 + years * 10,
        averageCagrPercent: defaultCagr(report) * 0.85,
        thresholds: [
          { label: 'Above 10%', boundPercent: 10, above: true, shareOfTimesPercent: 55 + years * 4 },
          { label: 'Negative', boundPercent: 0, above: false, shareOfTimesPercent: 18 },
        ],
      })),
      headline: 'Buying near prior highs still compounded positively over multi-year holds (demo).',
    },
    athDeclineOutlook: {
      declineThresholdPercent: 10,
      totalAthInstances: Math.max(athCount, 1),
      neverFellCount: Math.round(athCount * 0.35),
      neverFellPercent: 35,
      fellCount: Math.round(athCount * 0.65),
      fellPercent: 65,
      headline: 'About two-thirds of all-time highs later saw a 10%+ pullback (demo).',
    },
  }
}

function buildVolatility(
  report: Partial<FundReport>,
  indexedNav: IndexedNavPoint[],
): FundReport['volatility'] {
  const existing = report.volatility
  if (existing && existing.periods.length > 0) return existing
  const annual = report.risk?.volatility ?? report.risk?.standardDeviation ?? 18
  const { start, end } = resolveDateRange(report)
  const rollingSeries = indexedNav
    .filter((_, i) => i % Math.max(1, Math.floor(indexedNav.length / 160)) === 0)
    .map((point, index) => ({
      date: point.date,
      fundVolatilityPercent: annual * (0.85 + (index % 5) * 0.06),
      benchmarkVolatilityPercent: annual * 0.92,
    }))
  return {
    periodLabel: `${toIsoDate(start)} → ${toIsoDate(end)} (demo)`,
    benchmarkAvailable: true,
    periods: [
      {
        frequency: 'Daily',
        observations: Math.max(100, indexedNav.length),
        stdDevPercent: annual / Math.sqrt(252),
        annualisedVolatilityPercent: annual,
        averageReturnPercent: defaultCagr(report) / 252,
        typicalSwingPercent: annual / Math.sqrt(252),
        bestReturnPercent: 4.2,
        bestReturnDate: indexedNav[Math.min(10, indexedNav.length - 1)]?.date ?? toIsoDate(end),
        worstReturnPercent: -5.1,
        worstReturnDate: indexedNav[Math.min(20, indexedNav.length - 1)]?.date ?? toIsoDate(start),
        positivePeriodsPercent: 53,
        negativePeriodsPercent: 47,
        benchmarkAnnualisedVolatilityPercent: annual * 0.95,
        benchmarkBestReturnPercent: 3.8,
        benchmarkWorstReturnPercent: -4.6,
      },
      {
        frequency: 'Monthly',
        observations: Math.max(24, Math.round(indexedNav.length / 21)),
        stdDevPercent: annual / Math.sqrt(12),
        annualisedVolatilityPercent: annual,
        averageReturnPercent: defaultCagr(report) / 12,
        typicalSwingPercent: annual / Math.sqrt(12),
        bestReturnPercent: 14,
        bestReturnDate: indexedNav[Math.floor(indexedNav.length * 0.3)]?.date ?? toIsoDate(end),
        worstReturnPercent: -18,
        worstReturnDate: indexedNav[Math.floor(indexedNav.length * 0.45)]?.date ?? toIsoDate(start),
        positivePeriodsPercent: 58,
        negativePeriodsPercent: 42,
        benchmarkAnnualisedVolatilityPercent: annual * 0.95,
        benchmarkBestReturnPercent: 12,
        benchmarkWorstReturnPercent: -16,
      },
    ],
    rollingSeries,
    rollingSummary: {
      windowDays: 252,
      currentPercent: annual,
      averagePercent: annual * 0.95,
      maxPercent: annual * 1.35,
      maxDate: rollingSeries[Math.floor(rollingSeries.length * 0.4)]?.date ?? toIsoDate(end),
      minPercent: annual * 0.65,
      minDate: rollingSeries[Math.floor(rollingSeries.length * 0.7)]?.date ?? toIsoDate(start),
      benchmarkAveragePercent: annual * 0.9,
      timeAboveBenchmarkPercent: 48,
    },
    dailyDistribution: [
      { label: '< -2%', lowerPercent: -1000, upperPercent: -2, count: 40, sharePercent: 8 },
      { label: '-2% to 0%', lowerPercent: -2, upperPercent: 0, count: 180, sharePercent: 36 },
      { label: '0% to 2%', lowerPercent: 0, upperPercent: 2, count: 220, sharePercent: 44 },
      { label: '> 2%', lowerPercent: 2, upperPercent: 1000, count: 60, sharePercent: 12 },
    ],
    volatilityBand: annual >= 20 ? 'High' : annual >= 12 ? 'Moderate' : 'Low',
    headline: `Annualised volatility near ${annual.toFixed(1)}% (demo reconstruction).`,
  }
}

function buildMissingBestQuarter(
  report: Partial<FundReport>,
): FundReport['missingBestQuarter'] {
  const existing = report.missingBestQuarter
  if (existing && existing.series.length > 0) return existing
  const cagr = defaultCagr(report)
  const series = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year, index) => {
    const lost = 1.5 + (index % 4) * 0.4
    return {
      quarterLabel: `Q${(index % 4) + 1} ${year}`,
      quarterEndDate: `${year}-${String(((index % 4) + 1) * 3).padStart(2, '0')}-28`,
      fullCagrPercent: cagr,
      exBestQuarterCagrPercent: cagr - lost,
      lostCagrPercent: lost,
      bestQuarterLabel: `Q${(index % 4) + 1} ${year}`,
    }
  })
  const averageLost = series.reduce((sum, row) => sum + row.lostCagrPercent, 0) / series.length
  return {
    periodLabel: 'Rolling windows (demo)',
    series,
    averageLostPercent: averageLost,
    latestLostPercent: series[series.length - 1].lostCagrPercent,
    latestQuarterLabel: series[series.length - 1].quarterLabel,
    headline: 'Skipping the single best quarter in a window trims CAGR by a couple of points.',
  }
}

function buildStepUpSip(
  report: Partial<FundReport>,
  indexedNav: IndexedNavPoint[],
): NonNullable<FundReport['stepUpSip']> {
  const existing = report.stepUpSip
  if (existing && (existing.scenarios?.length ?? 0) > 0) return existing

  const base = report.sip?.scenarios?.find((s) => s.monthlyAmount === 10_000)
    ?? report.sip?.scenarios?.[0]
  const initial = base?.monthlyAmount ?? 10_000
  const stepUpPercent = 10
  const currentMonthly = Math.round(initial * (1 + stepUpPercent / 100) ** 5)
  const moneyInvested = (base?.moneyInvested ?? initial * 120) * 1.35
  const currentValue = (base?.currentValue ?? moneyInvested * 2.5) * 1.25
  const scenario = {
    initialMonthlyAmount: initial,
    currentMonthlyAmount: currentMonthly,
    stepUpMode: 'PERCENT' as const,
    stepUpValue: stepUpPercent,
    currentValue,
    totalGain: currentValue - moneyInvested,
    xirr: (base?.xirr ?? 18) + 1.5,
    moneyInvested,
    projectedValue10Y: (base?.projectedValue10Y ?? currentValue) * 1.4,
    stcg: base?.stcg ?? 0,
    ltcg: (base?.ltcg ?? 0) * 1.2,
    postTaxXirr: (base?.postTaxXirr ?? (base?.xirr ?? 17)) + 1.2,
    instalmentCount: Math.max(12, Math.round((report.profile?.fundAgeYears ?? 10) * 12)),
  }
  return {
    scheduleDay: report.sip?.scheduleDay ?? 1,
    chartInitialAmount: initial,
    stepUpMode: 'PERCENT',
    stepUpPercent,
    stepUpAmount: 2000,
    timeline: buildSipTimeline(indexedNav, initial, currentValue),
    scenarios: [
      scenario,
      {
        ...scenario,
        initialMonthlyAmount: 5_000,
        currentMonthlyAmount: Math.round(5_000 * 1.1 ** 5),
        currentValue: currentValue * 0.5,
        moneyInvested: moneyInvested * 0.5,
        totalGain: currentValue * 0.5 - moneyInvested * 0.5,
        projectedValue10Y: scenario.projectedValue10Y * 0.5,
        instalmentCount: scenario.instalmentCount,
      },
    ],
  }
}

function enrichDrawdownExtras(
  drawdown: FundReport['drawdown'],
  indexedNav: IndexedNavPoint[],
): FundReport['drawdown'] {
  const episodes = drawdown.episodes ?? []
  const phases =
    drawdown.phases && drawdown.phases.length > 0
      ? drawdown.phases
      : episodes.flatMap((ep) => {
          const fall = {
            type: 'DECLINE',
            startDate: ep.peakDate,
            endDate: ep.troughDate,
            changePercent: ep.fallPercent,
            durationLabel: 'decline',
            durationYears: Math.max(0.1, ep.recoveryYears * 0.45),
            ongoing: false,
          }
          const recovery = {
            type: 'RECOVERY',
            startDate: ep.troughDate,
            endDate: ep.recoveryDate,
            changePercent: Math.abs(ep.fallPercent) * 1.05,
            durationLabel: 'recovery',
            durationYears: Math.max(0.1, ep.recoveryYears * 0.55),
            ongoing: !ep.recovered,
          }
          return [fall, recovery]
        })

  const startYear = indexedNav[0] ? Number(indexedNav[0].date.slice(0, 4)) : 2014
  const endYear = indexedNav[indexedNav.length - 1]
    ? Number(indexedNav[indexedNav.length - 1].date.slice(0, 4))
    : 2026
  const bearMarketDecades =
    drawdown.bearMarketDecades && drawdown.bearMarketDecades.length > 0
      ? drawdown.bearMarketDecades
      : [
          {
            decadeLabel: `${Math.floor(startYear / 10) * 10}s`,
            percentOfDays: 22,
            daysInBearMarket: 400,
            totalDays: 1800,
            partial: true,
          },
          {
            decadeLabel: `${Math.floor(endYear / 10) * 10}s`,
            percentOfDays: 18,
            daysInBearMarket: 320,
            totalDays: 1800,
            partial: true,
          },
        ]

  const thresholdRows =
    drawdown.thresholdRows && drawdown.thresholdRows.length > 0
      ? drawdown.thresholdRows
      : [5, 10, 15, 20, 30].map((thresholdPercent) => ({
          thresholdPercent,
          fundPercentOfDays: Math.max(2, 40 - thresholdPercent),
          fundDaysBelow: Math.round(8 * (40 - thresholdPercent)),
          benchmarkPercentOfDays: Math.max(2, 38 - thresholdPercent),
        }))

  return {
    ...drawdown,
    indexedNav,
    phases,
    bearMarketDecades,
    thresholdRows,
  }
}

export function enrichDemoFundReport(report: Record<string, unknown>): Record<string, unknown> {
  if (!report || typeof report !== 'object') return report

  const partial = report as Partial<FundReport>
  const hasSeries = (partial.drawdown?.series?.length ?? 0) > 0
  const hasYears = (partial.consistency?.calendarYears?.length ?? 0) > 0
  if (!hasSeries && !hasYears && !(partial.profile?.dataFrom && partial.profile?.dataTo)) {
    return report
  }

  const indexedNav = buildIndexedNav(partial)
  const calendarYearInsights = buildCalendarYearInsights(partial) ?? partial.calendarYearInsights
  const chartAmount = partial.sip?.chartAmount ?? 10_000
  const sipScenario =
    partial.sip?.scenarios?.find((row) => row.monthlyAmount === chartAmount)
    ?? partial.sip?.scenarios?.[0]
  const sipTimeline =
    partial.sip?.timeline && partial.sip.timeline.length > 0
      ? partial.sip.timeline
      : buildSipTimeline(indexedNav, chartAmount, sipScenario?.currentValue)

  const lumpsumAmount = partial.lumpsum?.chartAmount ?? 100_000
  const lumpsumScenario =
    partial.lumpsum?.scenarios?.find((row) => row.principal === lumpsumAmount)
    ?? partial.lumpsum?.scenarios?.[0]
  const lumpsumTimeline =
    partial.lumpsum?.timeline && partial.lumpsum.timeline.length > 0
      ? partial.lumpsum.timeline
      : buildLumpsumTimeline(indexedNav, lumpsumAmount, lumpsumScenario?.currentValue)

  const drawdown = partial.drawdown
    ? enrichDrawdownExtras(partial.drawdown, indexedNav)
    : partial.drawdown

  return {
    ...report,
    drawdown,
    calendarYearInsights,
    multiplyOdds: buildMultiplyOdds(partial),
    bestDays: buildBestDays(partial, indexedNav),
    allTimeHighs: buildAllTimeHighs(partial, indexedNav),
    volatility: buildVolatility(partial, indexedNav),
    missingBestQuarter: buildMissingBestQuarter(partial),
    sip: partial.sip
      ? {
          ...partial.sip,
          scheduleDay: partial.sip.scheduleDay ?? 1,
          chartAmount,
          timeline: sipTimeline,
        }
      : partial.sip,
    lumpsum: partial.lumpsum
      ? {
          ...partial.lumpsum,
          chartAmount: lumpsumAmount,
          timeline: lumpsumTimeline,
        }
      : partial.lumpsum,
    stepUpSip: buildStepUpSip(partial, indexedNav),
  }
}

export function enrichDemoPeers(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const data = payload as PeerComparison
  if (!Array.isArray(data.peers) || data.peers.length === 0) return payload

  const horizonYears = [
    { label: '1 Year', years: 1, scale: 0.55 },
    { label: '3 Year', years: 3, scale: 0.85 },
    { label: '5 Year', years: 5, scale: 1 },
    { label: '10 Year', years: 10, scale: 0.92 },
    { label: '15 Year', years: 15, scale: 0.88 },
    { label: '20 Year', years: 20, scale: 0.84 },
  ]

  const peers = data.peers.map((peer, index) => {
    if (peer.horizonReturns && peer.horizonReturns.some((h) => h.cagrPercent != null)) {
      return peer
    }
    const base = peer.average
    return {
      ...peer,
      horizonReturns: horizonYears.map((horizon, hIndex) => {
        const jitter = ((index + hIndex) % 5) * 0.35 - 0.7
        const cagrPercent = Math.max(-5, base * horizon.scale + jitter)
        return {
          label: horizon.label,
          cagrPercent,
          moneyMultiplied: moneyMultiple(cagrPercent, horizon.years),
        }
      }),
    }
  })

  const cagrs20 = peers
    .map((peer) => peer.horizonReturns.find((h) => h.label === '20 Year')?.cagrPercent)
    .filter((value): value is number => typeof value === 'number')

  return {
    ...data,
    peers,
    longRunAnalysis: data.longRunAnalysis ?? {
      categoryLabel: 'category peers',
      asOfDate: 'demo',
      horizonLabels: horizonYears.map((h) => h.label),
      twentyYearCagrLow: cagrs20.length ? Math.min(...cagrs20) : null,
      twentyYearCagrHigh: cagrs20.length ? Math.max(...cagrs20) : null,
      twentyYearMultiplyLow: cagrs20.length
        ? moneyMultiple(Math.min(...cagrs20), 20)
        : null,
      twentyYearMultiplyHigh: cagrs20.length
        ? moneyMultiple(Math.max(...cagrs20), 20)
        : null,
    },
  }
}

export function buildDemoSwpTimeline(
  indexedNav: IndexedNavPoint[],
  initialCorpus: number,
  monthlyWithdrawal: number,
): { timeline: Array<{ date: string; corpus: number; withdrawn: number; nav: number }>; scenario: {
  initialCorpus: number
  monthlyWithdrawal: number
  totalWithdrawn: number
  remainingCorpus: number
  withdrawalCount: number
  depleted: boolean
  stcg: number
  ltcg: number
  postTaxRemaining: number
} } {
  if (indexedNav.length === 0 || initialCorpus <= 0) {
    return {
      timeline: [],
      scenario: {
        initialCorpus,
        monthlyWithdrawal,
        totalWithdrawn: 0,
        remainingCorpus: initialCorpus,
        withdrawalCount: 0,
        depleted: false,
        stcg: 0,
        ltcg: 0,
        postTaxRemaining: initialCorpus,
      },
    }
  }

  const navOf = (point: IndexedNavPoint): number => {
    if (typeof point.nav === 'number' && point.nav > 0) return point.nav
    if (typeof point.indexValue === 'number' && point.indexValue > 0) return point.indexValue
    return 1
  }

  const byMonth = new Map<string, IndexedNavPoint>()
  for (const point of indexedNav) byMonth.set(point.date.slice(0, 7), point)
  const months = [...byMonth.keys()].sort()
  let corpus = initialCorpus
  let withdrawn = 0
  let count = 0
  const startNav = navOf(byMonth.get(months[0])!)
  let units = corpus / startNav
  const timeline = []

  for (const month of months) {
    const point = byMonth.get(month)!
    const nav = navOf(point)
    corpus = units * nav
    if (corpus <= 0) break
    const take = Math.min(monthlyWithdrawal, corpus)
    withdrawn += take
    count += 1
    corpus -= take
    units = corpus / nav
    timeline.push({
      date: `${month}-01`,
      corpus,
      withdrawn,
      nav,
    })
    if (corpus < monthlyWithdrawal * 0.25) break
  }

  const remaining = timeline.length > 0 ? timeline[timeline.length - 1].corpus : initialCorpus
  const gain = Math.max(0, remaining + withdrawn - initialCorpus)
  const ltcg = gain * 0.125
  const stcg = gain * 0.02
  return {
    timeline,
    scenario: {
      initialCorpus,
      monthlyWithdrawal,
      totalWithdrawn: withdrawn,
      remainingCorpus: remaining,
      withdrawalCount: count,
      depleted: remaining < monthlyWithdrawal,
      stcg,
      ltcg,
      postTaxRemaining: Math.max(0, remaining - stcg - ltcg),
    },
  }
}

export function buildDemoStpTimeline(
  indexedNav: IndexedNavPoint[],
  lumpSum: number,
  transferMonths: number,
): {
  timeline: Array<{
    date: string
    sourceCorpus: number
    targetCorpus: number
    transferred: number
    totalValue: number
    targetNav: number
  }>
  scenario: {
    lumpSum: number
    monthlyTransfer: number
    transferMonths: number
    totalTransferred: number
    transferCount: number
    sourceRemaining: number
    targetValue: number
    totalValue: number
    totalGain: number
    xirr: number
  }
} {
  const monthlyTransfer = Math.max(1, Math.round(lumpSum / Math.max(1, transferMonths)))
  if (indexedNav.length === 0) {
    return {
      timeline: [],
      scenario: {
        lumpSum,
        monthlyTransfer,
        transferMonths,
        totalTransferred: 0,
        transferCount: 0,
        sourceRemaining: lumpSum,
        targetValue: 0,
        totalValue: lumpSum,
        totalGain: 0,
        xirr: 0,
      },
    }
  }

  const byMonth = new Map<string, IndexedNavPoint>()
  for (const point of indexedNav) byMonth.set(point.date.slice(0, 7), point)
  const months = [...byMonth.keys()].sort().slice(-Math.max(transferMonths + 12, 24))
  let source = lumpSum
  let targetUnits = 0
  let transferred = 0
  let count = 0
  const sourceMonthlyRate = 0.005
  const timeline = []

  for (const month of months) {
    const point = byMonth.get(month)!
    const nav = point.nav && point.nav > 0 ? point.nav : 1
    source *= 1 + sourceMonthlyRate
    if (count < transferMonths && source > 0) {
      const move = Math.min(monthlyTransfer, source)
      source -= move
      targetUnits += move / nav
      transferred += move
      count += 1
    }
    const targetCorpus = targetUnits * nav
    const totalValue = source + targetCorpus
    timeline.push({
      date: `${month}-01`,
      sourceCorpus: source,
      targetCorpus,
      transferred,
      totalValue,
      targetNav: nav,
    })
  }

  const last = timeline[timeline.length - 1]
  const totalValue = last?.totalValue ?? lumpSum
  const totalGain = totalValue - lumpSum
  return {
    timeline,
    scenario: {
      lumpSum,
      monthlyTransfer,
      transferMonths,
      totalTransferred: transferred,
      transferCount: count,
      sourceRemaining: last?.sourceCorpus ?? lumpSum,
      targetValue: last?.targetCorpus ?? 0,
      totalValue,
      totalGain,
      xirr: lumpSum > 0 ? (totalGain / lumpSum) * (12 / Math.max(count, 1)) * 100 : 0,
    },
  }
}

export function buildDemoStepUpTimeline(
  indexedNav: IndexedNavPoint[],
  initialAmount: number,
  stepUpMode: 'PERCENT' | 'FIXED',
  stepUpValue: number,
): {
  timeline: SipTimelinePoint[]
  scenario: {
    initialMonthlyAmount: number
    currentMonthlyAmount: number
    stepUpMode: 'PERCENT' | 'FIXED'
    stepUpValue: number
    currentValue: number
    totalGain: number
    xirr: number
    moneyInvested: number
    projectedValue10Y: number
    instalmentCount: number
  }
} {
  if (indexedNav.length === 0 || initialAmount <= 0) {
    return {
      timeline: [],
      scenario: {
        initialMonthlyAmount: initialAmount,
        currentMonthlyAmount: initialAmount,
        stepUpMode,
        stepUpValue,
        currentValue: 0,
        totalGain: 0,
        xirr: 0,
        moneyInvested: 0,
        projectedValue10Y: 0,
        instalmentCount: 0,
      },
    }
  }

  const byMonth = new Map<string, IndexedNavPoint>()
  for (const point of indexedNav) byMonth.set(point.date.slice(0, 7), point)
  const months = [...byMonth.keys()].sort()
  let invested = 0
  let units = 0
  let monthly = initialAmount
  let instalments = 0
  const timeline: SipTimelinePoint[] = []

  for (let i = 0; i < months.length; i += 1) {
    const month = months[i]
    const point = byMonth.get(month)!
    const nav = point.nav && point.nav > 0 ? point.nav : 1
    if (i > 0 && i % 12 === 0) {
      monthly = stepUpMode === 'PERCENT'
        ? monthly * (1 + stepUpValue / 100)
        : monthly + stepUpValue
    }
    invested += monthly
    units += monthly / nav
    instalments += 1
    timeline.push({
      date: `${month}-01`,
      invested,
      corpus: units * nav,
      nav,
    })
  }

  const currentValue = timeline[timeline.length - 1]?.corpus ?? 0
  const totalGain = currentValue - invested
  return {
    timeline,
    scenario: {
      initialMonthlyAmount: initialAmount,
      currentMonthlyAmount: monthly,
      stepUpMode,
      stepUpValue,
      currentValue,
      totalGain,
      xirr: invested > 0 ? (totalGain / invested) * 12 : 0,
      moneyInvested: invested,
      projectedValue10Y: currentValue * 1.8,
      instalmentCount: instalments,
    },
  }
}
