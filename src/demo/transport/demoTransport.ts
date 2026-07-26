import { ApiError } from '@/api/apiError'
import { API_ROUTES } from '@/api/routes'
import {
  splitFundReport,
  type FundReport,
  type ReportSectionEnvelope,
} from '@/features/fund-report/schemas'
import {
  filterCompareResults,
  filterDemoSchemes,
  resolveAnalysisFile,
  resolveMatrixFile,
} from './demoFilters'
import {
  demoFundNames,
  findDemoFund,
  loadDemoFixture,
  loadDemoManifest,
  type DemoFund,
  type DemoManifest,
} from '../config/demoManifest'

/** Enough delay for loading skeletons to appear, so a demo still shows real UI states. */
const DEMO_LATENCY_MS = 260
const NOT_FOUND = 404
const NOT_IMPLEMENTED = 501

export interface DemoRequest {
  path: string
  params: URLSearchParams
  body?: unknown
  signal?: AbortSignal
}

type DemoHandler = (request: DemoRequest, manifest: DemoManifest) => Promise<unknown>

function abortError(): DOMException {
  return new DOMException('The demo request was aborted', 'AbortError')
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function unavailableMessage(manifest: DemoManifest, scheme: string): string {
  const available = demoFundNames(manifest).join(', ')
  return `Demo mode has no data for "${scheme}". Available funds: ${available || 'none captured yet'}.`
}

function requireFund(manifest: DemoManifest, scheme: string): DemoFund {
  const fund = findDemoFund(manifest, scheme)
  if (!fund) {
    throw new ApiError(unavailableMessage(manifest, scheme), NOT_FOUND)
  }
  return fund
}

function requireFile(file: string | undefined, label: string, scheme: string): string {
  if (!file) {
    throw new ApiError(`Demo mode did not capture ${label} for "${scheme}".`, NOT_FOUND)
  }
  return file
}

function readSchemes(body: unknown): string[] {
  if (body && typeof body === 'object' && 'schemes' in body) {
    const value = (body as { schemes?: unknown }).schemes
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string')
    }
  }
  return []
}

async function handleSchemes(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const names = manifest.shared.schemes
    ? await loadDemoFixture<string[]>(manifest.shared.schemes, request.signal)
    : demoFundNames(manifest)
  const query = request.params.get('query') ?? ''
  const category = request.params.get('category') ?? 'All'
  return filterDemoSchemes(names, query, category, manifest.funds)
}

async function handleFeatures(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  if (!manifest.shared.features) {
    return {}
  }
  return loadDemoFixture<Record<string, boolean>>(manifest.shared.features, request.signal)
}

async function handleAnalysis(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const period = request.params.get('period') ?? manifest.periods[0] ?? ''
  const file = requireFile(resolveAnalysisFile(fund, period), 'rolling returns', scheme)
  return loadDemoFixture(file, request.signal)
}

async function handleCompare(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const file = requireFile(manifest.shared.compare, 'the comparison', 'the demo funds')
  const payload = await loadDemoFixture<{ results: { fundName: string }[] }>(file, request.signal)
  return {
    ...payload,
    results: filterCompareResults(payload.results, readSchemes(request.body), manifest.funds),
  }
}

async function handleFundIndexMatrix(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = requireFile(fund.files.fundIndexMatrix, 'the fund vs index matrix', scheme)
  return loadDemoFixture(file, request.signal)
}

async function handleFundReport(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = requireFile(fund.files.fundReport, 'the fund report', scheme)
  return loadDemoFixture(file, request.signal)
}

function envelopeFromReport<T>(report: FundReport, data: T): ReportSectionEnvelope<T> {
  return {
    data,
    freshness: 'FRESH',
    watermarkNavDate: report.profile.dataTo,
    computedAt: report.computedAt,
    schemaVersion: 3,
  }
}

async function handleFundReportSection(
  request: DemoRequest,
  manifest: DemoManifest,
  section: keyof ReturnType<typeof splitFundReport>,
  label: string,
): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const sectionFiles = fund.files.fundReportSections
  const dedicated = sectionFiles?.[section]
  if (dedicated) {
    return loadDemoFixture(dedicated, request.signal)
  }
  const file = requireFile(fund.files.fundReport, label, scheme)
  const report = await loadDemoFixture<FundReport>(file, request.signal)
  const groups = splitFundReport(report)
  return envelopeFromReport(report, groups[section])
}

async function handleFundReportOverview(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return handleFundReportSection(request, manifest, 'overview', 'the fund report overview')
}

async function handleFundReportPerformance(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return handleFundReportSection(request, manifest, 'performance', 'the fund report performance')
}

async function handleFundReportRisk(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return handleFundReportSection(request, manifest, 'risk', 'the fund report risk')
}

async function handleFundReportInvestment(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return handleFundReportSection(request, manifest, 'investment', 'the fund report investment')
}

async function handleFundReportAssessment(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return handleFundReportSection(request, manifest, 'assessment', 'the fund report assessment')
}

async function handleFundReportMatrix(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const mode = request.params.get('mode') ?? manifest.matrixModes[0] ?? ''
  const file = requireFile(resolveMatrixFile(fund, mode), `the ${mode} matrix`, scheme)
  return loadDemoFixture(file, request.signal)
}

async function handlePeers(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = requireFile(fund.files.peers, 'the peer comparison', scheme)
  return loadDemoFixture(file, request.signal)
}

async function handleDrawdownPeers(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = requireFile(fund.files.drawdownPeers, 'the drawdown peer comparison', scheme)
  return loadDemoFixture(file, request.signal)
}

/** A table instead of branching, so adding an endpoint stays a one-line change. */
const DEMO_HANDLERS: Record<string, DemoHandler | undefined> = {
  [API_ROUTES.schemes]: handleSchemes,
  [API_ROUTES.analysis]: handleAnalysis,
  [API_ROUTES.compare]: handleCompare,
  [API_ROUTES.fundIndexMatrix]: handleFundIndexMatrix,
  [API_ROUTES.features]: handleFeatures,
  [API_ROUTES.fundReport]: handleFundReport,
  [API_ROUTES.fundReportOverview]: handleFundReportOverview,
  [API_ROUTES.fundReportPerformance]: handleFundReportPerformance,
  [API_ROUTES.fundReportRisk]: handleFundReportRisk,
  [API_ROUTES.fundReportInvestment]: handleFundReportInvestment,
  [API_ROUTES.fundReportAssessment]: handleFundReportAssessment,
  [API_ROUTES.fundReportMatrix]: handleFundReportMatrix,
  [API_ROUTES.fundReportPeers]: handlePeers,
  [API_ROUTES.fundReportDrawdownPeers]: handleDrawdownPeers,
}

export function hasDemoHandler(path: string): boolean {
  return DEMO_HANDLERS[path] !== undefined
}

export async function fetchDemoJson<T>(request: DemoRequest): Promise<T> {
  const handler = DEMO_HANDLERS[request.path]
  if (!handler) {
    throw new ApiError(`Demo mode has no fixture for ${request.path}.`, NOT_IMPLEMENTED)
  }
  await delay(DEMO_LATENCY_MS, request.signal)
  const manifest = await loadDemoManifest(request.signal)
  return (await handler(request, manifest)) as T
}
