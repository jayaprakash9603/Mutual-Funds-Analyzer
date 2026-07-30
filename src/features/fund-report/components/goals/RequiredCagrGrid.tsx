import { useMemo } from 'react'
import { ScrollTable } from '@/components/ui/scroll-table'
import { cn } from '@/lib/utils'
import { fiBodyCell, fiMultiplyHeaderCell, fiStickyLabelCell, FI_TABLE } from '@/components/fundsindia/tableStyles'
import { buildRequiredCagrGrid } from '../../lib/goals/requiredCagr'
import {
  HeatmapLegend,
} from './HeatmapLegend'
import {
  CAGR_HEATMAP_BANDS,
  cagrHeatmapClasses,
  GOAL_TABLE_SHELL,
  goalRowStripe,
  goalStickyLabelBg,
} from './goalTableStyles'

export function RequiredCagrGrid() {
  const grid = useMemo(() => buildRequiredCagrGrid(), [])

  return (
    <ScrollTable minWidth={960} className={GOAL_TABLE_SHELL}>
      <table className={FI_TABLE}>
        <thead>
          <tr>
            <th className={fiMultiplyHeaderCell(fiStickyLabelCell('normal-case z-20 bg-[#1e3a5f]'))}>
              Multiple
            </th>
            {grid.horizonsYears.map((years) => (
              <th key={years} className={fiMultiplyHeaderCell()}>
                {years}Y
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, rowIndex) => (
            <tr key={grid.multiples[rowIndex]} className={goalRowStripe(rowIndex)}>
              <td
                className={cn(
                  fiBodyCell(fiStickyLabelCell('font-semibold text-foreground')),
                  goalStickyLabelBg(rowIndex),
                )}
              >
                {grid.multiples[rowIndex]}x
              </td>
              {row.map((cell) => (
                <td
                  key={`${cell.multiple}-${cell.years}`}
                  className={cn(fiBodyCell('tabular-nums'), cagrHeatmapClasses(cell.cagrPercent))}
                  title={`${cell.multiple}x in ${cell.years} years needs ${cell.cagrPercent.toFixed(1)}% CAGR`}
                >
                  {cell.cagrPercent.toFixed(1)}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <HeatmapLegend bands={CAGR_HEATMAP_BANDS} />
    </ScrollTable>
  )
}
