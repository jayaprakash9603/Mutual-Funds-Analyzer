import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { revealUp, VIEWPORT_ONCE } from './motion'
import { RevealLine } from './RevealLine'
import { SectionLabel } from './SectionLabel'

const FEATURES = [
  {
    image: 'golden-triangle-score',
    tag: 'Scorecard',
    title: 'Golden Triangle verdict',
    body: 'Pass or fail on all three tests, with the numbers behind each one.',
  },
  {
    image: 'rolling-return-trend',
    tag: 'Performance',
    title: 'Rolling return trends',
    body: 'Every 1, 3, 5, 7 and 10-year window, charted against the benchmark.',
  },
  {
    image: 'sip-analysis',
    tag: 'Investment',
    title: 'SIP, lumpsum, STP and SWP',
    body: 'Simulate real investing plans on actual NAV history, with XIRR for each.',
  },
  {
    image: 'peer-comparison',
    tag: 'Assessment',
    title: 'Category peers',
    body: 'See where the fund ranks among its category peers on the same tests.',
  },
  {
    image: 'drawdown-analysis',
    tag: 'Risk',
    title: 'Drawdowns and recoveries',
    body: 'How deep it fell, how long it took to recover, and how often it happens.',
  },
  {
    image: 'ai-insights',
    tag: 'Insights',
    title: 'Plain-language takeaways',
    body: 'Meeting-ready conclusions you can paste straight into a client deck.',
  },
]

function Heading() {
  return (
    <div>
      <SectionLabel index="04">Inside the report</SectionLabel>
      <h2 className="mt-5 font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.01em]">
        <RevealLine>Everything a fund</RevealLine>
        <RevealLine delay={0.1}>
          <em className="text-primary">review meeting</em> needs.
        </RevealLine>
      </h2>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  return (
    <article className="group flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card lg:w-[min(38rem,62vw)]">
      <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-gold/70" />
        <span className="size-2.5 rounded-full bg-primary/70" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {feature.tag}
        </span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={`${import.meta.env.BASE_URL}landing/${feature.image}.webp`}
          alt={`${feature.title} section of an Analyzer fund report`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-start gap-5 p-6">
        <span className="font-display text-4xl leading-none text-gold">0{index + 1}</span>
        <div>
          <h3 className="font-display text-3xl leading-tight">{feature.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
        </div>
      </div>
    </article>
  )
}

function ClosingCard() {
  return (
    <Link
      to="/fund"
      className="group flex w-full shrink-0 flex-col justify-between rounded-2xl bg-primary p-8 text-primary-foreground lg:w-[min(24rem,40vw)]"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">And much more</span>
      <span className="mt-16 font-display text-5xl leading-[0.95]">
        Dozens more charts, tables and matrices.
      </span>
      <span className="mt-10 inline-flex items-center gap-2 font-medium">
        Open a report
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}

function RailDesktop() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative" style={{ height: `calc(100svh + ${distance}px)` }}>
      <div
        className="sticky flex flex-col justify-center gap-10 overflow-hidden"
        style={{ top: 'var(--app-chrome-offset)', height: 'calc(100svh - var(--app-chrome-offset))' }}
      >
        <div className="mx-auto w-full max-w-[84rem] px-8">
          <Heading />
        </div>
        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-6 px-8 will-change-transform xl:px-[max(2rem,calc((100vw-84rem)/2+2rem))]">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.image} feature={feature} index={index} />
          ))}
          <ClosingCard />
        </motion.div>
      </div>
    </section>
  )
}

function RailStacked() {
  return (
    <section className="mx-auto w-full max-w-[84rem] px-4 py-24 sm:px-6">
      <Heading />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.image}
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_ONCE}
          >
            <FeatureCard feature={feature} index={index} />
          </motion.div>
        ))}
        <ClosingCard />
      </div>
    </section>
  )
}

export function ReportRail() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion()
  return desktop && !reduceMotion ? <RailDesktop /> : <RailStacked />
}
