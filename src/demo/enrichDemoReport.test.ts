import { describe, expect, it } from 'vitest'
import {
  buildDemoStpTimeline,
  buildDemoSwpTimeline,
  enrichDemoFundReport,
  enrichDemoPeers,
} from './enrichDemoReport'

function sampleReport() {
  const years = Array.from({ length: 12 }, (_, index) => ({
    year: 2014 + index,
    returnPercent: index === 4 ? -12 : 8 + index * 1.5,
    intraYearDrawdown: -10 - index,
  }))
  const series = Array.from({ length: 120 }, (_, index) => {
    const year = 2014 + Math.floor(index / 10)
    const month = (index % 10) + 1
    return {
      date: `${year}-${String(month).padStart(2, '0')}-15`,
      drawdownPercent: index % 17 === 0 ? -15 : -((index % 9) * 1.2),
    }
  })
  return {
    scheme: 'Demo Fund',
    profile: {
      fundName: 'Demo Fund',
      latestNav: 120,
      fundAgeYears: 12,
      dataFrom: '2014-01-15T00:00:00Z',
      dataTo: '2025-12-15T00:00:00Z',
    },
    consistency: { calendarYears: years },
    drawdown: { series, episodes: [] },
    sip: {
      scenarios: [
        {
          monthlyAmount: 10_000,
          currentValue: 500_000,
          totalGain: 300_000,
          xirr: 18,
          moneyInvested: 200_000,
          projectedValue10Y: 900_000,
        },
      ],
    },
    lumpsum: {
      scenarios: [
        {
          principal: 100_000,
          currentValue: 400_000,
          gain: 300_000,
          cagr: 16,
          moneyMultiplied: 4,
        },
      ],
    },
    probability: {
      positiveReturn: 90,
      beatInflation: 80,
      beatBenchmark: 70,
      above10Cagr: 75,
      doubleMoney: 65,
      tripleMoney: 40,
    },
    risk: { volatility: 18, standardDeviation: 18 },
  }
}

describe('enrichDemoFundReport', () => {
  it('fills indexed NAV, calendar insights, and SIP timeline', () => {
    const enriched = enrichDemoFundReport(sampleReport()) as {
      drawdown: { indexedNav: unknown[] }
      calendarYearInsights: {
        profitBooking: { rows: unknown[] }
        distribution: { buckets: unknown[] }
      }
      sip: { timeline: unknown[]; chartAmount: number }
      lumpsum: { timeline: unknown[] }
      bestDays: { missingScenarios: unknown[] }
      allTimeHighs: { series: unknown[] }
      volatility: { periods: unknown[] }
      multiplyOdds: { rows: unknown[] }
      stepUpSip: { scenarios: unknown[] }
    }

    expect(enriched.drawdown.indexedNav.length).toBeGreaterThan(50)
    expect(enriched.calendarYearInsights.profitBooking.rows.length).toBeGreaterThan(0)
    expect(enriched.calendarYearInsights.distribution.buckets.length).toBeGreaterThan(0)
    expect(enriched.sip.timeline.length).toBeGreaterThan(20)
    expect(enriched.sip.chartAmount).toBe(10_000)
    expect(enriched.lumpsum.timeline.length).toBeGreaterThan(10)
    expect(enriched.bestDays.missingScenarios.length).toBeGreaterThan(0)
    expect(enriched.allTimeHighs.series.length).toBeGreaterThan(0)
    expect(enriched.volatility.periods.length).toBeGreaterThan(0)
    expect(enriched.multiplyOdds.rows.length).toBeGreaterThan(0)
    expect(enriched.stepUpSip.scenarios.length).toBeGreaterThan(0)
  })

  it('leaves empty minimal reports alone', () => {
    const minimal = { scheme: 'X' }
    expect(enrichDemoFundReport(minimal)).toEqual(minimal)
  })
})

describe('enrichDemoPeers', () => {
  it('adds horizon returns for category peers', () => {
    const enriched = enrichDemoPeers({
      peers: [
        {
          scheme: 'Peer A',
          average: 18,
          maximum: 40,
          minimum: 2,
          stdDev: 8,
          cob: 70,
          totalRecords: 1000,
          sharpe: 1.1,
          maxDrawdown: -35,
          consistencyScore: 80,
          selected: true,
        },
      ],
      highlights: [],
      periodLabel: '5 Year',
    }) as {
      peers: Array<{ horizonReturns: Array<{ label: string; cagrPercent: number | null }> }>
      longRunAnalysis?: { horizonLabels: string[] }
    }

    expect(enriched.peers[0].horizonReturns.length).toBeGreaterThanOrEqual(3)
    expect(enriched.peers[0].horizonReturns.some((h) => h.cagrPercent != null)).toBe(true)
    expect(enriched.longRunAnalysis?.horizonLabels.length).toBeGreaterThan(0)
  })
})

describe('demo simulate timelines', () => {
  it('builds SWP and STP timelines from indexed NAV', () => {
    const enriched = enrichDemoFundReport(sampleReport()) as {
      drawdown: { indexedNav: Array<{ date: string; indexValue: number; nav?: number }> }
    }
    const nav = enriched.drawdown.indexedNav
    const swp = buildDemoSwpTimeline(nav, 1_000_000, 10_000)
    const stp = buildDemoStpTimeline(nav, 1_000_000, 6)
    expect(swp.timeline.length).toBeGreaterThan(10)
    expect(swp.scenario.totalWithdrawn).toBeGreaterThan(0)
    expect(stp.timeline.length).toBeGreaterThan(5)
    expect(stp.scenario.totalTransferred).toBeGreaterThan(0)
  })
})
