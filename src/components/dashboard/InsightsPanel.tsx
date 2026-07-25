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
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>AI Insights</CardTitle>
        </div>
        <Badge variant={ratingVariant(rating)}>
          {rating}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <motion.p
            key={`${i}-${insight}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * STAGGER_SECONDS }}
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {insight}
          </motion.p>
        ))}

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <ShieldAlert className="h-5 w-5 text-secondary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Risk Level: {result.metrics.riskLevel}</p>
            <p className="text-xs text-muted-foreground">
              Volatility {result.metrics.fundVolatility.toFixed(2)}% | Max Drawdown {result.metrics.maxDrawdown.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
