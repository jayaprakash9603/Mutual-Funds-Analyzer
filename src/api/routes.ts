/** Every backend path the frontend calls, shared by the API modules and the demo transport. */
export const API_ROUTES = {
  schemes: '/api/schemes',
  analysis: '/api/analysis',
  compare: '/api/analysis/compare',
  fundIndexMatrix: '/api/analysis/fund-index-matrix',
  features: '/api/features',
  fundReport: '/api/fund-report',
  fundReportOverview: '/api/fund-report/overview',
  fundReportPerformance: '/api/fund-report/performance',
  fundReportRisk: '/api/fund-report/risk',
  fundReportInvestment: '/api/fund-report/investment',
  fundReportAssessment: '/api/fund-report/assessment',
  fundReportMatrix: '/api/fund-report/matrix',
  fundReportSipSimulate: '/api/fund-report/sip/simulate',
  fundReportLumpsumSimulate: '/api/fund-report/lumpsum/simulate',
  fundReportSwpSimulate: '/api/fund-report/swp/simulate',
  fundReportStepUpSipSimulate: '/api/fund-report/step-up-sip/simulate',
  fundReportStpSimulate: '/api/fund-report/stp/simulate',
  fundReportPeers: '/api/fund-report/peers',
  fundReportDrawdownPeers: '/api/fund-report/drawdown-peers',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
