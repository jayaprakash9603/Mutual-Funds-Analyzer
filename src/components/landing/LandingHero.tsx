import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategoryPicks, type CategoryFund } from '@/hooks/useCategoryPicks'
import { useFundPicks } from '@/hooks/useFundPicks'
import { amcById } from './bowl/amcs'
import { CategoryStrip } from './bowl/CategoryStrip'
import { RuleChecklist } from './bowl/RuleChecklist'
import { WinnersCard } from './bowl/WinnersCard'
import type { SceneCategory, StageEvent } from './bowl/sieve'
import { HeroBackdrop } from './HeroBackdrop'
import { MagneticCta } from './MagneticCta'
import { usePickedFund } from './pickedFund'
import { RevealLine } from './RevealLine'
import { EASE } from './motion'

const FundBowlScene = lazy(() => import('./bowl/FundBowlScene'))

export function LandingHero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const picks = useFundPicks()
  const categories = useCategoryPicks()
  const { setPick } = usePickedFund()
  const [spotlightId, setSpotlightId] = useState<string | null>(null)
  const [requested, setRequested] = useState<{ value: string; at: number } | null>(null)
  const [requestedCategory, setRequestedCategory] = useState<{ value: number; at: number } | null>(null)
  const [stage, setStage] = useState<StageEvent | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)
  const sceneCategories = useMemo<SceneCategory[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        label: c.label,
        benchmark: c.benchmark,
        funds: c.funds.map((f) => ({ id: f.id, amc: f.amc, tag: f.tag, failsAt: f.failsAt, score: f.rollingAvg })),
      })),
    [categories],
  )
  const category = categories.find((c) => c.id === stage?.category.id)
  const findFund = useCallback(
    (id: string) => categories.flatMap((c) => c.funds).find((f) => f.id === id),
    [categories],
  )
  const winnerFunds = (stage?.winners ?? []).map(findFund).filter((f): f is CategoryFund => f !== undefined)
  const podiumIds = stage?.podium ?? []
  const winnerDots = podiumIds
    .map((id) => {
      const fund = findFund(id)
      const amc = fund && amcById(fund.amc)
      return amc && fund ? { id, label: fund.tag ? `${amc.label} ${fund.tag}` : amc.label, color: amc.color } : undefined
    })
    .filter((d) => d !== undefined)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.25])
  const storyY = useTransform(scrollYProgress, [0, 1], ['0%', '-22%'])
  const storyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const cardY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%'])

  const onUnsupported = useCallback(() => setWebglFailed(true), [])
  const onSpotlight = useCallback(
    (id: string | null) => {
      setSpotlightId(id)
      const fund = id ? findFund(id) : undefined
      const pick = fund && picks.find((p) => p.fundName.replace(/\s+/g, ' ') === fund.fundName)
      if (pick && scrollYProgress.get() < 0.35) setPick(pick)
    },
    [findFund, picks, scrollYProgress, setPick],
  )
  const onSelect = useCallback((id: string) => setRequested({ value: id, at: Date.now() }), [])
  const onSelectCategory = useCallback((index: number) => setRequestedCategory({ value: index, at: Date.now() }), [])
  const categoryLabels = categories.map((c) => c.label)

  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: EASE },
  })

  return (
    <section ref={ref} className="landing-hero relative isolate overflow-hidden">
      <HeroBackdrop />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 45% 50% at 55% 55%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)',
        }}
      />

      <motion.div style={reduceMotion ? undefined : { opacity: sceneOpacity }} className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.8, delay: 0.1, ease: EASE }}
        >
          {!webglFailed && sceneCategories.length > 0 && (
            <Suspense fallback={null}>
              <FundBowlScene
                categories={sceneCategories}
                onSpotlight={onSpotlight}
                onStage={setStage}
                reduceMotion={reduceMotion}
                onUnsupported={onUnsupported}
                scrollProgress={scrollYProgress}
                requestedSpotlight={requested}
                requestedCategory={requestedCategory}
              />
            </Suspense>
          )}
        </motion.div>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-gradient-to-r from-background via-background/75 to-transparent lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-background via-background/70 to-transparent lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/70 to-transparent"
        aria-hidden
      />

      <motion.div
        style={reduceMotion ? undefined : { y: storyY, opacity: storyOpacity }}
        className="relative z-10 mx-auto flex h-full min-h-[inherit] max-w-[90rem] flex-col px-4 pb-6 pt-6 sm:px-6 lg:justify-center lg:px-10 lg:py-12"
      >
        <div className="max-w-md lg:w-[34%] lg:min-w-[25rem] lg:max-w-[30rem]">
          <motion.p
            {...fade(0.05)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
              <span className="relative size-1.5 rounded-full bg-gold" />
            </span>
            Mutual fund analyzer · Golden Triangle
          </motion.p>

          <h1 className="mt-4 font-display text-[clamp(2.3rem,4.4vw,4.4rem)] font-normal leading-[0.95] tracking-[-0.02em] lg:mt-5">
            <RevealLine play={ready} delay={0.15}>
              Find <em className="text-primary">winning</em> funds,
            </RevealLine>
            <RevealLine play={ready} delay={0.25}>
              not lucky ones.
            </RevealLine>
          </h1>

          <motion.p {...fade(0.4)} className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mt-5 lg:text-[15px]">
            We test every fund against its benchmark on three rules, across its full NAV history, and show you
            which ones actually win.
          </motion.p>

          <motion.div {...fade(0.5)} className="mt-6 hidden lg:block">
            <CategoryStrip labels={categoryLabels} event={stage} onSelect={onSelectCategory} className="mb-4" />
            <RuleChecklist event={stage} winners={winnerDots} more={winnerFunds.length - winnerDots.length} />
          </motion.div>

          <motion.div {...fade(0.6)} className="mt-7 hidden items-center gap-3 lg:flex">
            <HeroCtas />
          </motion.div>
        </div>

        <motion.div {...fade(0.6)} className="mt-auto lg:hidden">
          <CategoryStrip labels={categoryLabels} event={stage} onSelect={onSelectCategory} className="mb-3" />
          <RuleChecklist event={stage} winners={winnerDots} more={winnerFunds.length - winnerDots.length} />
          <div className="mt-4 flex items-center gap-2">
            <HeroCtas />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        style={reduceMotion ? undefined : { y: cardY }}
        className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center lg:inset-x-auto lg:inset-y-0 lg:right-10 lg:items-center"
      >
        <AnimatePresence mode="wait">
          {spotlightId && ready && category && winnerFunds.length > 0 && (
            <WinnersCard
              key={category.id}
              category={category}
              winners={winnerFunds}
              podiumIds={podiumIds}
              activeId={spotlightId}
              onSelect={onSelect}
              className="w-full max-w-[26rem] lg:w-[24rem]"
            />
          )}
        </AnimatePresence>
      </motion.div>

      <div
        data-flow-start
        className="pointer-events-none absolute right-[calc(2.5rem+11.5rem)] top-[calc(50%+13rem)] hidden size-px lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-10 w-px bg-gradient-to-b from-primary/0 to-primary/70 lg:hidden"
        aria-hidden
      />
    </section>
  )
}

function HeroCtas() {
  return (
    <>
      <MagneticCta>
        <Button asChild size="lg" className="h-11 gap-2 rounded-full px-6 shadow-lg shadow-primary/25">
          <Link to="/fund">
            Analyze a fund
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </MagneticCta>
      <MagneticCta strength={0.16}>
        <Button asChild variant="ghost" size="lg" className="h-11 rounded-full px-4 sm:px-5">
          <Link to="/method">How it works</Link>
        </Button>
      </MagneticCta>
    </>
  )
}
