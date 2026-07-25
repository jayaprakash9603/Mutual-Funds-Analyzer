import type { DemoFund } from './demoManifest'

/**
 * Pure lookups shared by the demo transport. Keeping them free of IO makes the
 * fallback rules straightforward to cover with unit tests.
 */

const DEFAULT_PERIOD_YEARS = 5
const ALL_CATEGORIES = 'All'

function tokenize(value: string): string[] {
  return value.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Category values look like "Equity: Small Cap"; only the part after the colon is searchable. */
function categoryKeyword(category: string): string {
  const [, tail] = category.split(':')
  return (tail ?? category).trim().toLowerCase()
}

function matchesCategory(scheme: string, category: string, funds: DemoFund[]): boolean {
  if (!category || category === ALL_CATEGORIES) {
    return true
  }
  const keyword = categoryKeyword(category)
  if (!keyword) {
    return true
  }
  if (scheme.toLowerCase().includes(keyword)) {
    return true
  }
  const fund = funds.find((entry) => entry.scheme === scheme)
  return fund ? fund.category.toLowerCase().includes(keyword) : false
}

/** Every token must appear, so "axis small" still finds "Axis Small Cap Fund". */
export function filterDemoSchemes(
  names: string[],
  query: string,
  category: string,
  funds: DemoFund[] = [],
): string[] {
  const tokens = tokenize(query)
  return names.filter((name) => {
    const lower = name.toLowerCase()
    const matchesQuery = tokens.every((token) => lower.includes(token))
    return matchesQuery && matchesCategory(name, category, funds)
  })
}

function parsePeriodYears(period: string): number {
  const years = Number.parseInt(period, 10)
  return Number.isNaN(years) ? DEFAULT_PERIOD_YEARS : years
}

/** Falls back to the closest captured window so an uncaptured period still renders. */
export function resolveAnalysisFile(fund: DemoFund, period: string): string | undefined {
  const files = fund.files.analysis ?? {}
  const exact = files[period]
  if (exact) {
    return exact
  }
  const available = Object.keys(files)
  if (available.length === 0) {
    return undefined
  }
  const target = parsePeriodYears(period)
  const nearest = available.reduce((best, candidate) =>
    Math.abs(parsePeriodYears(candidate) - target) < Math.abs(parsePeriodYears(best) - target)
      ? candidate
      : best,
  )
  return files[nearest]
}

export function resolveMatrixFile(fund: DemoFund, mode: string): string | undefined {
  const files = fund.files.fundReportMatrix ?? {}
  return files[mode] ?? Object.values(files)[0]
}

/**
 * The captured compare payload holds every demo fund, so it is narrowed to the funds the
 * user actually picked. An empty match falls back to everything rather than a blank page.
 */
export function filterCompareResults<T extends { fundName: string }>(
  results: T[],
  requestedSchemes: string[],
  funds: DemoFund[],
): T[] {
  if (requestedSchemes.length === 0) {
    return results
  }
  const wanted = new Set<string>()
  for (const scheme of requestedSchemes) {
    wanted.add(scheme.trim().toLowerCase())
    const fund = funds.find((entry) => entry.scheme === scheme)
    if (fund) {
      wanted.add(fund.fundName.trim().toLowerCase())
    }
  }
  const matched = results.filter((result) => wanted.has(result.fundName.trim().toLowerCase()))
  return matched.length > 0 ? matched : results
}
