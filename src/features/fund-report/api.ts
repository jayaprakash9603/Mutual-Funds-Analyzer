import { requestJson } from '@/api/request'
import { API_ROUTES } from '@/api/routes'
import {
  normalizePerformanceEnvelope,
  normalizeRiskEnvelope,
  withFundReportDefaults,
} from './sectionDefaults'
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
  lumpsumSimulationSchema,
  sipSimulationSchema,
  stepUpSipSimulationSchema,
  swpSimulationSchema,
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
  type LumpsumSimulation,
  type MatrixReport,
  type PeerComparison,
  type SipSimulation,
  type StepUpMode,
  type StepUpSipSimulation,
  type SwpSimulation,
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
  return fundReportSchema.parse(withFundReportDefaults(data as Partial<FundReport> & Record<string, unknown>))
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
  return fundReportPerformanceEnvelopeSchema.parse(normalizePerformanceEnvelope(data))
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
  return fundReportRiskEnvelopeSchema.parse(normalizeRiskEnvelope(data))
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

import type { MatrixMode } from './lib/matrix/matrixCache'

export async function fetchFundReportMatrix(
  scheme: string,
  mode: MatrixMode,
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

export async function fetchSipSimulation(
  scheme: string,
  options: { amount: number; scheduleDay: number; startDate?: string; signal?: AbortSignal },
): Promise<SipSimulation> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportSipSimulate, {
    params: withStartDate(
      { scheme, amount: String(options.amount), schedule_day: String(options.scheduleDay) },
      options.startDate,
    ),
    signal: options.signal,
    label: 'SIP simulation',
  })
  return sipSimulationSchema.parse(data)
}

export async function fetchLumpsumSimulation(
  scheme: string,
  options: { principal: number; startDate?: string; signal?: AbortSignal },
): Promise<LumpsumSimulation> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportLumpsumSimulate, {
    params: withStartDate({ scheme, principal: String(options.principal) }, options.startDate),
    signal: options.signal,
    label: 'Lump sum simulation',
  })
  return lumpsumSimulationSchema.parse(data)
}

export async function fetchSwpSimulation(
  scheme: string,
  options: {
    initialCorpus: number
    monthlyWithdrawal: number
    scheduleDay: number
    startDate?: string
    signal?: AbortSignal
  },
): Promise<SwpSimulation> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportSwpSimulate, {
    params: withStartDate(
      {
        scheme,
        initial_corpus: String(options.initialCorpus),
        monthly_withdrawal: String(options.monthlyWithdrawal),
        schedule_day: String(options.scheduleDay),
      },
      options.startDate,
    ),
    signal: options.signal,
    label: 'SWP simulation',
  })
  return swpSimulationSchema.parse(data)
}

export async function fetchStepUpSipSimulation(
  scheme: string,
  options: {
    initialAmount: number
    scheduleDay: number
    stepUpMode: StepUpMode
    stepUpPercent: number
    stepUpAmount: number
    startDate?: string
    signal?: AbortSignal
  },
): Promise<StepUpSipSimulation> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportStepUpSipSimulate, {
    params: withStartDate(
      {
        scheme,
        initial_amount: String(options.initialAmount),
        schedule_day: String(options.scheduleDay),
        step_up_mode: options.stepUpMode,
        step_up_percent: String(options.stepUpPercent),
        step_up_amount: String(options.stepUpAmount),
      },
      options.startDate,
    ),
    signal: options.signal,
    label: 'Step Up SIP simulation',
  })
  return stepUpSipSimulationSchema.parse(data)
}

export {
  fundReportOverviewSchema,
  fundReportPerformanceSchema,
  fundReportRiskSchema,
  fundReportInvestmentSchema,
  fundReportAssessmentSchema,
}
