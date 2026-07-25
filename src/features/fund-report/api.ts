import { ApiError } from '@/api/client'
import {
  fundReportSchema,
  matrixReportSchema,
  peerComparisonSchema,
  type FundReport,
  type MatrixReport,
  type PeerComparison,
} from './schemas'

export type { FundReport, MatrixReport, PeerComparison }

export async function fetchFundReport(scheme: string, startDate?: string): Promise<FundReport> {
  const params = new URLSearchParams({ scheme })
  if (startDate) params.set('start_date', startDate)
  const res = await fetch(`/api/fund-report?${params}`)
  if (!res.ok) throw new ApiError(`Fund report failed (${res.status})`, res.status)
  return fundReportSchema.parse(await res.json())
}

export async function fetchFundReportMatrix(
  scheme: string,
  mode: 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M',
  startDate?: string,
): Promise<MatrixReport> {
  const params = new URLSearchParams({ scheme, mode })
  if (startDate) params.set('start_date', startDate)
  const res = await fetch(`/api/fund-report/matrix?${params}`)
  if (!res.ok) throw new ApiError(`Matrix failed (${res.status})`, res.status)
  return matrixReportSchema.parse(await res.json())
}

export async function fetchPeerComparison(scheme: string, category: string): Promise<PeerComparison> {
  const params = new URLSearchParams({ scheme, category })
  const res = await fetch(`/api/fund-report/peers?${params}`)
  if (!res.ok) throw new ApiError(`Peer comparison failed (${res.status})`, res.status)
  return peerComparisonSchema.parse(await res.json())
}
