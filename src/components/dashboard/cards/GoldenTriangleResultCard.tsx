import { motion } from 'framer-motion'
import { Check, X, Triangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'
import { Badge } from '@/components/ui/badge'
import type { GoldenTriangleResult } from '@/lib/analytics/types'
import { appMetricCardClasses } from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

interface GoldenTriangleResultCardProps {
  result: GoldenTriangleResult
}

export function GoldenTriangleResultCard({ result }: GoldenTriangleResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'border-2',
          result.passed ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-red-500/40 shadow-red-500/10',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl',
                result.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500',
              )}
            >
              <Triangle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle>Golden Triangle Result</CardTitle>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{result.fundName}</p>
            </div>
          </div>
          <Badge variant={result.passed ? 'success' : 'danger'} className="shrink-0 px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm">
            {result.passed ? 'Passed' : 'Failed'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4">
          <AppMetricGrid variant="compact">
            {result.rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  appMetricCardClasses('md'),
                  'flex items-start gap-2.5 sm:gap-3',
                  rule.passed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5',
                )}
              >
                {rule.passed ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 sm:h-5 sm:w-5" aria-hidden="true" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500 sm:h-5 sm:w-5" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium sm:text-base">{rule.label}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{rule.description}</p>
                  <p className="mt-1.5 font-mono text-xs tabular-nums sm:mt-2 sm:text-sm">
                    {rule.id === 'cob'
                      ? `${rule.fundValue.toFixed(1)}% vs ${rule.benchmarkValue}%`
                      : `${rule.fundValue.toFixed(2)} vs ${rule.benchmarkValue.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}
          </AppMetricGrid>

          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/30 py-4 text-center sm:rounded-xl sm:py-6">
            {result.passed ? (
              <>
                <p className="text-base font-semibold text-emerald-500 sm:text-lg" aria-label="Golden Triangle Passed, five stars">
                  Golden Triangle Passed
                </p>
                <div className="flex gap-1 text-amber-400" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-lg sm:text-xl">★</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <X className="h-8 w-8 text-red-500 sm:h-10 sm:w-10" aria-hidden="true" />
                <p className="text-base font-semibold text-red-500 sm:text-lg">Golden Triangle Failed</p>
              </>
            )}
            <p className="text-xs text-muted-foreground sm:text-sm">
              Score: {result.passCount}/3 — {result.overallRating}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
