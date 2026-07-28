import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MatrixMode } from '../../lib/matrix/matrixCache'
import { useFundReportMatrix } from '../../hooks/useFundReportMatrix'
import { HeatMatrix, HeatMatrixSkeleton } from '../charts/HeatMatrix'
import { RareInstancesMatrixTable } from '../tables/RareInstancesMatrixTable'

export type InvestmentMatrixTab = {
  value: MatrixMode
  label: string
}

type InvestmentMatrixPanelProps = {
  scheme: string
  tabs: InvestmentMatrixTab[]
  startDate?: string
  isSharedView?: boolean
  title?: string
  showRecovery?: boolean
}

export function InvestmentMatrixPanel({
  scheme,
  tabs,
  startDate,
  isSharedView = false,
  title = 'Return matrix',
  showRecovery = true,
}: InvestmentMatrixPanelProps) {
  const [activeMode, setActiveMode] = useState<MatrixMode>(tabs[0]?.value ?? 'LUMPSUM')
  const matrixEnabled = !!scheme && !isSharedView
  const { data: matrix, loading, error, retry } = useFundReportMatrix(
    scheme || null,
    activeMode,
    matrixEnabled,
    startDate,
  )

  if (tabs.length === 0) return null

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      {isSharedView ? (
        <p className="text-sm text-muted-foreground">Investment matrices are not included in shared snapshots.</p>
      ) : (
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as MatrixMode)}>
          <TabsList scrollable>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeMode} className="mt-4 w-full">
            {loading ? (
              <HeatMatrixSkeleton />
            ) : error ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium"
                >
                  Retry
                </button>
              </div>
            ) : matrix && matrix.dataRows.length > 0 ? (
              <div>
                <HeatMatrix data={matrix} />
                {showRecovery && matrix.recovery ? (
                  <RareInstancesMatrixTable matrix={matrix} recovery={matrix.recovery} />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Matrix data is not available yet.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
