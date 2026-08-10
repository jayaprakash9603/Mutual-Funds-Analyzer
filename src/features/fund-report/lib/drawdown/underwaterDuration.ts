import type { FundReportRisk } from '../../schemas'

type Drawdown = FundReportRisk['drawdown']

export type UnderwaterBucket = {
  bucketLabel: string
  count: number
  percentOfEpisodes: number
}

export type OngoingUnderwater = {
  ongoingSince: string
  ongoingYears: number
}

export type UnderwaterDuration = {
  buckets: UnderwaterBucket[]
  totalEpisodes: number
  ongoing: OngoingUnderwater | null
}

const BUCKETS: Array<{ label: string; minYears: number; maxYears: number }> = [
  { label: '<6 mo', minYears: 0, maxYears: 0.5 },
  { label: '6–12 mo', minYears: 0.5, maxYears: 1 },
  { label: '1–2 y', minYears: 1, maxYears: 2 },
  { label: '2–3 y', minYears: 2, maxYears: 3 },
  { label: '3y+', minYears: 3, maxYears: Number.POSITIVE_INFINITY },
]

function bucketIndex(years: number): number {
  for (let i = 0; i < BUCKETS.length; i++) {
    const bucket = BUCKETS[i]!
    if (years >= bucket.minYears && years < bucket.maxYears) return i
  }
  return BUCKETS.length - 1
}

export function buildUnderwaterDuration(drawdown: Drawdown): UnderwaterDuration {
  const recovered = drawdown.episodes.filter(
    (episode) => episode.recovered && Number.isFinite(episode.recoveryYears),
  )
  const counts = BUCKETS.map(() => 0)

  for (const episode of recovered) {
    counts[bucketIndex(episode.recoveryYears)]! += 1
  }

  const total = recovered.length
  const buckets: UnderwaterBucket[] = BUCKETS.map((bucket, index) => ({
    bucketLabel: bucket.label,
    count: counts[index]!,
    percentOfEpisodes: total === 0 ? 0 : (counts[index]! / total) * 100,
  }))

  const ongoingPhase = drawdown.phases.find(
    (phase) => phase.ongoing && phase.type.toUpperCase().includes('DECLINE'),
  )
  const ongoing: OngoingUnderwater | null = ongoingPhase
    ? {
        ongoingSince: ongoingPhase.startDate,
        ongoingYears: ongoingPhase.durationYears,
      }
    : null

  return { buckets, totalEpisodes: total, ongoing }
}
