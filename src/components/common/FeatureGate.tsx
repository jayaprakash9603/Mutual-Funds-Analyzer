import type { ReactNode } from 'react'
import { useFeature } from '@/context/FeatureFlagProvider'

export function FeatureGate({
  name,
  children,
  fallback = null,
}: {
  name: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const enabled = useFeature(name)
  if (!enabled) return fallback
  return children
}
