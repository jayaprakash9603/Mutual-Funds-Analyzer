import type { MotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { createFundBowl, type FundBowlHandle } from './createFundBowl'
import type { SceneCategory, StageEvent } from './sieve'

type Request<T> = { value: T; at: number } | null

type FundBowlSceneProps = {
  categories: SceneCategory[]
  onSpotlight: (fundId: string | null) => void
  onStage: (event: StageEvent) => void
  reduceMotion: boolean
  onUnsupported: () => void
  scrollProgress?: MotionValue<number>
  requestedSpotlight: Request<string>
  requestedCategory: Request<number>
}

export default function FundBowlScene({
  categories,
  onSpotlight,
  onStage,
  reduceMotion,
  onUnsupported,
  scrollProgress,
  requestedSpotlight,
  requestedCategory,
}: FundBowlSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<FundBowlHandle | null>(null)
  const callbacks = useRef({ onSpotlight, onStage, onUnsupported })
  const categoriesKey = JSON.stringify(categories)

  useEffect(() => {
    callbacks.current = { onSpotlight, onStage, onUnsupported }
  })

  useEffect(() => {
    const container = containerRef.current
    const parsed = JSON.parse(categoriesKey) as SceneCategory[]
    if (!container || !parsed.length) return
    try {
      const handle = createFundBowl(container, {
        categories: parsed,
        onSpotlight: (id) => callbacks.current.onSpotlight(id),
        onStage: (event) => callbacks.current.onStage(event),
        reduceMotion,
      })
      handleRef.current = handle
      const unsubscribe = scrollProgress?.on('change', (value) => handle.setScroll(value))
      return () => {
        unsubscribe?.()
        handle.dispose()
        handleRef.current = null
      }
    } catch {
      callbacks.current.onUnsupported()
    }
  }, [categoriesKey, reduceMotion, scrollProgress])

  useEffect(() => {
    if (requestedSpotlight) handleRef.current?.setSpotlight(requestedSpotlight.value)
  }, [requestedSpotlight])

  useEffect(() => {
    if (requestedCategory) handleRef.current?.setCategory(requestedCategory.value)
  }, [requestedCategory])

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />
}
