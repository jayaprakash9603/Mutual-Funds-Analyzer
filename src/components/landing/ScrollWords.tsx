import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

type Token = { text: string; accent: boolean }

function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ text: word.replace(/\*/g, ''), accent: word.includes('*') }))
}

function Word({
  token,
  progress,
  range,
}: {
  token: Token
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.14, 1])
  return (
    <motion.span
      style={{ opacity }}
      className={cn('inline-block', token.accent && 'italic text-primary')}
    >
      {token.text}
    </motion.span>
  )
}

/** Paragraph whose words light up one by one as it scrolls through the viewport. Wrap accent words in *asterisks*. */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const tokens = tokenize(text)

  return (
    <p ref={ref} className={cn('flex flex-wrap gap-x-[0.28em]', className)}>
      {tokens.map((token, index) =>
        reduceMotion ? (
          <span key={index} className={cn(token.accent && 'italic text-primary')}>
            {token.text}
          </span>
        ) : (
          <Word
            key={index}
            token={token}
            progress={scrollYProgress}
            range={[index / tokens.length, (index + 1) / tokens.length]}
          />
        ),
      )}
    </p>
  )
}
