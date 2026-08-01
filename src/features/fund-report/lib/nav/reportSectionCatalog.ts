import type { ComponentType } from 'react'
import {
  BarChart3,
  CalendarDays,
  Activity,
  ArrowRightLeft,
  CircleDollarSign,
  CloudRain,
  Flag,
  History,
  Layers,
  Layers2,
  LineChart,
  Mountain,
  Percent,
  Repeat,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

export type ReportSection = {
  id: string
  label: string
}

type SectionMeta = ReportSection & {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
}

export type SectionGroup = {
  id: string
  label: string
  sections: SectionMeta[]
}

export const SECTION_GROUPS: SectionGroup[] = [
  {
    id: 'snapshot',
    label: 'Snapshot',
    sections: [
      { id: 'overview', label: 'Overview', icon: Layers },
      { id: 'golden-triangle', label: 'Score', icon: Target },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    sections: [
      { id: 'returns', label: 'Returns', icon: TrendingUp },
      { id: 'rolling', label: 'Rolling', icon: LineChart },
      { id: 'performance-timeline', label: 'Timeline', icon: History },
      { id: 'return-patterns', label: 'Patterns', icon: Layers2 },
      { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
      { id: 'probability', label: 'Probability', icon: Percent },
    ],
  },
  {
    id: 'risk',
    label: 'Risk',
    sections: [
      { id: 'risk', label: 'Risk', icon: Shield },
      { id: 'volatility', label: 'Volatility', icon: Activity },
      { id: 'consistency', label: 'Consistency', icon: Sparkles },
      { id: 'drawdown', label: 'Drawdown', icon: TrendingDown },
      { id: 'bear-market', label: 'Bear Market', icon: CloudRain },
      { id: 'best-days', label: 'Best Days', icon: CalendarDays },
      { id: 'all-time-highs', label: 'ATH', icon: Mountain },
    ],
  },
  {
    id: 'investment',
    label: 'Investment',
    sections: [
      { id: 'lumpsum', label: 'Lump Sum', icon: CircleDollarSign },
      { id: 'sip', label: 'SIP', icon: Repeat },
      { id: 'stp', label: 'STP', icon: ArrowRightLeft },
      { id: 'swp', label: 'SWP', icon: Wallet },
      { id: 'goal-planner', label: 'Goals', icon: Flag },
    ],
  },
  {
    id: 'assessment',
    label: 'Assessment',
    sections: [
      { id: 'peers', label: 'Peers', icon: Users },
      { id: 'insights', label: 'Insights', icon: Sparkles },
    ],
  },
]

export const REPORT_SECTIONS: ReportSection[] = SECTION_GROUPS.flatMap((group) =>
  group.sections.map(({ id, label }) => ({ id, label })),
)

export const DEFAULT_REPORT_SECTION = REPORT_SECTIONS[0]?.id ?? 'overview'
