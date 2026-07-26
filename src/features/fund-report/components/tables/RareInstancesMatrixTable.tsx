import type { MatrixReport } from '../../schemas'
import { filterMatrixRows } from '../../lib/matrix/matrixTableUtils'
import { FundsIndiaMatrixTable } from '../tables/FundsIndiaMatrixTable'

type Recovery = NonNullable<MatrixReport['recovery']>

export function RareInstancesMatrixTable({
  matrix,
  recovery,
}: {
  matrix: MatrixReport
  recovery: Recovery
}) {
  if (matrix.mode !== 'LUMPSUM' || recovery.instancesBelowBaseline === 0) {
    return null
  }

  const rareLabels = new Set(recovery.rows.map((row) => row.startLabel))
  const rareMatrix = filterMatrixRows(matrix, rareLabels)
  const exceptionLabels = new Set(recovery.exceptionStartLabels)

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-snug text-foreground">
          {recovery.headline}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {recovery.summary}
        </p>
      </div>

      <FundsIndiaMatrixTable
        data={rareMatrix}
        dashedHighlightLabels={exceptionLabels}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        The column named &quot;Period&quot; indicates the starting date of investment. Each numbered
        column is the holding period in years. Orange cells mark the lowest return in that column;
        dashed blue borders mark entries that did not recover to 10%+ even with a longer hold.
      </p>
    </div>
  )
}
