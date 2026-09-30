import { useCallback, useState } from 'react'
import { FinalCta } from '@/components/landing/FinalCta'
import { FundShowcase } from '@/components/landing/FundShowcase'
import { GoldenTrianglePinned } from '@/components/landing/GoldenTrianglePinned'
import { IntroLoader } from '@/components/landing/IntroLoader'
import { LandingHero } from '@/components/landing/LandingHero'
import { Marquee } from '@/components/landing/Marquee'
import { ParallaxBand } from '@/components/landing/ParallaxBand'
import { ReportRail } from '@/components/landing/ReportRail'
import { ScrollWords } from '@/components/landing/ScrollWords'
import { SectionLabel } from '@/components/landing/SectionLabel'
import { StatsCounters } from '@/components/landing/StatsCounters'

const MANIFESTO =
  'Most funds look brilliant in a bull run. The real question is whether they beat their *benchmark* from every start date, through every cycle and every correction. Analyzer tests the *full history*, so luck has nowhere to hide.'

export function LandingPage() {
  const [ready, setReady] = useState(false)
  const handleIntroDone = useCallback(() => setReady(true), [])

  return (
    <div className="relative overflow-x-clip">
      <IntroLoader onDone={handleIntroDone} />
      <div
        className="landing-grain pointer-events-none fixed inset-[-50%] z-[60] opacity-[0.035] dark:opacity-[0.05]"
        aria-hidden="true"
      />

      <LandingHero ready={ready} />
      <Marquee />

      <section className="mx-auto w-full max-w-[84rem] px-4 py-28 sm:px-6 lg:px-8 lg:py-40">
        <SectionLabel index="01">Why rolling returns</SectionLabel>
        <ScrollWords
          text={MANIFESTO}
          className="mt-8 max-w-[70rem] font-display text-[clamp(2.1rem,4.8vw,4.6rem)] leading-[1.05] tracking-[-0.01em]"
        />
      </section>

      <GoldenTrianglePinned />
      <FundShowcase />
      <ReportRail />
      <ParallaxBand />
      <StatsCounters />
      <FinalCta />
    </div>
  )
}
