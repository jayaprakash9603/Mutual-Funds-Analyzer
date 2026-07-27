import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Shield, TrendingUp, Triangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedStockGraph } from '@/components/landing/AnimatedStockGraph'

const rules = [
  {
    icon: TrendingUp,
    title: 'Rolling Return',
    description: 'Fund 5-Year Rolling Return Average must exceed Benchmark Average.',
  },
  {
    icon: Shield,
    title: 'Chance of Beating Benchmark',
    description: 'COB must be greater than 70% across rolling windows.',
  },
  {
    icon: BarChart3,
    title: 'Sharpe Ratio',
    description: 'Fund Sharpe Ratio must exceed Benchmark Sharpe Ratio.',
  },
]

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <AnimatedStockGraph />

      <PageContainer width="default" className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Triangle className="h-4 w-4" aria-hidden="true" />
            Golden Triangle Strategy
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Winning Mutual Funds Using The{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Golden Triangle
            </span>{' '}
            Strategy
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Compare any mutual fund against its benchmark using rolling returns, consistency and Sharpe Ratio.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard">
                Analyze Fund
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/method">Learn Method</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {rules.map((rule) => (
            <Card key={rule.title} className="glass glass-hover">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <rule.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{rule.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{rule.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </PageContainer>
    </div>
  )
}
