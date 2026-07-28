import type { ProgressiveFundReportGroups } from '../../hooks/useProgressiveFundReport'
import type { ReportSectionState } from '../../hooks/useReportSection'
import type {
  FundReportAssessment,
  FundReportInvestment,
  FundReportOverview,
  FundReportPerformance,
  FundReportRisk,
} from '../../schemas'
import type { SharedReportSnapshot } from './reportSnapshot'

const noop = () => {}

function staticSection<T>(data: T): ReportSectionState<T> {
  return {
    data,
    loading: false,
    error: null,
    refreshing: false,
    freshness: 'FRESH',
    unavailable: false,
    retry: noop,
  }
}

export function snapshotToGroups(snapshot: SharedReportSnapshot): ProgressiveFundReportGroups {
  return {
    overview: staticSection<FundReportOverview>(snapshot.overview),
    performance: staticSection<FundReportPerformance>(snapshot.performance),
    risk: staticSection<FundReportRisk>(snapshot.risk),
    investment: staticSection<FundReportInvestment>(snapshot.investment),
    assessment: staticSection<FundReportAssessment>(snapshot.assessment),
  }
}
