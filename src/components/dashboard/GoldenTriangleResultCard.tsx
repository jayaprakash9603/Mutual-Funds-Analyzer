import { motion } from 'framer-motion'
import { Check, X, Triangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GoldenTriangleResult } from '@/lib/analytics/types'
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
          'glass border-2',
          result.passed ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-red-500/40 shadow-red-500/10',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                result.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500',
              )}
            >
              <Triangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Golden Triangle Result</CardTitle>
              <p className="text-sm text-muted-foreground">{result.fundName}</p>
            </div>
          </div>
          <Badge variant={result.passed ? 'success' : 'danger'} className="text-sm px-3 py-1">
            {result.passed ? 'Passed' : 'Failed'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {result.rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4',
                  rule.passed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5',
                )}
              >
                {rule.passed ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                ) : (
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                )}
                <div>
                  <p className="font-medium">{rule.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
                  <p className="mt-2 font-mono text-sm tabular-nums">
                    {rule.id === 'cob'
                      ? `${rule.fundValue.toFixed(1)}% vs ${rule.benchmarkValue}%`
                      : `${rule.fundValue.toFixed(2)} vs ${rule.benchmarkValue.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/30 py-6 text-center">
            {result.passed ? (
              <>
                <p className="text-lg font-semibold text-emerald-500" aria-label="Golden Triangle Passed, five stars">
                  Golden Triangle Passed
                </p>
                <div className="flex gap-1 text-amber-400" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-xl">★</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <X className="h-10 w-10 text-red-500" aria-hidden="true" />
                <p className="text-lg font-semibold text-red-500">Golden Triangle Failed</p>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              Score: {result.passCount}/3 — {result.overallRating}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
