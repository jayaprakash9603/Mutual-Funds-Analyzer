import { useEffect, useRef, useState, type ComponentType } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Landmark,
  Layers,
  LineChart,
  Percent,
  PieChart,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReportSection = {
  id: string
  label: string
}

type SectionMeta = ReportSection & {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
}

type SectionGroup = {
  id: string
  label: string
  sections: SectionMeta[]
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    id: 'snapshot',
    label: 'Snapshot',
    sections: [
      { id: 'overview', label: 'Overview', icon: Layers },
      { id: 'golden-triangle', label: 'Score', icon: Target },
      { id: 'quality', label: 'Quality', icon: Gauge },
      { id: 'verdict', label: 'Verdict', icon: Scale },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    sections: [
      { id: 'returns', label: 'Returns', icon: TrendingUp },
      { id: 'rolling', label: 'Rolling', icon: LineChart },
      { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
      { id: 'probability', label: 'Probability', icon: Percent },
      { id: 'sip', label: 'SIP', icon: Wallet },
      { id: 'lumpsum', label: 'Lump Sum', icon: CircleDollarSign },
    ],
  },
  {
    id: 'risk',
    label: 'Risk',
    sections: [
      { id: 'risk', label: 'Risk', icon: Shield },
      { id: 'consistency', label: 'Consistency', icon: Sparkles },
      { id: 'drawdown', label: 'Drawdown', icon: TrendingDown },
      { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    ],
  },
  {
    id: 'costs',
    label: 'Costs & Peers',
    sections: [
      { id: 'tax', label: 'Tax', icon: Landmark },
      { id: 'expense', label: 'Expense', icon: CircleDollarSign },
      { id: 'peers', label: 'Peers', icon: Users },
      { id: 'insights', label: 'Insights', icon: Sparkles },
    ],
  },
]

export const REPORT_SECTIONS: ReportSection[] = SECTION_GROUPS.flatMap((group) =>
  group.sections.map(({ id, label }) => ({ id, label })),
)

type ReportSectionNavProps = {
  activeSection: string
}

export function ReportSectionNav({ activeSection }: ReportSectionNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const activeGroupId =
    SECTION_GROUPS.find((group) => group.sections.some((s) => s.id === activeSection))?.id ??
    SECTION_GROUPS[0].id

  const updateScrollState = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateScrollState()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [])

  useEffect(() => {
    const activeEl = scrollerRef.current?.querySelector<HTMLElement>(`[data-section-id="${activeSection}"]`)
    activeEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeSection])

  const scrollByAmount = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  const jumpToGroup = (group: SectionGroup) => {
    const first = group.sections[0]
    if (!first) return
    document.getElementById(first.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Report sections"
      className="sticky top-16 z-20 rounded-2xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2.5 sm:px-4">
        <span className="mr-1 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground sm:inline">
          Jump to
        </span>
        {SECTION_GROUPS.map((group) => {
          const isActive = group.id === activeGroupId
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => jumpToGroup(group)}
              className={cn(
                'inline-flex min-h-9 cursor-pointer items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={isActive ? 'true' : undefined}
            >
              {group.label}
            </button>
          )
        })}
      </div>

      <div className="relative flex items-center gap-1 px-1 py-2 sm:px-2">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll sections left"
          className={cn(
            'hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex',
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div
          className={cn(
            'pointer-events-none absolute inset-y-2 left-10 w-8 bg-gradient-to-r from-card to-transparent transition-opacity duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-y-2 right-10 w-8 bg-gradient-to-l from-card to-transparent transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />

        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scroll-smooth px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {SECTION_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className="flex shrink-0 items-center gap-1.5" role="presentation">
              {groupIndex > 0 && (
                <div className="mx-1 h-7 w-px shrink-0 bg-border/70" aria-hidden="true" />
              )}
              {group.sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    data-section-id={section.id}
                    role="listitem"
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-90" aria-hidden="true" />
                    <span>{section.label}</span>
                  </a>
                )
              })}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          aria-label="Scroll sections right"
          className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
