/** Every backend path the frontend calls, shared by the API modules and the demo transport. */
export const API_ROUTES = {
  schemes: '/api/schemes',
  analysis: '/api/analysis',
  compare: '/api/analysis/compare',
  fundIndexMatrix: '/api/analysis/fund-index-matrix',
  features: '/api/features',
  fundReport: '/api/fund-report',
  fundReportMatrix: '/api/fund-report/matrix',
  fundReportPeers: '/api/fund-report/peers',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
