import { createContext, useContext, type ReactNode } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET } from '../lib/nav/reportScroll'

const ReportScrollContext = createContext(REPORT_SECTION_SCROLL_OFFSET)

export function ReportScrollProvider({
  offset,
  children,
}: {
  offset: number
  children: ReactNode
}) {
  return <ReportScrollContext.Provider value={offset}>{children}</ReportScrollContext.Provider>
}

export function useReportScrollOffset() {
  return useContext(ReportScrollContext)
}

/** Navbar height (h-16) used when measuring sticky section nav offset. */
export const REPORT_NAVBAR_HEIGHT_PX = 64
