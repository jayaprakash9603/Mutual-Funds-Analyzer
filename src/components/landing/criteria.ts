import { Gauge, Repeat, Shield, type LucideIcon } from 'lucide-react'

export type Criterion = {
  id: 'rollingReturn' | 'cob' | 'sharpe'
  icon: LucideIcon
  title: string
  short: string
  description: string
  condition: string
  why: string
}

export const CRITERIA: Criterion[] = [
  {
    id: 'rollingReturn',
    icon: Repeat,
    title: 'Rolling Return',
    short: 'Rolling return',
    description: 'The five-year rolling average has to clear the benchmark average.',
    condition: 'Fund rolling avg > Benchmark rolling avg',
    why: 'Point-to-point returns depend on the day you pick. Rolling windows test every possible start date.',
  },
  {
    id: 'cob',
    icon: Shield,
    title: 'Chance of Beating Benchmark',
    short: 'COB > 70%',
    description: 'The fund has to win more than 70% of all rolling windows.',
    condition: 'Windows beating benchmark > 70%',
    why: 'A high average can hide a few lucky years. Consistency shows the edge is repeatable.',
  },
  {
    id: 'sharpe',
    icon: Gauge,
    title: 'Sharpe Ratio',
    short: 'Sharpe ratio',
    description: 'Return per unit of risk has to stay above the index.',
    condition: 'Fund Sharpe > Benchmark Sharpe',
    why: 'Beating the index by taking far more risk is not skill. Sharpe rewards efficient returns.',
  },
]
