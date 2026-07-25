import { describe, it, expect } from 'vitest'
import { evaluateGoldenTriangle, computeFundMetrics } from '@/lib/analytics/metrics'
import type { RollingReturnRow } from '@/lib/analytics/types'

function makeRow(
  navDate: string,
  forwardDate: string,
  nav: number,
  forwardNav: number,
  rollingReturn: number,
  name: string,
): RollingReturnRow {
  return {
    id: Math.random(),
    scheme_category: 'Equity: Flexi Cap',
    scheme_name: name,
    period: '5 Year',
    nav_date: navDate,
    scheme_nav: nav,
    scheme_forward_date: forwardDate,
    scheme_forward_nav: forwardNav,
    scheme_rolling_returns: rollingReturn,
  }
}

function generateSeries(
  name: string,
  startYear: number,
  count: number,
  baseReturn: number,
  volatility: number,
): RollingReturnRow[] {
  const rows: RollingReturnRow[] = []
  let nav = 10
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < count; i++) {
    const year = startYear + Math.floor(i / 252)
    const month = months[i % 12]
    const day = (i % 28) + 1
    const forwardYear = year + 5
    const navDate = `${month} ${day}, ${year}, 12:00:00 AM`
    const forwardDate = `${month} ${day}, ${forwardYear}, 12:00:00 AM`

    const dailyReturn = (baseReturn / 100 / 252) + (Math.sin(i * 0.1) * volatility / 100 / 252)
    nav *= 1 + dailyReturn
    const forwardNav = nav * Math.pow(1 + baseReturn / 100, 5)
    const rollingReturn = baseReturn + Math.sin(i * 0.05) * volatility

    rows.push(makeRow(navDate, forwardDate, nav, forwardNav, rollingReturn, name))
  }

  return rows
}

describe('Golden Triangle Analytics Engine', () => {
  it('evaluates rolling return rule correctly', () => {
    const fund = generateSeries('Test Fund', 2013, 500, 18, 3)
    const benchmark = generateSeries('Nifty 500 TRI', 2013, 500, 14, 4)

    const result = evaluateGoldenTriangle({ fund, benchmark, period: '5 Year' })

    expect(result.metrics.fundRollingAvg).toBeGreaterThan(result.metrics.benchmarkRollingAvg)
    expect(result.rules[0].passed).toBe(true)
  })

  it('computes COB as percentage of windows beating benchmark', () => {
    const fund = generateSeries('Test Fund', 2013, 300, 20, 2)
    const benchmark = generateSeries('Nifty 500 TRI', 2013, 300, 12, 2)

    const result = evaluateGoldenTriangle({ fund, benchmark, period: '5 Year' })

    expect(result.metrics.cob).toBeGreaterThan(70)
    expect(result.rules[1].passed).toBe(true)
  })

  it('computes Sharpe ratio and compares fund vs benchmark', () => {
    const fund = generateSeries('Test Fund', 2013, 800, 19, 2)
    const benchmark = generateSeries('Nifty 500 TRI', 2013, 800, 15, 5)

    const metrics = computeFundMetrics({ fund, benchmark, period: '5 Year' })

    expect(metrics.fundSharpe).toBeGreaterThan(0)
    expect(metrics.benchmarkSharpe).toBeGreaterThan(0)
    expect(typeof metrics.alpha).toBe('number')
    expect(typeof metrics.beta).toBe('number')
    expect(metrics.maxDrawdown).toBeLessThanOrEqual(0)
  })

  it('assigns overall rating based on pass count', () => {
    const fund = generateSeries('Strong Fund', 2013, 600, 22, 1.5)
    const benchmark = generateSeries('Weak Benchmark', 2013, 600, 10, 6)

    const result = evaluateGoldenTriangle({ fund, benchmark, period: '5 Year' })

    expect(result.passCount).toBeGreaterThanOrEqual(2)
    expect(['Passed', 'Average']).toContain(result.overallRating)
  })

  it('marks fund as failed when all rules fail', () => {
    const fund = generateSeries('Weak Fund', 2013, 200, 8, 8)
    const benchmark = generateSeries('Strong Benchmark', 2013, 200, 20, 2)

    const result = evaluateGoldenTriangle({ fund, benchmark, period: '5 Year' })

    expect(result.passed).toBe(false)
    expect(result.overallRating).toMatch(/Weak|Avoid|Average/)
  })
})
