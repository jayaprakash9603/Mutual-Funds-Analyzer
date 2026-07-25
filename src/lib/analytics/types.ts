export interface RollingReturnRow {
  id: number
  scheme_company?: string
  scheme_category: string
  scheme_name: string
  period?: string
  nav_date: string
  scheme_nav: number
  scheme_forward_date: string
  scheme_forward_nav: number
  scheme_rolling_returns: number
}

export interface NavPoint {
  date: Date
  nav: number
}

export interface AlignedRollingPoint {
  date: Date
  fundReturn: number
  benchmarkReturn: number
}

export interface ManualInputs {
  expenseRatio?: number
  benchmarkExpenseRatio?: number
  aum?: number
  fundRating?: number
}

export interface RuleResult {
  id: 'rollingReturn' | 'cob' | 'sharpe'
  label: string
  passed: boolean
  fundValue: number
  benchmarkValue: number
  description: string
}

export type OverallRating = 'Passed' | 'Average' | 'Weak' | 'Avoid'

export interface FundMetrics {
  fundRollingAvg: number
  benchmarkRollingAvg: number
  fundRollingMax: number
  fundRollingMin: number
  benchmarkRollingMax: number
  benchmarkRollingMin: number
  cob: number
  fundSharpe: number
  benchmarkSharpe: number
  fundAnnReturn: number
  benchmarkAnnReturn: number
  fundVolatility: number
  benchmarkVolatility: number
  alpha: number
  beta: number
  sortino: number
  treynor: number
  informationRatio: number
  maxDrawdown: number
  benchmarkMaxDrawdown: number
  totalReturn: number
  benchmarkTotalReturn: number
  riskLevel: string
  fundAgeYears: number
  consistencyScore: number
}

export interface GoldenTriangleResult {
  rules: RuleResult[]
  passCount: number
  overallRating: OverallRating
  passed: boolean
  metrics: FundMetrics
  fundName: string
  benchmarkName: string
  category: string
  period: string
}

export interface AnalysisInput {
  fund: RollingReturnRow[]
  benchmark: RollingReturnRow[]
  period: string
  manual?: ManualInputs
}
