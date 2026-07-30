import type {
  FundReportInvestment,
  FundReportPerformance,
  FundReportRisk,
} from '../../schemas'
import type { MultiplyProbabilityTable } from '../matrix/multiplyProbability'
import { accent, accentMark, alert, type Headline } from './types'

type Performance = FundReportPerformance
type Risk = FundReportRisk
type Investment = FundReportInvestment

/** The deck anchors most of its equity claims on a 7-year hold. */
const PREFERRED_HORIZON_YEARS = 7

function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

/**
 * Drops the plan/option suffix so a one-liner reads as a sentence rather than
 * a scheme code: "… Flexi Cap Fund - Regular Plan - Growth" -> "… Flexi Cap Fund".
 */
export function shortFundName(fundName: string): string {
  const [head] = fundName.split(/\s+[-–]\s+/)
  return head?.trim() || fundName
}

/** The backend sends a placeholder name when it cannot resolve a benchmark series. */
function benchmarkWords(benchmarkName: string): string {
  const name = benchmarkName.trim()
  if (!name || /unavailable|^benchmark$/i.test(name)) return 'its benchmark'
  return name
}

function horizonWords(label: string): string {
  const years = Number(label.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(years) || years <= 0) return label
  return years === 1 ? '1 year' : `${years} years`
}

function horizonYears(label: string): number {
  const years = Number(label.replace(/[^\d.]/g, ''))
  return Number.isFinite(years) ? years : 0
}

function rupees(value: number): string {
  if (value >= 1_00_00_000) {
    const crore = value / 1_00_00_000
    return `₹${crore >= 10 ? crore.toFixed(0) : crore.toFixed(2)} crore`
  }
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(value >= 10_00_000 ? 0 : 1)} lakh`
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const pos = (sorted.length - 1) * q
  const lower = Math.floor(pos)
  const upper = Math.ceil(pos)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower)
}

function roundToFive(value: number): number {
  return Math.max(5, Math.round(value / 5) * 5)
}

/** "Longer the time frame, higher the odds of better returns" — with this fund's numbers. */
export function buildRollingReturnsHeadline(
  rollingReturns: Performance['rollingReturns'],
  fundName: string,
): Headline | null {
  const usable = rollingReturns.periods.filter((period) => period.count > 0)
  if (usable.length === 0) return null

  const preferred = usable.find(
    (period) => horizonYears(period.periodLabel) === PREFERRED_HORIZON_YEARS,
  )
  const period =
    preferred ??
    usable.reduce((longest, candidate) =>
      horizonYears(candidate.periodLabel) > horizonYears(longest.periodLabel) ? candidate : longest,
    )

  const window = horizonWords(period.periodLabel)
  const note =
    period.percentNegative <= 0
      ? `No instance of negative returns over ${window} — the lowest was ${pct(period.minimum, 1)}!`
      : `Only ${pct(period.percentNegative, 1)} of ${window} windows ended negative, and the lowest was ${pct(period.minimum, 1)}.`

  return {
    parts: [
      accentMark(`${pct(period.percentAbove10)} of the times`),
      ` ${shortFundName(fundName)} gave `,
      accent('more than 10% returns'),
      ' over ',
      accent(window),
    ],
    note,
    noteTone: period.percentNegative <= 0 ? 'accent' : 'ink',
  }
}

/** Deck page 7: the long-run CAGR and money-multiple as the two big green numbers. */
export function buildTrailingReturnsHeadline(
  trailingReturns: Performance['trailingReturns'],
  fundName: string,
): Headline | null {
  const usable = trailingReturns.periods.filter((period) => period.cagr !== 0)
  if (usable.length === 0) return null

  const longest = usable.reduce((best, candidate) =>
    horizonYears(candidate.label) > horizonYears(best.label) ? candidate : best,
  )
  const window = horizonWords(longest.label)

  return {
    parts: [
      `Over ${window}, ${shortFundName(fundName)} compounded at `,
      accentMark(`${pct(longest.cagr, 1)} a year`),
      ' and multiplied money ',
      accent(`${longest.moneyMultiplied.toFixed(1)} times`),
    ],
    note: `₹10,000 invested at the start of that window is ${rupees(longest.growthOfTenThousand)} today.`,
  }
}

/** Deck page 67: "positive returns in 80% of the calendar years…" */
export function buildDistributionHeadline(
  distribution: Performance['calendarYearInsights']['distribution'],
): Headline | null {
  if (distribution.totalYears === 0) return null

  return {
    parts: [
      'Calendar years ended in the green ',
      accentMark(`${pct(distribution.positiveYearsPercent)} of the time`),
      ` — ${distribution.positiveYearCount} of ${distribution.totalYears} years positive, `,
      alert(`${distribution.negativeYearCount} negative`),
    ],
  }
}

/** Deck page 68: "…calendar year returns rarely resemble long term averages". */
export function buildSortedReturnsHeadline(
  sortedReturns: Performance['calendarYearInsights']['sortedReturns'],
): Headline | null {
  const total = sortedReturns.years.length
  if (total === 0) return null

  const inBand = sortedReturns.years.filter((year) => year.inLongTermBand).length

  return {
    parts: [
      'Only ',
      accentMark(`${inBand} of ${total} calendar years`),
      ' landed anywhere near the long-run average of ',
      accent(pct(sortedReturns.cagrPercent, 1)),
      ' — yearly returns rarely resemble the number you plan with',
    ],
    note: `Long-term band used here is ${pct(sortedReturns.longTermBandLow, 0)} to ${pct(sortedReturns.longTermBandHigh, 0)} over ${sortedReturns.periodLabel}.`,
  }
}

/** Deck page 66: "Never interrupt compounding". */
export function buildProfitBookingHeadline(
  profitBooking: Performance['calendarYearInsights']['profitBooking'],
): Headline | null {
  const rows = profitBooking.rows
  if (rows.length === 0) return null

  const wins = rows.filter((row) => row.outperformanceAtAllTimeHighPercent > 0).length
  const averageEdge =
    rows.reduce((sum, row) => sum + row.outperformanceAtAllTimeHighPercent, 0) / rows.length

  return {
    parts: [
      'Never interrupt compounding — staying invested beat booking profits at all-time highs in ',
      accentMark(`${wins} of ${rows.length} rolling ${profitBooking.rollingWindowYears}-year windows`),
      ', by ',
      accent(`${pct(averageEdge, 1)} a year`),
      ' on average',
    ],
  }
}

/** Deck page 17: "On average your money multiplied more than 2 times over 7+ Years". */
export function buildProbabilityHeadline(
  probability: Performance['probability'],
  fundName: string,
): Headline | null {
  if (probability.doubleMoney <= 0 && probability.above10Cagr <= 0) return null

  return {
    parts: [
      accentMark(`${pct(probability.doubleMoney)} of the times`),
      ` ${shortFundName(fundName)} at least `,
      accent('doubled your money'),
      ' over a ',
      accent('7-year hold'),
    ],
    note: `Tripled in ${pct(probability.tripleMoney)} of those windows, beat inflation in ${pct(probability.beatInflation)}, and cleared a 10% CAGR in ${pct(probability.above10Cagr)}.`,
  }
}

const MULTIPLY_VERB: Record<number, string> = {
  2: 'doubled',
  3: 'tripled',
  4: 'quadrupled',
}

function multiplyVerb(multiply: number): string {
  return MULTIPLY_VERB[multiply] ?? `multiplied ${multiply} times`
}

/** Deck page 14: "81% of the times Indian Equities have tripled in 10-11 years". */
export function buildMultiplyHeadline(
  table: MultiplyProbabilityTable,
  fundName: string,
): Headline | null {
  const candidates = table.rows.filter(
    (row) => row.calloutPercent != null && row.highlightYears != null,
  )
  if (candidates.length === 0) return null

  const row = candidates.find((candidate) => candidate.multiply === 3) ?? candidates[0]
  const [from, to] = row.highlightYears!

  const others = candidates
    .filter((candidate) => candidate !== row)
    .map(
      (candidate) =>
        `${candidate.multiply}x in ${candidate.highlightYears![0]}-${candidate.highlightYears![1]} years (${pct(candidate.calloutPercent!)})`,
    )

  return {
    parts: [
      accentMark(`${pct(row.calloutPercent!)} of the times`),
      ` ${shortFundName(fundName)} has `,
      accent(multiplyVerb(row.multiply)),
      ' in ',
      accent(`${from}-${to} years`),
    ],
    note: others.length > 0 ? `Same history: ${others.join('; ')}.` : undefined,
  }
}

/** Deck page 32: "10-20% temporary declines almost every year — yet 3 out of 4 years ended positive". */
export function buildIntraYearDeclineHeadline(
  consistency: Risk['consistency'],
  fundName: string,
): Headline | null {
  const years = consistency.calendarYears
  if (years.length < 3) return null

  const falls = years.map((year) => Math.abs(year.intraYearDrawdown)).sort((a, b) => a - b)
  const low = roundToFive(quantile(falls, 0.25))
  const high = roundToFive(quantile(falls, 0.75))
  const positive = years.filter((year) => year.returnPercent > 0).length
  const bandLabel = low === high ? `${low}%` : `${low}-${high}%`

  return {
    parts: [
      `${shortFundName(fundName)} saw `,
      alert(`${bandLabel} temporary declines`),
      ' in a typical year — yet ',
      accentMark(`${positive} of ${years.length} years`),
      ' still ended with positive returns',
    ],
    note: `Best year ${pct(consistency.bestYear, 1)}, worst year ${pct(consistency.worstYear, 1)}. The fall and the full-year return are two different stories.`,
  }
}

/** Deck page 34: "Temporary market declines of 30-60% occur once every 7-10 years". */
export function buildDrawdownHeadline(
  drawdown: Risk['drawdown'],
  fundName: string,
): Headline | null {
  const episodes = drawdown.episodes
  if (episodes.length === 0) return null

  const recovered = episodes.filter((episode) => episode.recovered !== false)

  return {
    parts: [
      `${shortFundName(fundName)} has fallen 10% or more `,
      alert(`${episodes.length} times`),
      ' — the deepest was ',
      alert(pct(-Math.abs(drawdown.biggestCrash), 1)),
      ', and recovery took ',
      accentMark(`${drawdown.averageRecoveryYears.toFixed(1)} years on average`),
    ],
    note:
      recovered.length === episodes.length
        ? `Every one of those ${episodes.length} falls was fully recovered. Declines are temporary; the recovery is the pattern.`
        : `${recovered.length} of ${episodes.length} falls are fully recovered; the rest are still working their way back.`,
  }
}

/** Deck page 39: decade-wise time spent in a bear market. */
export function buildBearMarketHeadline(
  drawdown: Risk['drawdown'],
  fundName: string,
): Headline | null {
  const tenPercentRow =
    drawdown.thresholdRows.find((row) => Math.abs(row.thresholdPercent) === 10) ??
    drawdown.thresholdRows[0]
  if (!tenPercentRow) return null

  const threshold = Math.abs(tenPercentRow.thresholdPercent)

  return {
    parts: [
      accentMark(`${pct(tenPercentRow.fundPercentOfDays)} of all trading days`),
      ` ${shortFundName(fundName)} sat more than `,
      alert(`${threshold}% below its own peak`),
      ' — being underwater is the normal state, not the exception',
    ],
    note: `The benchmark spent ${pct(tenPercentRow.benchmarkPercentOfDays)} of its days in the same position.`,
  }
}

/** Deck pages 59-60: non-linear returns, and best days clustering inside crashes. */
export function buildBestDaysHeadline(
  bestDays: Risk['bestDays'],
  fundName: string,
): Headline | null {
  const stayed = bestDays.missingScenarios.find((scenario) => scenario.missCount === 0)
  const missed = bestDays.missingScenarios.find((scenario) => scenario.missCount > 0)
  if (!stayed || !missed) return null

  return {
    parts: [
      `Missing just the `,
      alert(`${missed.missCount} best days`),
      ` cut ${shortFundName(fundName)} from `,
      accentMark(`${pct(stayed.cagrPercent, 1)} a year`),
      ' down to ',
      alert(`${pct(missed.cagrPercent, 1)} a year`),
    ],
    note:
      bestDays.proximityInsight.bestDaysNearWorst > 0
        ? `${bestDays.proximityInsight.bestDaysNearWorst} of the top ${bestDays.proximityInsight.topRankLimit} days landed within two weeks of the worst days — you cannot collect one without sitting through the other.`
        : `Returns are non-linear: a handful of days carries most of the ${bestDays.periodLabel} outcome.`,
  }
}

/** Deck pages 62-65: all-time highs are normal, and rarely the start of a fall. */
export function buildAllTimeHighsHeadline(
  allTimeHighs: Risk['allTimeHighs'],
  fundName: string,
): Headline | null {
  const summary = allTimeHighs.summary
  if (summary.calendarYears === 0) return null

  const outlook = allTimeHighs.athDeclineOutlook

  return {
    parts: [
      `${shortFundName(fundName)} hit a fresh all-time high in `,
      accentMark(`${summary.yearsWithNewHigh} of ${summary.calendarYears} years`),
      ' — new highs are how a growing fund behaves, ',
      accent('not a signal to wait'),
    ],
    note:
      outlook.totalAthInstances > 0
        ? `In ${pct(outlook.neverFellPercent)} of those all-time highs the NAV never fell ${Math.abs(outlook.declineThresholdPercent)}% below that peak. Later declines started from much higher levels.`
        : undefined,
    noteTone: 'accent',
  }
}

/** Deck page 25: "Equity SIPs over 7+ years have given a good return experience". */
export function buildSipHeadline(sip: Investment['sip']): Headline | null {
  const scenarios = sip.scenarios
  if (scenarios.length === 0) return null

  const scenario =
    scenarios.find((candidate) => candidate.monthlyAmount === 10_000) ??
    scenarios[Math.floor(scenarios.length / 2)]

  return {
    parts: [
      `A ₹${scenario.monthlyAmount.toLocaleString('en-IN')} monthly SIP turned `,
      accent(rupees(scenario.moneyInvested)),
      ' of instalments into ',
      accentMark(rupees(scenario.currentValue)),
      ' — an XIRR of ',
      accent(pct(scenario.xirr, 1)),
    ],
    note: `Gain of ${rupees(scenario.totalGain)} on the way, and ${rupees(scenario.projectedValue10Y)} if the same SIP runs another 10 years.`,
  }
}

/** Deck page 19: number of times a lump sum multiplied. */
export function buildLumpsumHeadline(lumpsum: Investment['lumpsum']): Headline | null {
  const scenarios = lumpsum.scenarios
  if (scenarios.length === 0) return null

  const scenario = scenarios.reduce((best, candidate) =>
    candidate.principal > best.principal ? candidate : best,
  )

  return {
    parts: [
      `${rupees(scenario.principal)} invested at the start is `,
      accentMark(rupees(scenario.currentValue)),
      ' today — money multiplied ',
      accent(`${scenario.moneyMultiplied.toFixed(1)} times`),
      ' at ',
      accent(`${pct(scenario.cagr, 1)} a year`),
    ],
    note: 'Read the matrix below row-wise: each start year, held for a growing number of years.',
  }
}

/** Deck page 9: well-managed funds beating the index over the long run. */
export function buildBenchmarkHeadline(
  comparison: Performance['benchmarkComparison'],
  fundName: string,
  benchmarkName: string,
): Headline | null {
  if (comparison.fundTotalReturn === 0 && comparison.benchmarkTotalReturn === 0) return null

  const verb = comparison.outperformed ? 'beat' : 'trailed'

  return {
    parts: [
      `${shortFundName(fundName)} ${verb} ${benchmarkWords(benchmarkName)} in `,
      accentMark(`${pct(comparison.winningPercent)} of rolling windows`),
      ', by ',
      comparison.outperformed
        ? accent(pct(Math.abs(comparison.difference), 1))
        : alert(pct(-Math.abs(comparison.difference), 1)),
      ' in total return',
    ],
  }
}

export function buildVolatilityHeadline(
  volatility: Risk['volatility'],
  fundName: string,
): Headline | null {
  const daily = volatility.periods.find((period) => period.frequency === 'Daily')
  if (!daily || daily.observations === 0) return null

  return {
    parts: [
      `${shortFundName(fundName)} shows `,
      accent(volatility.volatilityBand.toLowerCase()),
      ' volatility at ',
      accentMark(pct(daily.annualisedVolatilityPercent, 1)),
      ' with a typical daily swing of ',
      accent(pct(daily.typicalSwingPercent, 2)),
    ],
    note: volatility.headline || undefined,
  }
}
