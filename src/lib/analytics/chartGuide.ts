export type ChartGuide = {
  title: string
  summary: string
  explanation: string
  useCase: string
  /** Full-width on large screens for time-series readability */
  wide?: boolean
  /** Square / compact gauge-style charts */
  compact?: boolean
}

export const CHART_GUIDES = {
  rollingComparison: {
    title: 'Rolling Return Comparison',
    summary: 'Fund vs benchmark returns across rolling windows over time.',
    explanation:
      'Each point is the annualised return for a fixed holding period ending on that date. When the fund line stays above the benchmark, the fund beat the index for that window.',
    useCase:
      'Use this to judge consistency — prefer funds that stay above the benchmark across market cycles, not only in a few strong years.',
    wide: true,
  },
  cobGauge: {
    title: 'COB Gauge',
    summary: 'Chance of Outperformance — how often the fund beat its benchmark.',
    explanation:
      'COB is the percentage of rolling windows where the fund return exceeded the benchmark. Closer to 100% means the fund won more often historically.',
    useCase:
      'Quick filter for active funds: a high COB supports the case for paying for active management versus an index fund.',
    compact: true,
  },
  sharpeComparison: {
    title: 'Sharpe Comparison',
    summary: 'Risk-adjusted return of the fund versus the benchmark.',
    explanation:
      'Sharpe measures excess return per unit of volatility. A higher fund bar means better compensation for the risk taken, relative to the benchmark.',
    useCase:
      'Compare two funds with similar returns: pick the one with the higher Sharpe when you want smoother ride for similar reward.',
  },
  returnsArea: {
    title: 'Fund vs Benchmark Returns',
    summary: 'Cumulative growth path of the fund against its benchmark.',
    explanation:
      'Shows how ₹ invested would have grown over the full history. The gap between the two areas is the cumulative out/underperformance.',
    useCase:
      'Best for long-horizon investors deciding whether staying invested through drawdowns was rewarded versus the index.',
    wide: true,
  },
  alphaComparison: {
    title: 'Alpha Comparison',
    summary: 'Excess return generated beyond what market risk (beta) would imply.',
    explanation:
      'Positive alpha means the fund delivered return above its expected return given market exposure. Near-zero alpha suggests index-like behaviour.',
    useCase:
      'Validate skill vs luck: sustained positive alpha is a stronger signal than a single strong calendar year.',
  },
  riskReturn: {
    title: 'Risk vs Return',
    summary: 'Plot of annualised volatility (risk) against annualised return.',
    explanation:
      'Ideal position is higher (more return) and leftward (less risk). Compare the fund’s bubble to where you would expect peers or the benchmark to sit.',
    useCase:
      'Screen for efficient funds — reject options that sit lower-right (more risk, less return) relative to alternatives.',
  },
  maxDrawdown: {
    title: 'Maximum Drawdown',
    summary: 'Peak-to-trough losses over time — how deep and how long pain lasted.',
    explanation:
      'Drawdown is the percentage fall from a previous peak. Deeper or longer troughs mean you needed stronger conviction (or cash buffers) to stay invested.',
    useCase:
      'Stress-test your holding period: if you cannot tolerate the deepest trough shown, size the allocation smaller or choose a milder fund.',
    wide: true,
  },
  radar: {
    title: 'Multi-Factor Radar',
    summary: 'Fund and benchmark scored across key Golden Triangle dimensions.',
    explanation:
      'Axes cover rolling return, COB, Sharpe, alpha, and risk (normalised). A larger green shape means broader strength; orange shows the benchmark baseline.',
    useCase:
      'Spot unbalanced funds — e.g. strong returns but weak Sharpe/risk — before you overweight a single metric.',
    compact: true,
  },
  monthlyHeatmap: {
    title: 'Monthly Performance',
    summary: 'Month-by-month return pattern across the available history.',
    explanation:
      'Each bar is a calendar month’s return. Clusters of red bars highlight stress periods; green clusters show favourable regimes.',
    useCase:
      'Check seasonality and recovery behaviour — useful before starting a SIP or timing a lump-sum after a weak streak.',
    wide: true,
  },
  annualReturns: {
    title: 'Annual Returns',
    summary: 'Calendar-year returns for fund and benchmark side by side.',
    explanation:
      'Grouped bars show who won each year. Look for fewer deep negative years and how often the fund led the benchmark.',
    useCase:
      'Communicate outcomes simply: year-by-year tables are easier for review meetings than rolling statistics alone.',
    wide: true,
  },
  rollingTimeline: {
    title: 'Rolling Return Timeline',
    summary: 'Single-series view of the fund’s rolling return path.',
    explanation:
      'Focuses only on the fund’s rolling return trajectory so you can see regime shifts without the benchmark overlay.',
    useCase:
      'Identify entry windows after prolonged soft patches, or confirm that recent strength is not a one-off spike.',
    wide: true,
  },
  waterfall: {
    title: 'Performance Waterfall',
    summary: 'Breakdown of what contributed to the fund’s edge versus the benchmark.',
    explanation:
      'Bars decompose return drivers (e.g. rolling edge, risk adjustment). Positive bars add to the case for the fund; negative bars drag it.',
    useCase:
      'Diagnose whether outperformance came from higher returns, better risk control, or a mix — before you attribute skill.',
  },
  scoreDoughnut: {
    title: 'Fund Score Doughnut',
    summary: 'Share of Golden Triangle rules passed versus remaining gap.',
    explanation:
      'Visual split of pass vs fail on the core scoring rules. A fuller primary segment means more of the framework criteria are met.',
    useCase:
      'At-a-glance health check when scanning many funds — drill into individual charts when the doughnut is incomplete.',
    compact: true,
  },
  riskMeter: {
    title: 'Risk Meter',
    summary: 'Categorised risk score derived from volatility and related metrics.',
    explanation:
      'Maps the fund into a risk band (lower is calmer). Use it alongside drawdown — a “moderate” label can still hide deep troughs.',
    useCase:
      'Align product risk with investor risk capacity before you recommend allocation size.',
  },
  volatility: {
    title: 'Volatility Chart',
    summary: 'How bumpy returns were over time (standard deviation path).',
    explanation:
      'Rising volatility means a choppier ride ahead historically. Compare spikes to market stress periods on the drawdown chart.',
    useCase:
      'Decide SIP vs lump sum: higher recent volatility often favours staggered deployment for nervous investors.',
    wide: true,
  },
  distribution: {
    title: 'Rolling Return Distribution',
    summary: 'Histogram of how often returns fell into each bucket.',
    explanation:
      'Shows the shape of outcomes — concentrated around a positive mean is healthier than a wide left tail of deep negatives.',
    useCase:
      'Probability framing: estimate how often you might have seen returns above/below a target CAGR.',
    wide: true,
  },
  consistency: {
    title: 'Consistency Score',
    summary: 'Composite scores for beating the benchmark, Sharpe edge, and rolling strength.',
    explanation:
      'Each bar is a normalised consistency pillar. Balanced high bars beat a single spiked metric with weak companions.',
    useCase:
      'Prefer funds that score evenly when building a core portfolio sleeve meant to be held for 5+ years.',
  },
} as const satisfies Record<string, ChartGuide>
