import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { CRITERIA, type Criterion } from './criteria'
import { EASE, revealUp, VIEWPORT_ONCE } from './motion'
import { RevealLine } from './RevealLine'
import { SectionLabel } from './SectionLabel'

const VERTICES = [
  { x: 200, y: 24, labelX: 200, labelY: 6, anchor: 'middle' },
  { x: 376, y: 328, labelX: 376, labelY: 356, anchor: 'end' },
  { x: 24, y: 328, labelX: 24, labelY: 356, anchor: 'start' },
] as const

const EDGE_RANGES: [number, number][] = [
  [0.08, 0.3],
  [0.41, 0.63],
  [0.74, 0.94],
]

function Heading({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <SectionLabel index="02">The method</SectionLabel>
      <h2
        className={cn(
          'mt-5 font-display leading-[0.95] tracking-[-0.01em]',
          compact ? 'text-[clamp(2.4rem,3.6vw,3.5rem)]' : 'text-[clamp(2.8rem,6vw,5.5rem)]',
        )}
      >
        <RevealLine>Three tests.</RevealLine>
        <RevealLine delay={0.1}>
          <em className="text-gold">No shortcuts.</em>
        </RevealLine>
      </h2>
    </div>
  )
}

function Edge({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const from = VERTICES[index]
  const to = VERTICES[(index + 1) % 3]
  const pathLength = useTransform(progress, EDGE_RANGES[index], [0, 1])
  return (
    <motion.path
      d={`M${from.x} ${from.y} L${to.x} ${to.y}`}
      stroke="var(--primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      style={{ pathLength }}
    />
  )
}

function TriangleDiagram({ progress, active }: { progress: MotionValue<number>; active: number }) {
  const fillOpacity = useTransform(progress, [0.94, 1], [0, 0.08])
  return (
    <svg viewBox="-20 -20 440 400" className="h-full max-h-[64vh] w-full overflow-visible">
      <path
        d={`M${VERTICES.map((v) => `${v.x} ${v.y}`).join(' L')} Z`}
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
      />
      <motion.path
        d={`M${VERTICES.map((v) => `${v.x} ${v.y}`).join(' L')} Z`}
        fill="var(--gold)"
        style={{ opacity: fillOpacity }}
      />
      {[0, 1, 2].map((index) => (
        <Edge key={index} index={index} progress={progress} />
      ))}
      {VERTICES.map((vertex, index) => {
        const lit = active >= index
        return (
          <g key={index}>
            <motion.circle
              cx={vertex.x}
              cy={vertex.y}
              r="16"
              fill="var(--gold)"
              animate={{ opacity: lit ? 0.18 : 0, scale: lit ? 1 : 0.4 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ transformOrigin: `${vertex.x}px ${vertex.y}px` }}
            />
            <circle
              cx={vertex.x}
              cy={vertex.y}
              r="7"
              fill={lit ? 'var(--gold)' : 'var(--background)'}
              stroke={lit ? 'var(--gold)' : 'var(--muted-foreground)'}
              strokeWidth="2"
              className="transition-colors duration-500"
            />
            <text
              x={vertex.labelX}
              y={vertex.labelY}
              textAnchor={vertex.anchor}
              className={cn(
                'font-mono text-[13px] uppercase tracking-[0.14em] transition-colors duration-500',
                lit ? 'fill-foreground' : 'fill-muted-foreground',
              )}
            >
              {CRITERIA[index].short}
            </text>
          </g>
        )
      })}
      <text x="200" y="232" textAnchor="middle" className="fill-foreground font-display text-[68px]">
        {active + 1}
        <tspan className="fill-muted-foreground text-[34px]">/3</tspan>
      </text>
    </svg>
  )
}

function CriterionPanel({ criterion, index }: { criterion: Criterion; index: number }) {
  const Icon = criterion.icon
  return (
    <motion.div
      key={criterion.id}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
      exit={{ opacity: 0, y: -30, transition: { duration: 0.35 } }}
    >
      <div className="flex items-center gap-4">
        <span className="font-display text-6xl leading-none text-gold">0{index + 1}</span>
        <span className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-5 font-display text-[clamp(2rem,3.2vw,3rem)] leading-[1]">{criterion.title}</h3>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">{criterion.description}</p>
      <p className="mt-6 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-xs text-primary">
        Pass if: {criterion.condition}
      </p>
      <p className="mt-6 max-w-md border-l-2 border-gold/60 pl-4 text-sm leading-relaxed text-muted-foreground">
        {criterion.why}
      </p>
    </motion.div>
  )
}

function PinnedDesktop() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(2, Math.floor(value * 3)))
  })

  return (
    <section ref={ref} className="relative" style={{ height: '320vh' }}>
      <div
        className="sticky flex flex-col justify-center overflow-hidden"
        style={{ top: 'var(--app-chrome-offset)', height: 'calc(100svh - var(--app-chrome-offset))' }}
      >
        <div className="mx-auto grid w-full max-w-[84rem] grid-cols-12 items-center gap-10 px-8">
          <div className="col-span-6 flex h-[72%] items-center">
            <TriangleDiagram progress={scrollYProgress} active={active} />
          </div>
          <div className="col-span-5 col-start-8">
            <Heading compact />
            <div className="mb-8 mt-10 flex gap-2">
              {CRITERIA.map((criterion, index) => (
                <span key={criterion.id} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.span
                    className="block h-full bg-primary"
                    animate={{ width: active >= index ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                </span>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <CriterionPanel key={active} criterion={CRITERIA[active]} index={active} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function StackedMobile() {
  return (
    <section className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6">
      <Heading />
      <div className="mt-12 grid gap-4">
        {CRITERIA.map((criterion, index) => {
          const Icon = criterion.icon
          return (
            <motion.article
              key={criterion.id}
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT_ONCE}
              custom={index * 0.08}
              className="rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl text-gold">0{index + 1}</span>
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-3xl">{criterion.title}</h3>
              <p className="mt-2 text-muted-foreground">{criterion.description}</p>
              <p className="mt-4 font-mono text-xs text-primary">Pass if: {criterion.condition}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

export function GoldenTrianglePinned() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion()
  return desktop && !reduceMotion ? <PinnedDesktop /> : <StackedMobile />
}
