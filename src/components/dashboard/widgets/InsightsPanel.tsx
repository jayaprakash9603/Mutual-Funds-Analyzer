import { motion } from 'framer-motion'
import { Sparkles, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GoldenTriangleResult } from '@/lib/analytics/types'
import { INSIGHT_RATINGS } from '@/lib/constants'

interface InsightsPanelProps {
  result: GoldenTriangleResult
  insights: string[]
}

const STAGGER_SECONDS = 0.08

function ratingVariant(rating: string) {
  if (rating === INSIGHT_RATINGS.Passed) return 'success'
  if (rating === INSIGHT_RATINGS.Avoid) return 'danger'
  return 'warning'
}

export function InsightsPanel({ result, insights }: InsightsPanelProps) {
  const rating = INSIGHT_RATINGS[result.overallRating as keyof typeof INSIGHT_RATINGS] ?? result.overallRating

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
          <CardTitle>AI Insights</CardTitle>
        </div>
        <Badge variant={ratingVariant(rating)} className="shrink-0 text-[10px] sm:text-xs">
          {rating}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {insights.map((insight, i) => (
          <motion.p
            key={`${i}-${insight}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * STAGGER_SECONDS }}
            className="text-xs leading-relaxed text-muted-foreground sm:text-sm"
          >
            {insight}
          </motion.p>
        ))}

        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-3 sm:mt-4 sm:gap-3 sm:rounded-xl sm:p-4">
          <ShieldAlert className="h-4 w-4 shrink-0 text-secondary sm:h-5 sm:w-5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium sm:text-sm">Risk Level: {result.metrics.riskLevel}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Volatility {result.metrics.fundVolatility.toFixed(2)}% | Max Drawdown {result.metrics.maxDrawdown.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
