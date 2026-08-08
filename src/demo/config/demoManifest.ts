import { ApiError } from '@/api/apiError'

/**
 * Shape of public/demo/manifest.json, written by scripts/capture-demo-data.mjs.
 * The manifest owns every filename so the slug rules live in one place only.
 */
export type DemoSimulationKind = 'swp' | 'sip' | 'lumpsum' | 'stepUpSip' | 'stp'

export interface DemoFundFiles {
  fundReport?: string
  fundReportSections?: Partial<Record<'overview' | 'performance' | 'risk' | 'investment' | 'assessment', string>>
  analysis?: Record<string, string>
  fundReportMatrix?: Record<string, string>
  fundIndexMatrix?: string
  peers?: string
  drawdownPeers?: string
  /** Captured /simulate responses keyed by kind (defaults used by the UI). */
  simulations?: Partial<Record<DemoSimulationKind, string>>
}

export interface DemoFund {
  scheme: string
  label: string
  category: string
  fundName: string
  benchmarkName: string
  files: DemoFundFiles
}

export interface DemoSharedFiles {
  schemes?: string
  features?: string
  compare?: string
}

export interface DemoManifest {
  generatedAt: string
  periods: string[]
  matrixModes: string[]
  startDate: string
  funds: DemoFund[]
  shared: DemoSharedFiles
}

const MANIFEST_FILE = 'manifest.json'
const MISSING_DATA_MESSAGE =
  'Demo data is not available yet. Run "npm run demo:capture" while the backend is running.'

let manifestPromise: Promise<DemoManifest> | null = null

/** Respects the Vite base path so a demo build works when hosted under a sub-path. */
export function demoFixtureUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}demo/${relativePath}`
}

export async function loadDemoFixture<T>(relativePath: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(demoFixtureUrl(relativePath), { signal })
  if (!response.ok) {
    throw new ApiError(MISSING_DATA_MESSAGE, response.status)
  }
  return (await response.json()) as T
}

export function loadDemoManifest(signal?: AbortSignal): Promise<DemoManifest> {
  // A failed load must not be cached, otherwise a capture done later never shows up.
  manifestPromise ??= loadDemoFixture<DemoManifest>(MANIFEST_FILE, signal).catch((error: unknown) => {
    manifestPromise = null
    throw error
  })
  return manifestPromise
}

export function resetDemoManifestCache(): void {
  manifestPromise = null
}

export function findDemoFund(manifest: DemoManifest, scheme: string | null): DemoFund | undefined {
  if (!scheme) {
    return undefined
  }
  const normalized = scheme.trim().toLowerCase()
  return manifest.funds.find((fund) => fund.scheme.trim().toLowerCase() === normalized)
}

export function demoFundNames(manifest: DemoManifest): string[] {
  return manifest.funds.map((fund) => fund.scheme)
}

export { MISSING_DATA_MESSAGE }
