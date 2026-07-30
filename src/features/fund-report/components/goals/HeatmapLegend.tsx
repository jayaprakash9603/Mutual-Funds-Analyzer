import { cn } from '@/lib/utils'
import type { HeatmapBand } from './goalTableStyles'

export function HeatmapLegend({ bands }: { bands: HeatmapBand[] }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3">
      {bands.map((band) => (
        <span
          key={band.label}
          className={cn(
            'inline-flex items-center rounded-md border border-border/50 px-2.5 py-1 text-xs font-medium',
            band.className,
          )}
        >
          {band.label}
        </span>
      ))}
    </div>
  )
}
