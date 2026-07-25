import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
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
  const [underline, setUnderline] = useState({ left: 0, width: 0, ready: false })

  const updateScrollState = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const updateUnderline = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const activeEl = scroller.querySelector<HTMLElement>(`[data-section-id="${activeSection}"]`)
    if (!activeEl) {
      setUnderline((prev) => ({ ...prev, ready: false }))
      return
    }
    const scrollerRect = scroller.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()
    setUnderline({
      left: tabRect.left - scrollerRect.left + scroller.scrollLeft,
      width: tabRect.width,
      ready: true,
    })
  }

  useLayoutEffect(() => {
    updateScrollState()
    updateUnderline()
  }, [activeSection])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      updateScrollState()
      updateUnderline()
    }
    const onResize = () => {
      updateScrollState()
      updateUnderline()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [activeSection])

  useEffect(() => {
    const activeEl = scrollerRef.current?.querySelector<HTMLElement>(`[data-section-id="${activeSection}"]`)
    activeEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeSection])

  const scrollByAmount = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' })
  }

  return (
    <nav
      aria-label="Report sections"
      className="sticky top-16 z-20 rounded-2xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-xl"
    >
      <div className="relative flex items-center gap-1 px-1 py-1 sm:px-2">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll sections left"
          className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div
          className={cn(
            'pointer-events-none absolute inset-y-1 left-10 w-8 bg-gradient-to-r from-card to-transparent transition-opacity duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-y-1 right-10 w-8 bg-gradient-to-l from-card to-transparent transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        />

        <div
          ref={scrollerRef}
          className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {SECTION_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className="flex shrink-0 items-center" role="presentation">
              {groupIndex > 0 && (
                <div className="mx-1.5 h-6 w-px shrink-0 bg-border/70" aria-hidden="true" />
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
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(section.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }}
                    className={cn(
                      'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 px-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-90" aria-hidden="true" />
                    <span>{section.label}</span>
                  </a>
                )
              })}
            </div>
          ))}

          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-[left,width,opacity] duration-300 ease-out',
              underline.ready ? 'opacity-100' : 'opacity-0',
            )}
            style={{ left: underline.left, width: underline.width }}
          />
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
