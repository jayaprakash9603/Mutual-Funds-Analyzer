import { createContext, useContext } from 'react'
import type { FundPick } from '@/hooks/useFundPicks'

export type PickedFundValue = {
  pick: FundPick | null
  setPick: (pick: FundPick) => void
}

export const PickedFundContext = createContext<PickedFundValue>({ pick: null, setPick: () => {} })

export function usePickedFund() {
  return useContext(PickedFundContext)
}
