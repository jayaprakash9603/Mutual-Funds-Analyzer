import type { SipScenario, SipTimelinePoint, SwpTimelinePoint } from '../schemas'

type CorpusTimelinePoint = {
  date: string
  corpus: number
  averageCorpus?: number
}

type MonthAverageTracker = {
  sum: number
  count: number
  lastAverage: number
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function dayOfMonth(isoDate: string): number {
  return Number.parseInt(isoDate.slice(8, 10), 10)
}

export function enrichMonthlyAverageCorpus<T extends CorpusTimelinePoint>(
  timeline: T[],
): Array<T & { averageCorpus: number }> {
  if (timeline.length === 0) return timeline as Array<T & { averageCorpus: number }>

  const trackers = new Map<string, MonthAverageTracker>()

  return timeline.map((point) => {
    const day = dayOfMonth(point.date)
    const key = monthKey(point.date)
    const tracker = trackers.get(key) ?? { sum: 0, count: 0, lastAverage: point.corpus }

    let averageCorpus: number
    if (day >= 1 && day <= 30) {
      tracker.sum += point.corpus
      tracker.count += 1
      averageCorpus = tracker.sum / tracker.count
      tracker.lastAverage = averageCorpus
    } else {
      averageCorpus = tracker.count > 0 ? tracker.lastAverage : point.corpus
    }

    trackers.set(key, tracker)
    return { ...point, averageCorpus }
  })
}

type SipTimelineInput = Omit<SipTimelinePoint, 'averageCorpus'> & { averageCorpus?: number }

export function scaleTimeline(timeline: SipTimelineInput[], factor: number): SipTimelinePoint[] {
  if (factor === 1) return enrichMonthlyAverageCorpus(timeline) as SipTimelinePoint[]
  const scaled = timeline.map((point) => ({
    date: point.date,
    invested: point.invested * factor,
    corpus: point.corpus * factor,
    nav: point.nav,
  }))
  return enrichMonthlyAverageCorpus(scaled) as SipTimelinePoint[]
}

export function scaleSwpTimeline(timeline: SwpTimelinePoint[], factor: number): SwpTimelinePoint[] {
  if (factor === 1) return enrichMonthlyAverageCorpus(timeline) as SwpTimelinePoint[]
  const scaled = timeline.map((point) => ({
    date: point.date,
    corpus: point.corpus * factor,
    withdrawn: point.withdrawn * factor,
    nav: point.nav,
  }))
  return enrichMonthlyAverageCorpus(scaled) as SwpTimelinePoint[]
}

export function scaleScenario(scenario: SipScenario, factor: number): SipScenario {
  if (factor === 1) return scenario
  return {
    ...scenario,
    monthlyAmount: Math.round(scenario.monthlyAmount * factor),
    currentValue: scenario.currentValue * factor,
    totalGain: scenario.totalGain * factor,
    moneyInvested: scenario.moneyInvested * factor,
    projectedValue10Y: scenario.projectedValue10Y * factor,
    stcg: (scenario.stcg ?? 0) * factor,
    ltcg: (scenario.ltcg ?? 0) * factor,
  }
}

export function findScenarioForAmount(scenarios: SipScenario[], amount: number): SipScenario | null {
  return scenarios.find((row) => row.monthlyAmount === amount) ?? scenarios[0] ?? null
}
