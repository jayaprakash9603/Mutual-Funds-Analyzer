import { requestJson } from '@/api/request'
import { API_ROUTES } from '@/api/routes'
import {
  drawdownPeersSchema,
  fundReportAssessmentEnvelopeSchema,
  fundReportAssessmentSchema,
  fundReportInvestmentEnvelopeSchema,
  fundReportInvestmentSchema,
  fundReportOverviewEnvelopeSchema,
  fundReportOverviewSchema,
  fundReportPerformanceEnvelopeSchema,
  fundReportPerformanceSchema,
  fundReportRiskEnvelopeSchema,
  fundReportRiskSchema,
  fundReportSchema,
  matrixReportSchema,
  peerComparisonSchema,
  type DrawdownPeers,
  type FundReport,
  type FundReportAssessment,
  type FundReportAssessmentEnvelope,
  type FundReportInvestment,
  type FundReportInvestmentEnvelope,
  type FundReportOverview,
  type FundReportOverviewEnvelope,
  type FundReportPerformance,
  type FundReportPerformanceEnvelope,
  type FundReportRisk,
  type FundReportRiskEnvelope,
  type MatrixReport,
  type PeerComparison,
} from './schemas'

export type {
  DrawdownPeers,
  FundReport,
  FundReportAssessment,
  FundReportAssessmentEnvelope,
  FundReportInvestment,
  FundReportInvestmentEnvelope,
  FundReportOverview,
  FundReportOverviewEnvelope,
  FundReportPerformance,
  FundReportPerformanceEnvelope,
  FundReportRisk,
  FundReportRiskEnvelope,
  MatrixReport,
  PeerComparison,
}

function withStartDate(params: Record<string, string>, startDate?: string): Record<string, string> {
  return startDate ? { ...params, start_date: startDate } : params
}

type FetchOptions = {
  startDate?: string
  signal?: AbortSignal
}

function reportParams(scheme: string, options?: FetchOptions): Record<string, string> {
  return withStartDate({ scheme }, options?.startDate)
}

export async function fetchFundReport(
  scheme: string,
  startDate?: string,
  signal?: AbortSignal,
): Promise<FundReport> {
  const data = await requestJson<unknown>(API_ROUTES.fundReport, {
    params: withStartDate({ scheme }, startDate),
    signal,
    label: 'Fund report',
  })
  return fundReportSchema.parse(data)
}

export async function fetchFundReportOverview(
  scheme: string,
  options?: FetchOptions,
): Promise<FundReportOverviewEnvelope> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportOverview, {
    params: reportParams(scheme, options),
    signal: options?.signal,
    label: 'Fund report overview',
  })
  return fundReportOverviewEnvelopeSchema.parse(data)
}

export async function fetchFundReportPerformance(
  scheme: string,
  options?: FetchOptions,
): Promise<FundReportPerformanceEnvelope> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportPerformance, {
    params: reportParams(scheme, options),
    signal: options?.signal,
    label: 'Fund report performance',
  })
  return fundReportPerformanceEnvelopeSchema.parse(data)
}

export async function fetchFundReportRisk(
  scheme: string,
  options?: FetchOptions,
): Promise<FundReportRiskEnvelope> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportRisk, {
    params: reportParams(scheme, options),
    signal: options?.signal,
    label: 'Fund report risk',
  })
  return fundReportRiskEnvelopeSchema.parse(data)
}

export async function fetchFundReportInvestment(
  scheme: string,
  options?: FetchOptions,
): Promise<FundReportInvestmentEnvelope> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportInvestment, {
    params: reportParams(scheme, options),
    signal: options?.signal,
    label: 'Fund report investment',
  })
  return fundReportInvestmentEnvelopeSchema.parse(data)
}

export async function fetchFundReportAssessment(
  scheme: string,
  options?: FetchOptions,
): Promise<FundReportAssessmentEnvelope> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportAssessment, {
    params: reportParams(scheme, options),
    signal: options?.signal,
    label: 'Fund report assessment',
  })
  return fundReportAssessmentEnvelopeSchema.parse(data)
}

export async function fetchFundReportMatrix(
  scheme: string,
  mode: 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M',
  startDate?: string,
  signal?: AbortSignal,
): Promise<MatrixReport> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportMatrix, {
    params: withStartDate({ scheme, mode }, startDate),
    signal,
    label: 'Matrix',
  })
  return matrixReportSchema.parse(data)
}

export async function fetchPeerComparison(
  scheme: string,
  category: string,
  signal?: AbortSignal,
): Promise<PeerComparison> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportPeers, {
    params: { scheme, category },
    signal,
    label: 'Peer comparison',
  })
  return peerComparisonSchema.parse(data)
}

export async function fetchDrawdownPeers(
  scheme: string,
  category: string,
  signal?: AbortSignal,
): Promise<DrawdownPeers> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportDrawdownPeers, {
    params: { scheme, category },
    signal,
    label: 'Drawdown peers',
  })
  return drawdownPeersSchema.parse(data)
}

export {
  fundReportOverviewSchema,
  fundReportPerformanceSchema,
  fundReportRiskSchema,
  fundReportInvestmentSchema,
  fundReportAssessmentSchema,
}
