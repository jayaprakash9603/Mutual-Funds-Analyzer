import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, Repeat, Shield, Triangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroBackdrop } from '@/components/landing/HeroBackdrop'
import { MagneticCta } from '@/components/landing/MagneticCta'
import { PerformanceCurve } from '@/components/landing/PerformanceCurve'

const criteria = [
  {
    icon: Repeat,
    title: 'Rolling Return',
    description: 'Five-year rolling average has to clear the benchmark average.',
  },
  {
    icon: Shield,
    title: 'Chance of Beating Benchmark',
    description: 'The fund has to win more than 70% of all rolling windows.',
  },
  {
    icon: Gauge,
    title: 'Sharpe Ratio',
    description: 'Return per unit of risk has to stay above the index.',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const

function HeadlineLine({ children, delay }: { children: ReactNode; delay: number }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <motion.span
        className="block"
        initial={reduceMotion ? false : { y: '108%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.85, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export function LandingPage() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('landing-locked')
    return () => root.classList.remove('landing-locked')
  }, [])

  const reduceMotion = useReducedMotion()
  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <div className="landing-viewport relative">
      <HeroBackdrop />

      <div className="relative mx-auto flex w-full max-w-[84rem] flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <div className="grid flex-1 items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-12 lg:gap-12 lg:py-6">
          <div className="lg:col-span-7">
            <motion.p
              {...fade(0)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold tracking-tight"
            >
              <Triangle className="size-3.5 text-primary" aria-hidden="true" />
              Golden Triangle Strategy
            </motion.p>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-[4rem]">
              <HeadlineLine delay={0.08}>
                Find <span className="text-primary">winning</span> funds,
              </HeadlineLine>
              <HeadlineLine delay={0.18}>not lucky ones.</HeadlineLine>
            </h1>

            <motion.p {...fade(0.38)} className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Every mutual fund gets three tests against its benchmark: rolling returns, consistency,
              and risk-adjusted performance. Scored on full NAV history.
            </motion.p>

            <motion.div {...fade(0.5)} className="mt-9 flex flex-wrap items-center gap-3">
              <MagneticCta>
                <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Link to="/fund">
                    Analyze a fund
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </MagneticCta>
              <MagneticCta strength={0.16}>
                <Button asChild variant="outline" size="lg">
                  <Link to="/method">Learn the method</Link>
                </Button>
              </MagneticCta>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
            className="lg:col-span-5"
          >
            <PerformanceCurve />
          </motion.div>
        </div>

        <div className="mb-4 grid border-t border-border/60 sm:grid-cols-[1.05fr_1.15fr_0.9fr] sm:divide-x sm:divide-border/60 lg:mb-5">
          {criteria.map((rule, index) => (
            <motion.div
              key={rule.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + index * 0.09, ease: EASE }}
              className="py-4 sm:first:pr-6 sm:last:pl-6 sm:[&:nth-child(2)]:px-6 lg:py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <rule.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold tracking-tight">{rule.title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
