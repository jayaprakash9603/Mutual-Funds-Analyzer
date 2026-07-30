export const METRIC_DICTIONARY: Record<string, string> = {
  cagr: 'Compound Annual Growth Rate — average yearly return if profits were reinvested.',
  cob: 'Chance of Beating benchmark — % of rolling windows where the fund beat its index.',
  sharpe: 'Return earned per unit of risk. Higher is better.',
  alpha: 'Extra return vs benchmark after adjusting for market movement.',
  beta: 'Sensitivity to market moves. 1.0 moves with the market; above 1 is more volatile.',
  maxDrawdown: 'Largest peak-to-trough fall — your worst historical loss from a high.',
  consistencyScore: 'Blend of beating benchmark, Sharpe edge, and rolling return strength.',
  xirr: 'Internal rate of return for irregular cash flows like SIP.',
  volatility: 'How much returns swing up and down — higher means bumpier ride.',
  sortino: 'Like Sharpe but only penalises downside volatility.',
  treynor: 'Return per unit of market risk (beta).',
  informationRatio: 'Consistency of beating the benchmark.',
  trackingError: 'How far fund returns deviate from the benchmark.',
  ulcerIndex: 'Measures depth and duration of drawdowns — lower is smoother.',
  calmar: 'Return divided by max drawdown — reward for pain taken.',
  valueAtRisk95: 'Worst daily loss in the bottom 5% of days.',
  rollingVolatility: 'Annualised volatility over a rolling 1-year window of daily returns.',
  typicalSwing: 'Average absolute move per period — how far price typically swings up or down.',
  weeklyVolatility: 'Annualised volatility based on week-to-week returns.',
  monthlyVolatility: 'Annualised volatility based on month-to-month returns.',
  worstDay: 'Largest single-period loss in the analysis window.',
  bestDay: 'Largest single-period gain in the analysis window.',
}

export function explainMetric(key: string) {
  return METRIC_DICTIONARY[key] ?? 'Metric derived from historical NAV data.'
}
