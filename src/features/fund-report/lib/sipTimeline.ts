import type { SipScenario, SipTimelinePoint } from '../schemas'

export function scaleTimeline(timeline: SipTimelinePoint[], factor: number): SipTimelinePoint[] {
  if (factor === 1) return timeline
  return timeline.map((point) => ({
    date: point.date,
    invested: point.invested * factor,
    corpus: point.corpus * factor,
    nav: point.nav,
  }))
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
