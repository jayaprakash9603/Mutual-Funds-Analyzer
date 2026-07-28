import { describe, expect, it } from 'vitest'
import { enrichMonthlyAverageCorpus, scaleTimeline } from './sipTimeline'

describe('enrichMonthlyAverageCorpus', () => {
  it('computes month-to-date running average from corpus', () => {
    const timeline = [
      { date: '2024-01-01', corpus: 100, invested: 100, nav: 10 },
      { date: '2024-01-02', corpus: 200, invested: 100, nav: 10 },
      { date: '2024-01-03', corpus: 300, invested: 100, nav: 10 },
    ]

    const enriched = enrichMonthlyAverageCorpus(timeline)

    expect(enriched[0].averageCorpus).toBe(100)
    expect(enriched[1].averageCorpus).toBe(150)
    expect(enriched[2].averageCorpus).toBe(200)
  })

  it('recomputes average when stale averageCorpus values are present', () => {
    const timeline = [
      { date: '2024-01-01', corpus: 200, invested: 200, nav: 10, averageCorpus: 100 },
      { date: '2024-01-02', corpus: 400, invested: 200, nav: 10, averageCorpus: 100 },
    ]

    const enriched = enrichMonthlyAverageCorpus(timeline)

    expect(enriched[0].averageCorpus).toBe(200)
    expect(enriched[1].averageCorpus).toBe(300)
  })
})

describe('scaleTimeline', () => {
  it('scales average corpus together with corpus when amount changes', () => {
    const base = [
      { date: '2024-01-01', corpus: 10_000, invested: 10_000, nav: 100, averageCorpus: 10_000 },
      { date: '2024-01-02', corpus: 20_000, invested: 10_000, nav: 100, averageCorpus: 15_000 },
    ]

    const scaled = scaleTimeline(base, 0.1)

    expect(scaled[0].corpus).toBe(1_000)
    expect(scaled[0].averageCorpus).toBe(1_000)
    expect(scaled[1].corpus).toBe(2_000)
    expect(scaled[1].averageCorpus).toBe(1_500)
  })
})
