import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroBackdrop } from './HeroBackdrop'
import { MagneticCta } from './MagneticCta'
import { RevealLine } from './RevealLine'
import { TriangleField } from './TriangleField'
import { EASE } from './motion'

const META = [
  { label: 'Tests per fund', value: '3' },
  { label: 'Rolling horizons', value: '1 · 3 · 5 · 7 · 10Y' },
  { label: 'Win-rate bar', value: '> 70%' },
  { label: 'History scored', value: 'Full NAV' },
]

export function LandingHero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fieldY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: EASE },
  })

  return (
    <section ref={ref} className="landing-hero relative flex flex-col overflow-hidden">
      <HeroBackdrop />

      <motion.div
        style={reduceMotion ? undefined : { y: fieldY }}
        className="absolute inset-0 opacity-30 lg:inset-y-0 lg:left-auto lg:right-[-4%] lg:w-[58%] lg:opacity-100"
      >
        <motion.div
          className="h-full w-full"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.6, delay: 0.2, ease: EASE }}
        >
          <TriangleField className="h-full w-full" />
        </motion.div>
      </motion.div>

      <motion.div
        style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex w-full max-w-[84rem] flex-1 flex-col justify-center px-4 pb-36 pt-14 sm:px-6 lg:px-8 lg:pb-40"
      >
        <motion.p
          {...fade(0)}
          className="inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em]"
        >
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
            <span className="relative size-2 rounded-full bg-gold" />
          </span>
          Golden Triangle Strategy
        </motion.p>

        <h1 className="mt-7 font-display text-[clamp(3.6rem,10vw,9rem)] font-normal leading-[0.9] tracking-[-0.02em]">
          <RevealLine play={ready} delay={0.05}>
            Find <em className="text-primary">winning</em>
          </RevealLine>
          <RevealLine play={ready} delay={0.15}>
            funds, not
          </RevealLine>
          <RevealLine play={ready} delay={0.25}>
            lucky ones.
          </RevealLine>
        </h1>

        <motion.p {...fade(0.45)} className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Every mutual fund faces three tests against its benchmark: rolling returns, consistency and
          risk-adjusted performance, scored across its full NAV history.
        </motion.p>

        <motion.div {...fade(0.55)} className="mt-9 flex flex-wrap items-center gap-4">
          <MagneticCta>
            <Button asChild size="lg" className="h-12 gap-2 rounded-full px-7 shadow-lg shadow-primary/25">
              <Link to="/fund">
                Analyze a fund
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </MagneticCta>
          <MagneticCta strength={0.16}>
            <Button asChild variant="ghost" size="lg" className="h-12 rounded-full px-5">
              <Link to="/method">Learn the method</Link>
            </Button>
          </MagneticCta>
        </motion.div>
      </motion.div>

      <motion.div
        {...fade(0.75)}
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[84rem] items-end justify-between gap-6 px-4 pb-6 sm:px-6 lg:px-8"
      >
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 border-t border-border/70 pt-4 sm:grid-cols-4">
          {META.map((item) => (
            <div key={item.label}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="hidden items-center gap-3 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:flex">
          Scroll
          <span className="relative h-10 w-px overflow-hidden bg-border">
            <motion.span
              className="absolute inset-x-0 h-1/2 bg-primary"
              animate={reduceMotion ? undefined : { top: ['-50%', '100%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  )
}
