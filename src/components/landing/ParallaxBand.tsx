import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LEGAL_ROUTES } from '@/lib/site'
import { SectionLabel } from './SectionLabel'

export function ParallaxBand() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.18, 1.05, 1.12])
  const lineOneX = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])
  const lineTwoX = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <section ref={ref} className="relative isolate flex min-h-[85svh] items-center overflow-hidden">
      <motion.img
        src={`${import.meta.env.BASE_URL}landing/mumbai-marine-drive.webp`}
        alt="Marine Drive in Mumbai at dusk, lit along the bay"
        loading="lazy"
        decoding="async"
        style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/40 to-background" />
      <div className="absolute inset-0 -z-10 bg-background/30 dark:bg-background/45" />

      <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-6 lg:px-8">
        <SectionLabel index="05" className="text-foreground/80">
          The data
        </SectionLabel>
        <h2 className="mt-6 font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.9] tracking-[-0.02em] text-foreground">
          <motion.span className="block" style={reduceMotion ? undefined : { x: lineOneX }}>
            Built on every NAV
          </motion.span>
          <motion.span className="block italic text-primary" style={reduceMotion ? undefined : { x: lineTwoX }}>
            since inception.
          </motion.span>
        </h2>
        <p className="mt-8 max-w-xl text-lg text-foreground/80">
          Scores use each fund&apos;s full daily NAV history and its official benchmark index, not a flattering
          three-year snapshot.
        </p>
      </div>

      <Link
        to={LEGAL_ROUTES.sources}
        className="absolute bottom-4 right-4 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/60 hover:text-foreground sm:right-8"
      >
        Marine Drive, Mumbai · Photo: Nishith Parikh / Unsplash
      </Link>
    </section>
  )
}
