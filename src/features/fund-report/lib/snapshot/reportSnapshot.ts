import type { ProgressiveFundReportGroups } from '../../hooks/useProgressiveFundReport'
import type {
  FundReportAssessment,
  FundReportInvestment,
  FundReportOverview,
  FundReportPerformance,
  FundReportRisk,
  PeerComparison,
} from '../../schemas'

export const SNAPSHOT_VERSION = 1 as const
export const SNAPSHOT_HASH_PREFIX = 'r='
/** Practical browser limit for share URLs (hash segment). */
export const MAX_SHARE_URL_LENGTH = 1_800_000

export type SharedReportSnapshot = {
  v: typeof SNAPSHOT_VERSION
  scheme: string
  startDate?: string
  exportedAt: string
  overview: FundReportOverview
  performance: FundReportPerformance
  risk: FundReportRisk
  investment: FundReportInvestment
  assessment: FundReportAssessment
  peers: PeerComparison | null
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function compressText(text: string): Promise<Uint8Array> {
  const input = new Blob([text]).stream()
  const compressed = input.pipeThrough(new CompressionStream('deflate'))
  const buffer = await new Response(compressed).arrayBuffer()
  return new Uint8Array(buffer)
}

async function decompressText(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const input = new Blob([buffer]).stream()
  const decompressed = input.pipeThrough(new DecompressionStream('deflate'))
  return new Response(decompressed).text()
}

export function isSnapshotCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

export async function encodeSnapshot(snapshot: SharedReportSnapshot): Promise<string> {
  if (!isSnapshotCompressionSupported()) {
    throw new Error('This browser cannot encode report snapshots (compression unavailable).')
  }
  const json = JSON.stringify(snapshot)
  const compressed = await compressText(json)
  return bytesToBase64Url(compressed)
}

export async function decodeSnapshot(encoded: string): Promise<SharedReportSnapshot | null> {
  if (!encoded || !isSnapshotCompressionSupported()) return null
  try {
    const bytes = base64UrlToBytes(encoded)
    const json = await decompressText(bytes)
    const parsed = JSON.parse(json) as SharedReportSnapshot
    if (parsed.v !== SNAPSHOT_VERSION || !parsed.scheme || !parsed.overview?.profile) return null
    return parsed
  } catch {
    return null
  }
}

export function hasSnapshotHash(hash = window.location.hash): boolean {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return raw.startsWith(SNAPSHOT_HASH_PREFIX)
}

export async function readSnapshotFromLocationHashAsync(
  hash = window.location.hash,
): Promise<SharedReportSnapshot | null> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw.startsWith(SNAPSHOT_HASH_PREFIX)) return null
  return decodeSnapshot(raw.slice(SNAPSHOT_HASH_PREFIX.length))
}

export async function buildShareUrl(snapshot: SharedReportSnapshot): Promise<string> {
  const encoded = await encodeSnapshot(snapshot)
  const url = `${window.location.origin}/fund#${SNAPSHOT_HASH_PREFIX}${encoded}`
  if (url.length > MAX_SHARE_URL_LENGTH) {
    throw new Error('Report is too large to share in a URL. Download the PDF instead.')
  }
  return url
}

export function buildSnapshotFromGroups(
  scheme: string,
  startDate: string | undefined,
  groups: ProgressiveFundReportGroups,
  peers: PeerComparison | null,
): SharedReportSnapshot | null {
  const { overview, performance, risk, investment, assessment } = groups
  if (
    !overview.data
    || !performance.data
    || !risk.data
    || !investment.data
    || !assessment.data
  ) {
    return null
  }
  if (overview.loading || performance.loading || risk.loading || investment.loading || assessment.loading) {
    return null
  }
  return {
    v: SNAPSHOT_VERSION,
    scheme,
    startDate,
    exportedAt: new Date().toISOString(),
    overview: overview.data,
    performance: performance.data,
    risk: risk.data,
    investment: investment.data,
    assessment: assessment.data,
    peers,
  }
}

export function isReportReadyForExport(groups: ProgressiveFundReportGroups): boolean {
  return buildSnapshotFromGroups('', undefined, groups, null) !== null
}
