import { useEffect, useState } from 'react'

type CountUpOptions = {
  decimals?: number
  duration?: number
  start?: boolean
}

export function useCountUp(target: number, { decimals = 0, duration = 1600, start = true }: CountUpOptions = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let frame = 0
    const began = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - began) / duration, 1)
      setValue(target * (1 - Math.pow(1 - t, 4)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, start])

  return value.toFixed(decimals)
}
