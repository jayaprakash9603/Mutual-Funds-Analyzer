export type IndexedNavPoint = {
  date: string
  indexValue: number
}

export type LongTermStoryStats = {
  cagrPercent: number
  moneyMultiple: number
  yearsRounded: number
  sinceLabel: string
  categoryHeadline: string
}

export type LongTermStoryPoint = IndexedNavPoint & {
  label: string
  trendValue: number
}

function parseDate(iso: string): Date {
  return new Date(iso.length >= 10 ? iso.slice(0, 10) : iso)
}

export function formatStoryMonthYear(iso: string): string {
  const date = parseDate(iso)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = String(date.getFullYear()).slice(-2)
  return `${month}-${year}`
}

export function shortCategoryHeadline(category: string): string {
  const trimmed = category.trim()
  if (!trimmed) return 'This fund'
  const parts = trimmed.split(' - ')
  const tail = parts[parts.length - 1]?.trim()
  if (tail && tail.length <= 48) return tail
  return trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed
}

export function computeLongTermStoryStats(
  points: IndexedNavPoint[],
  category: string,
  fundAgeYears: number,
): LongTermStoryStats | null {
  if (points.length < 2) return null

  const start = points[0]!
  const end = points[points.length - 1]!
  if (start.indexValue <= 0 || end.indexValue <= 0) return null

  const startMs = parseDate(start.date).getTime()
  const endMs = parseDate(end.date).getTime()
  const years = (endMs - startMs) / (365.25 * 24 * 60 * 60 * 1000)
  if (years <= 0) return null

  const multiple = end.indexValue / start.indexValue
  const cagrPercent = (Math.pow(multiple, 1 / years) - 1) * 100
  const yearsRounded = Math.max(1, Math.floor(fundAgeYears > 0 ? fundAgeYears : years))

  return {
    cagrPercent,
    moneyMultiple: multiple,
    yearsRounded,
    sinceLabel: formatStoryMonthYear(start.date),
    categoryHeadline: shortCategoryHeadline(category),
  }
}

export function buildLongTermStorySeries(points: IndexedNavPoint[]): LongTermStoryPoint[] {
  if (points.length < 2) return []

  const start = points[0]!
  const end = points[points.length - 1]!
  const startMs = parseDate(start.date).getTime()
  const endMs = parseDate(end.date).getTime()
  const span = endMs - startMs

  return points.map((point) => {
    const t = span <= 0 ? 0 : (parseDate(point.date).getTime() - startMs) / span
    const trendValue = start.indexValue + (end.indexValue - start.indexValue) * t
    return {
      ...point,
      label: formatStoryMonthYear(point.date),
      trendValue,
    }
  })
}

export function formatStoryMultiple(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value >= 100) return `${Math.round(value)}`
  if (value >= 10) return value.toFixed(0)
  return value.toFixed(1)
}

export function formatStoryNavTick(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return value.toFixed(0)
}
