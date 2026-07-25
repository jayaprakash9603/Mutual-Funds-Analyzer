import { requestJson } from '@/api/request'
import { API_ROUTES } from '@/api/routes'
import {
  fundReportSchema,
  matrixReportSchema,
  peerComparisonSchema,
  type FundReport,
  type MatrixReport,
  type PeerComparison,
} from './schemas'

export type { FundReport, MatrixReport, PeerComparison }

function withStartDate(params: Record<string, string>, startDate?: string): Record<string, string> {
  return startDate ? { ...params, start_date: startDate } : params
}

export async function fetchFundReport(scheme: string, startDate?: string): Promise<FundReport> {
  const data = await requestJson<unknown>(API_ROUTES.fundReport, {
    params: withStartDate({ scheme }, startDate),
    label: 'Fund report',
  })
  return fundReportSchema.parse(data)
}

export async function fetchFundReportMatrix(
  scheme: string,
  mode: 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M',
  startDate?: string,
): Promise<MatrixReport> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportMatrix, {
    params: withStartDate({ scheme, mode }, startDate),
    label: 'Matrix',
  })
  return matrixReportSchema.parse(data)
}

export async function fetchPeerComparison(scheme: string, category: string): Promise<PeerComparison> {
  const data = await requestJson<unknown>(API_ROUTES.fundReportPeers, {
    params: { scheme, category },
    label: 'Peer comparison',
  })
  return peerComparisonSchema.parse(data)
}
