import { useEffect, useRef, useState } from 'react'
import { useFeature } from '@/context/FeatureFlagProvider'
import {
  fetchFundReportAssessment,
  fetchFundReportInvestment,
  fetchFundReportOverview,
  fetchFundReportPerformance,
  fetchFundReportRisk,
} from '../api'
import {
  splitFundReport,
  type FundReportAssessment,
  type FundReportInvestment,
  type FundReportOverview,
  type FundReportPerformance,
  type FundReportRisk,
  type ReportFreshness,
} from '../schemas'
import { useFundReport } from './useFundReport'
import { useReportSection, type ReportSectionState } from './useReportSection'

export type ProgressiveFundReportGroups = {
  overview: ReportSectionState<FundReportOverview>
  performance: ReportSectionState<FundReportPerformance>
  risk: ReportSectionState<FundReportRisk>
  investment: ReportSectionState<FundReportInvestment>
  assessment: ReportSectionState<FundReportAssessment>
}

export type UseProgressiveFundReportResult = ProgressiveFundReportGroups & {
  isLegacy: boolean
  anyLoading: boolean
}

function emptyLegacyGroup(
  legacy: ReturnType<typeof useFundReport>,
): ReportSectionState<never> {
  return {
    data: null,
    loading: legacy.loading,
    error: legacy.error,
    refreshing: false,
    freshness: null,
    unavailable: false,
    retry: () => void legacy.refetch(),
  }
}

function mapLegacyToGroups(
  legacy: ReturnType<typeof useFundReport>,
): ProgressiveFundReportGroups | null {
  if (!legacy.data) return null
  const groups = splitFundReport(legacy.data)
  const shared = {
    loading: legacy.loading,
    error: legacy.error,
    refreshing: false,
    freshness: null as ReportFreshness | null,
    unavailable: false,
    retry: () => void legacy.refetch(),
  }
  return {
    overview: { data: groups.overview, ...shared },
    performance: { data: groups.performance, ...shared },
    risk: { data: groups.risk, ...shared },
    investment: { data: groups.investment, ...shared },
    assessment: { data: groups.assessment, ...shared },
  }
}

export function useProgressiveFundReport(
  scheme: string | null,
  startDate?: string,
): UseProgressiveFundReportResult {
  const progressiveEnabled = useFeature('analysis.fundReportProgressive')
  const [useLegacy, setUseLegacy] = useState(false)
  const legacyFallbackTriggered = useRef(false)

  useEffect(() => {
    legacyFallbackTriggered.current = false
    setUseLegacy(false)
  }, [scheme, startDate, progressiveEnabled])

  const progressiveActive = progressiveEnabled && !useLegacy

  const overview = useReportSection({
    scheme,
    startDate,
    enabled: progressiveActive,
    fetchSection: (s, d, signal) => fetchFundReportOverview(s, { startDate: d, signal }),
  })

  const performance = useReportSection({
    scheme,
    startDate,
    enabled: progressiveActive,
    fetchSection: (s, d, signal) => fetchFundReportPerformance(s, { startDate: d, signal }),
  })

  const risk = useReportSection({
    scheme,
    startDate,
    enabled: progressiveActive,
    fetchSection: (s, d, signal) => fetchFundReportRisk(s, { startDate: d, signal }),
  })

  const investment = useReportSection({
    scheme,
    startDate,
    enabled: progressiveActive,
    fetchSection: (s, d, signal) => fetchFundReportInvestment(s, { startDate: d, signal }),
  })

  const assessment = useReportSection({
    scheme,
    startDate,
    enabled: progressiveActive,
    fetchSection: (s, d, signal) => fetchFundReportAssessment(s, { startDate: d, signal }),
  })

  const legacy = useFundReport(progressiveActive ? null : scheme, startDate)

  useEffect(() => {
    if (!progressiveActive || legacyFallbackTriggered.current) return

    const shouldFallback = [overview, performance, risk, investment, assessment].some(
      (section) => section.unavailable,
    )

    if (shouldFallback) {
      legacyFallbackTriggered.current = true
      setUseLegacy(true)
    }
  }, [
    progressiveActive,
    overview.unavailable,
    performance.unavailable,
    risk.unavailable,
    investment.unavailable,
    assessment.unavailable,
  ])

  const progressiveGroups: ProgressiveFundReportGroups = {
    overview,
    performance,
    risk,
    investment,
    assessment,
  }

  if (!progressiveEnabled || useLegacy) {
    const legacyGroups = mapLegacyToGroups(legacy)
    const empty = emptyLegacyGroup(legacy)
    return {
      overview: legacyGroups?.overview ?? (empty as ReportSectionState<FundReportOverview>),
      performance: legacyGroups?.performance ?? (empty as ReportSectionState<FundReportPerformance>),
      risk: legacyGroups?.risk ?? (empty as ReportSectionState<FundReportRisk>),
      investment: legacyGroups?.investment ?? (empty as ReportSectionState<FundReportInvestment>),
      assessment: legacyGroups?.assessment ?? (empty as ReportSectionState<FundReportAssessment>),
      isLegacy: true,
      anyLoading: legacy.loading,
    }
  }

  const anyLoading = Object.values(progressiveGroups).some(
    (group) => group.loading && group.data == null,
  )

  return {
    ...progressiveGroups,
    isLegacy: false,
    anyLoading,
  }
}
