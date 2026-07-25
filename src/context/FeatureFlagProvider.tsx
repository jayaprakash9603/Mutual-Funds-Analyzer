import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchFeatureFlags } from '@/api/client'
import { featureDefaults } from '@/lib/featureDefaults'

type FeatureFlagContextValue = {
  flags: Record<string, boolean>
  ready: boolean
  isEnabled: (key: string) => boolean
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: featureDefaults,
  ready: false,
  isEnabled: (key) => featureDefaults[key] ?? true,
})

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(featureDefaults)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchFeatureFlags(controller.signal)
      .then((remote) => setFlags({ ...featureDefaults, ...remote }))
      .catch((err) => {
        if (controller.signal.aborted) return
        console.warn('Falling back to default feature flags', err)
        setFlags(featureDefaults)
      })
      .finally(() => setReady(true))
    return () => controller.abort()
  }, [])

  const value = useMemo(
    () => ({
      flags,
      ready,
      isEnabled: (key: string) => flags[key] ?? featureDefaults[key] ?? true,
    }),
    [flags, ready],
  )

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeature(key: string) {
  const { isEnabled } = useContext(FeatureFlagContext)
  return isEnabled(key)
}
