import { Triangle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MethodPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Triangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">The Golden Triangle Method</h1>
          <p className="text-muted-foreground">Three rules to identify winning mutual funds</p>
        </div>
      </div>

      <div className="space-y-6">
        <RuleCard
          number={1}
          title="5-Year Rolling Return Average"
          pass="Fund Average > Benchmark Average"
          description="Compare the average of all rolling 5-year returns for the fund against its benchmark. A fund that consistently delivers higher rolling returns demonstrates sustained outperformance."
        />
        <RuleCard
          number={2}
          title="Chance of Beating Benchmark (COB)"
          pass="COB > 70%"
          description="Calculate the percentage of rolling windows where the fund's return exceeded the benchmark. A COB above 70% indicates the fund beats its benchmark in most market conditions."
        />
        <RuleCard
          number={3}
          title="Sharpe Ratio"
          pass="Fund Sharpe > Benchmark Sharpe"
          description="Measure risk-adjusted returns. A higher Sharpe ratio means the fund delivers better returns per unit of risk taken compared to the benchmark."
        />

        <Card className="glass">
          <CardHeader>
            <CardTitle>Scoring System</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ScoreItem score="3/3" label="Passed" description="All three rules satisfied — Excellent fund" variant="success" />
            <ScoreItem score="2/3" label="Average" description="Two rules passed — Worth monitoring" variant="warning" />
            <ScoreItem score="1/3" label="Weak" description="Only one rule passed — Proceed with caution" variant="warning" />
            <ScoreItem score="0/3" label="Avoid" description="No rules passed — Not recommended" variant="danger" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RuleCard({
  number,
  title,
  pass,
  description,
}: {
  number: number
  title: string
  pass: string
  description: string
}) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {number}
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 flex items-center gap-2 font-medium text-emerald-500">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Pass condition: {pass}
        </p>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ScoreItem({
  score,
  label,
  description,
  variant,
}: {
  score: string
  label: string
  description: string
  variant: 'success' | 'warning' | 'danger'
}) {
  const colors = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  }

  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-2">
        {variant === 'danger' ? (
          <XCircle className={`h-5 w-5 ${colors[variant]}`} aria-hidden="true" />
        ) : (
          <CheckCircle2 className={`h-5 w-5 ${colors[variant]}`} aria-hidden="true" />
        )}
        <span className="font-mono font-semibold">{score}</span>
        <span className={`font-medium ${colors[variant]}`}>{label}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
