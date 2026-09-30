import { useMemo, useState, type ReactNode } from 'react'
import type { FundPick } from '@/hooks/useFundPicks'
import { PickedFundContext } from './pickedFund'

export function PickedFundProvider({ children }: { children: ReactNode }) {
  const [pick, setPick] = useState<FundPick | null>(null)
  const value = useMemo(() => ({ pick, setPick }), [pick])
  return <PickedFundContext.Provider value={value}>{children}</PickedFundContext.Provider>
}
