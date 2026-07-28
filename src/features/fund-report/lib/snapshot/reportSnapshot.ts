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

async function decompressText(bytes: Uint8Array, format: 'deflate' | 'gzip'): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const input = new Blob([buffer]).stream()
  const decompressed = input.pipeThrough(new DecompressionStream(format))
  return new Response(decompressed).text()
}

export function isSnapshotCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

function parseSnapshotJson(json: string): SharedReportSnapshot | null {
  try {
    const parsed = JSON.parse(json) as SharedReportSnapshot
    if (parsed.v !== SNAPSHOT_VERSION || !parsed.scheme || !parsed.overview?.profile) return null
    return parsed
  } catch {
    return null
  }
}

async function decodeSnapshotBytes(bytes: Uint8Array): Promise<SharedReportSnapshot | null> {
  if (isSnapshotCompressionSupported()) {
    for (const format of ['deflate', 'gzip'] as const) {
      try {
        const json = await decompressText(bytes, format)
        const parsed = parseSnapshotJson(json)
        if (parsed) return parsed
      } catch {
        // try next format
      }
    }
  }

  return parseSnapshotJson(new TextDecoder().decode(bytes))
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
  if (!encoded) return null

  if (encoded.startsWith('{')) {
    return parseSnapshotJson(encoded)
  }

  try {
    return decodeSnapshotBytes(base64UrlToBytes(encoded))
  } catch {
    return null
  }
}

export function getSnapshotPayloadFromLocation(
  location: Pick<Location, 'hash' | 'search'> = window.location,
): string | null {
  const rawHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  if (rawHash.startsWith(SNAPSHOT_HASH_PREFIX)) {
    return rawHash.slice(SNAPSHOT_HASH_PREFIX.length)
  }

  const fromQuery = new URLSearchParams(location.search).get('r')
  return fromQuery || null
}

export function hasSnapshotInLocation(
  location: Pick<Location, 'hash' | 'search'> = window.location,
): boolean {
  return getSnapshotPayloadFromLocation(location) != null
}

/** @deprecated Prefer {@link hasSnapshotInLocation}. */
export function hasSnapshotHash(hash = window.location.hash): boolean {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw.startsWith(SNAPSHOT_HASH_PREFIX)) return true
  return hasSnapshotInLocation()
}

export function normalizeSnapshotUrl(location: Location = window.location): boolean {
  const payload = getSnapshotPayloadFromLocation(location)
  if (!payload) return false

  const rawHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
  if (rawHash.startsWith(SNAPSHOT_HASH_PREFIX)) return false

  const params = new URLSearchParams(location.search)
  params.delete('r')
  const search = params.toString()
  const next = `${location.pathname}${search ? `?${search}` : ''}#${SNAPSHOT_HASH_PREFIX}${payload}`
  window.history.replaceState(null, '', next)
  return true
}

export async function readSnapshotFromLocationAsync(
  location: Pick<Location, 'hash' | 'search'> = window.location,
): Promise<SharedReportSnapshot | null> {
  const payload = getSnapshotPayloadFromLocation(location)
  if (!payload) return null
  return decodeSnapshot(payload)
}

/** @deprecated Prefer {@link readSnapshotFromLocationAsync}. */
export async function readSnapshotFromLocationHashAsync(
  hash = window.location.hash,
): Promise<SharedReportSnapshot | null> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw.startsWith(SNAPSHOT_HASH_PREFIX)) {
    return decodeSnapshot(raw.slice(SNAPSHOT_HASH_PREFIX.length))
  }
  return readSnapshotFromLocationAsync()
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
