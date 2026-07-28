import type { ProgressiveFundReportGroups } from '../../hooks/useProgressiveFundReport'

export type ReportGroupKey = keyof ProgressiveFundReportGroups

const SECTION_GROUP_REQUIREMENTS: Record<string, readonly ReportGroupKey[]> = {
  overview: ['overview'],
  'golden-triangle': ['assessment', 'risk'],
  returns: ['performance'],
  rolling: ['performance'],
  'return-patterns': ['performance'],
  benchmark: ['performance'],
  probability: ['performance'],
  risk: ['risk'],
  portfolio: [],
  consistency: ['risk'],
  drawdown: ['risk'],
  'bear-market': ['risk'],
  'best-days': ['risk'],
  'all-time-highs': ['risk'],
  lumpsum: ['investment'],
  expense: ['investment'],
  sip: ['investment'],
  stp: ['investment'],
  swp: ['investment'],
  peers: [],
  quality: ['assessment'],
  insights: ['assessment'],
  verdict: ['assessment'],
}

export const ALL_REPORT_GROUP_KEYS: ReportGroupKey[] = [
  'overview',
  'performance',
  'risk',
  'investment',
  'assessment',
]

export function groupsRequiredForSection(sectionId: string): ReportGroupKey[] {
  return [...(SECTION_GROUP_REQUIREMENTS[sectionId] ?? ['overview'])]
}

export function groupsRequiredForSections(sectionIds: Iterable<string>): Set<ReportGroupKey> {
  const groups = new Set<ReportGroupKey>()
  let visited = false
  for (const sectionId of sectionIds) {
    visited = true
    for (const group of groupsRequiredForSection(sectionId)) {
      groups.add(group)
    }
  }
  if (visited) {
    groups.add('overview')
  }
  return groups
}

export function sectionNeedsMatrix(sectionId: string): boolean {
  return sectionId === 'lumpsum' || sectionId === 'sip' || sectionId === 'stp'
}

export function sectionNeedsMultipleMatrix(sectionId: string): boolean {
  return sectionId === 'probability' || sectionId === 'lumpsum'
}

export function sectionNeedsPeersFetch(sectionId: string): boolean {
  return sectionId === 'peers'
}
