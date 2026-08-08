import { ApiError } from '@/api/apiError'
import { API_ROUTES } from '@/api/routes'
import {
  splitFundReport,
  type FundReport,
  type ReportSectionEnvelope,
} from '@/features/fund-report/schemas'
import {
  normalizePerformanceSectionPayload,
  normalizeRiskSectionPayload,
  withFundReportDefaults,
} from '@/features/fund-report/sectionDefaults'
import {
  buildDemoStepUpTimeline,
  buildDemoStpTimeline,
  buildDemoSwpTimeline,
  enrichDemoFundReport,
  enrichDemoPeers,
} from '../enrichDemoReport'
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

async function loadEnrichedFundReport(
  request: DemoRequest,
  manifest: DemoManifest,
): Promise<FundReport> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = requireFile(fund.files.fundReport, 'the fund report', scheme)
  const raw = await loadDemoFixture<Record<string, unknown>>(file, request.signal)
  return withFundReportDefaults(enrichDemoFundReport(raw))
}

async function handleFundReport(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  return loadEnrichedFundReport(request, manifest)
}

function envelopeFromReport<T>(report: FundReport, data: T): ReportSectionEnvelope<T> {
  return {
    data,
    freshness: 'FRESH',
    watermarkNavDate: report.profile.dataTo,
    computedAt: report.computedAt,
    schemaVersion: 7,
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
  // label retained so call sites stay readable when a dedicated section file is missing
  void label
  const report = await loadEnrichedFundReport(request, manifest)
  const groups = splitFundReport(report)
  const payload =
    section === 'risk'
      ? normalizeRiskSectionPayload(groups.risk)
      : section === 'performance'
        ? normalizePerformanceSectionPayload(groups.performance)
        : groups[section]
  return envelopeFromReport(report, payload)
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
  return enrichDemoPeers(await loadDemoFixture(file, request.signal))
}

async function handleDrawdownPeers(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  if (!fund.files.drawdownPeers) {
    return { thresholdRows: [], peerCount: 0 }
  }
  return loadDemoFixture(fund.files.drawdownPeers, request.signal)
}

type SimTimelinePoint = {
  date: string
  invested?: number
  corpus?: number
  withdrawn?: number
  nav?: number
  averageCorpus?: number
  [key: string]: unknown
}

type CapturedSimulation = {
  scheduleDay?: number
  scenario?: Record<string, number | boolean | string>
  timeline?: SimTimelinePoint[]
  sourceScheme?: string
  [key: string]: unknown
}

function scaleMoneyFields(
  scenario: Record<string, number | boolean | string>,
  factor: number,
  keys: string[],
): Record<string, number | boolean | string> {
  const next = { ...scenario }
  for (const key of keys) {
    const value = next[key]
    if (typeof value === 'number') next[key] = value * factor
  }
  return next
}

async function loadCapturedSimulation(
  request: DemoRequest,
  manifest: DemoManifest,
  kind: 'swp' | 'sip' | 'lumpsum' | 'stepUpSip' | 'stp',
): Promise<CapturedSimulation | null> {
  const scheme = request.params.get('scheme') ?? ''
  const fund = requireFund(manifest, scheme)
  const file = fund.files.simulations?.[kind]
  if (!file) return null
  return loadDemoFixture<CapturedSimulation>(file, request.signal)
}

async function handleSipSimulate(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const amount = Number.parseInt(request.params.get('amount') ?? '10000', 10)
  const scheduleDay = Number.parseInt(request.params.get('schedule_day') ?? '1', 10)
  const captured = await loadCapturedSimulation(request, manifest, 'sip')
  if (captured?.scenario && Array.isArray(captured.timeline)) {
    const baseAmount = Number(captured.scenario.monthlyAmount ?? 10000) || 10000
    const factor = amount / baseAmount
    return {
      scheduleDay,
      scenario: scaleMoneyFields(captured.scenario, factor, [
        'monthlyAmount',
        'currentValue',
        'totalGain',
        'moneyInvested',
        'projectedValue10Y',
        'stcg',
        'ltcg',
      ]),
      timeline: captured.timeline.map((point) => ({
        ...point,
        invested: (point.invested ?? 0) * factor,
        corpus: (point.corpus ?? 0) * factor,
      })),
    }
  }

  const envelope = await handleFundReportInvestment(request, manifest) as {
    data: {
      sip: {
        timeline?: Array<{ date: string; invested: number; corpus: number; nav: number }>
        scenarios: Array<{
          monthlyAmount: number
          currentValue: number
          totalGain: number
          xirr: number
          moneyInvested: number
          projectedValue10Y: number
          stcg?: number
          ltcg?: number
          postTaxXirr?: number
        }>
      }
    }
  }
  const sip = envelope.data.sip
  const base =
    sip.scenarios.find((row) => row.monthlyAmount === amount) ?? sip.scenarios[0] ?? null
  if (!base) {
    throw new ApiError('Demo mode has no SIP scenario data for this fund.', NOT_FOUND)
  }
  const factor = amount / Math.max(base.monthlyAmount, 1)
  const scenario = {
    ...base,
    monthlyAmount: amount,
    currentValue: base.currentValue * factor,
    totalGain: base.totalGain * factor,
    moneyInvested: base.moneyInvested * factor,
    projectedValue10Y: base.projectedValue10Y * factor,
    stcg: (base.stcg ?? 0) * factor,
    ltcg: (base.ltcg ?? 0) * factor,
  }
  const timeline = (sip.timeline ?? []).map((point) => ({
    ...point,
    invested: point.invested * factor,
    corpus: point.corpus * factor,
  }))
  return { scheduleDay, scenario, timeline }
}

async function handleSwpSimulate(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const initialCorpus = Number.parseInt(request.params.get('initial_corpus') ?? '1000000', 10)
  const monthlyWithdrawal = Number.parseInt(request.params.get('monthly_withdrawal') ?? '10000', 10)
  const scheduleDay = Number.parseInt(request.params.get('schedule_day') ?? '1', 10)
  const captured = await loadCapturedSimulation(request, manifest, 'swp')
  if (captured?.scenario && Array.isArray(captured.timeline) && captured.timeline.length > 0) {
    const baseCorpus = Number(captured.scenario.initialCorpus ?? 1_000_000) || 1_000_000
    const baseWithdrawal = Number(captured.scenario.monthlyWithdrawal ?? 10_000) || 10_000
    const corpusFactor = initialCorpus / baseCorpus
    const withdrawalFactor = monthlyWithdrawal / baseWithdrawal
    // Same withdrawal rate as capture → scale the real backend path linearly.
    if (Math.abs(corpusFactor - withdrawalFactor) < 0.05) {
      return {
        scheduleDay,
        scenario: {
          ...scaleMoneyFields(captured.scenario, corpusFactor, [
            'initialCorpus',
            'monthlyWithdrawal',
            'totalWithdrawn',
            'remainingCorpus',
            'stcg',
            'ltcg',
            'postTaxRemaining',
          ]),
          withdrawalCount: captured.scenario.withdrawalCount,
          depleted: captured.scenario.depleted,
        },
        timeline: captured.timeline.map((point) => ({
          ...point,
          corpus: (point.corpus ?? 0) * corpusFactor,
          withdrawn: (point.withdrawn ?? 0) * corpusFactor,
          averageCorpus:
            point.averageCorpus != null ? point.averageCorpus * corpusFactor : undefined,
        })),
      }
    }
  }

  const report = await loadEnrichedFundReport(request, manifest)
  const built = buildDemoSwpTimeline(
    report.drawdown?.indexedNav ?? [],
    initialCorpus,
    monthlyWithdrawal,
  )
  return { scheduleDay, scenario: built.scenario, timeline: built.timeline }
}

async function handleStpSimulate(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const lumpSum = Number.parseInt(request.params.get('lump_sum') ?? '1000000', 10)
  const transferMonths = Number.parseInt(request.params.get('transfer_months') ?? '6', 10)
  const scheduleDay = Number.parseInt(request.params.get('schedule_day') ?? '1', 10)
  const captured = await loadCapturedSimulation(request, manifest, 'stp')
  if (captured?.scenario && Array.isArray(captured.timeline) && transferMonths === 6) {
    const baseLump = Number(captured.scenario.lumpSum ?? captured.scenario.initialCorpus ?? 1_000_000) || 1_000_000
    const factor = lumpSum / baseLump
    return {
      sourceScheme: request.params.get('source_scheme') ?? captured.sourceScheme ?? '',
      targetScheme: request.params.get('scheme') ?? '',
      scheduleDay,
      transferMonths,
      scenario: scaleMoneyFields(captured.scenario, factor, [
        'lumpSum',
        'initialCorpus',
        'sourceCorpus',
        'targetCorpus',
        'transferred',
        'currentValue',
        'totalGain',
        'stcg',
        'ltcg',
      ]),
      timeline: captured.timeline.map((point) => ({
        ...point,
        sourceCorpus:
          point.sourceCorpus != null ? Number(point.sourceCorpus) * factor : point.sourceCorpus,
        targetCorpus:
          point.targetCorpus != null ? Number(point.targetCorpus) * factor : point.targetCorpus,
        transferred:
          point.transferred != null ? Number(point.transferred) * factor : point.transferred,
      })),
    }
  }

  const report = await loadEnrichedFundReport(request, manifest)
  const built = buildDemoStpTimeline(
    report.drawdown?.indexedNav ?? [],
    lumpSum,
    transferMonths,
  )
  return {
    sourceScheme: request.params.get('source_scheme') ?? '',
    targetScheme: request.params.get('scheme') ?? '',
    scheduleDay,
    transferMonths,
    scenario: built.scenario,
    timeline: built.timeline,
  }
}

async function handleLumpsumSimulate(request: DemoRequest, manifest: DemoManifest): Promise<unknown> {
  const amount = Number.parseInt(request.params.get('amount') ?? '100000', 10)
  const captured = await loadCapturedSimulation(request, manifest, 'lumpsum')
  if (captured?.scenario && Array.isArray(captured.timeline)) {
    const basePrincipal = Number(captured.scenario.principal ?? 100_000) || 100_000
    const factor = amount / basePrincipal
    return {
      scenario: scaleMoneyFields(captured.scenario, factor, [
        'principal',
        'currentValue',
        'gain',
      ]),
      timeline: captured.timeline.map((point) => ({
        ...point,
        invested: point.invested != null ? point.invested * factor : point.invested,
        corpus: point.corpus != null ? point.corpus * factor : point.corpus,
      })),
    }
  }

  const envelope = (await handleFundReportInvestment(request, manifest)) as {
    data: {
      lumpsum?: {
        timeline?: unknown[]
        scenarios?: Array<{
          principal: number
          currentValue: number
          gain: number
          cagr: number
          moneyMultiplied: number
        }>
      }
    }
  }
  const lumpsum = envelope.data.lumpsum
  const scenario =
    lumpsum?.scenarios?.find((row) => row.principal === amount) ?? lumpsum?.scenarios?.[0] ?? null
  if (scenario) {
    return { scenario, timeline: lumpsum?.timeline ?? [] }
  }
  return {
    scenario: {
      principal: amount,
      currentValue: amount,
      gain: 0,
      cagr: 0,
      moneyMultiplied: 1,
    },
    timeline: [],
  }
}

async function handleStepUpSipSimulate(
  request: DemoRequest,
  manifest: DemoManifest,
): Promise<unknown> {
  const initialAmount = Number.parseInt(request.params.get('initial_amount') ?? '10000', 10)
  const scheduleDay = Number.parseInt(request.params.get('schedule_day') ?? '1', 10)
  const modeParam = (request.params.get('step_up_mode') ?? 'PERCENT').toUpperCase()
  const stepUpMode = modeParam === 'FIXED' ? 'FIXED' : 'PERCENT'
  const stepUpPercent = Number.parseFloat(request.params.get('step_up_percent') ?? '10') || 0
  const stepUpAmount = Number.parseFloat(request.params.get('step_up_amount') ?? '2000') || 0
  const stepUpValue = stepUpMode === 'PERCENT' ? stepUpPercent : stepUpAmount
  const captured = await loadCapturedSimulation(request, manifest, 'stepUpSip')
  if (
    captured?.scenario &&
    Array.isArray(captured.timeline) &&
    stepUpMode === 'PERCENT' &&
    Math.abs(stepUpPercent - 10) < 0.01
  ) {
    const baseAmount = Number(captured.scenario.initialAmount ?? 10_000) || 10_000
    const factor = initialAmount / baseAmount
    return {
      scheduleDay,
      stepUpMode,
      stepUpPercent,
      stepUpAmount,
      scenario: scaleMoneyFields(captured.scenario, factor, [
        'initialAmount',
        'currentValue',
        'totalGain',
        'moneyInvested',
        'projectedValue10Y',
        'stcg',
        'ltcg',
      ]),
      timeline: captured.timeline.map((point) => ({
        ...point,
        invested: (point.invested ?? 0) * factor,
        corpus: (point.corpus ?? 0) * factor,
      })),
    }
  }

  const report = await loadEnrichedFundReport(request, manifest)
  const built = buildDemoStepUpTimeline(
    report.drawdown?.indexedNav ?? [],
    initialAmount,
    stepUpMode,
    stepUpValue,
  )

  return {
    scheduleDay,
    stepUpMode,
    stepUpPercent,
    stepUpAmount,
    scenario: built.scenario,
    timeline: built.timeline,
  }
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
  [API_ROUTES.fundReportSipSimulate]: handleSipSimulate,
  [API_ROUTES.fundReportLumpsumSimulate]: handleLumpsumSimulate,
  [API_ROUTES.fundReportSwpSimulate]: handleSwpSimulate,
  [API_ROUTES.fundReportStepUpSipSimulate]: handleStepUpSipSimulate,
  [API_ROUTES.fundReportStpSimulate]: handleStpSimulate,
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
