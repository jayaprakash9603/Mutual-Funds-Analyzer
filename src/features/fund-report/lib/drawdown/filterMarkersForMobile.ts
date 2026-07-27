import type { PhaseMarker, PhaseTimelineBand } from './declineRecoveryCycles'

export function largestMarkerPerCycle(
  markers: PhaseMarker[],
  bands: PhaseTimelineBand[],
): PhaseMarker[] {
  const selected: PhaseMarker[] = []

  for (const band of bands) {
    const inBand = markers.filter(
      (marker) => marker.date >= band.dateStart && marker.date <= band.dateEnd,
    )
    if (inBand.length === 0) continue

    const largest = inBand.reduce((best, marker) =>
      Math.abs(marker.value) > Math.abs(best.value) ? marker : best,
    )
    selected.push(largest)
  }

  return selected
}
