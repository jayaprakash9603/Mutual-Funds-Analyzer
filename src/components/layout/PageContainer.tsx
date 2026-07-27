import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageWidth = 'wide' | 'default' | 'narrow'

const WIDTH_CLASS: Record<PageWidth, string> = {
  wide: 'max-w-[1600px]',
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
}

type PageContainerProps = {
  children: ReactNode
  width?: PageWidth
  className?: string
}

export function PageContainer({ children, width = 'default', className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8',
        WIDTH_CLASS[width],
        className,
      )}
    >
      {children}
    </div>
  )
}
