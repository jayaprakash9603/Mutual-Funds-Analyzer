import { REPORT_SECTION_SCROLL_OFFSET } from './reportLayoutConstants'

export { REPORT_SECTION_SCROLL_OFFSET } from './reportLayoutConstants'

export function scrollToReportSection(
  id: string,
  offsetPx: number = REPORT_SECTION_SCROLL_OFFSET,
): boolean {
  const el = document.getElementById(id)
  if (!el) return false

  const top = el.getBoundingClientRect().top + window.scrollY - offsetPx
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  return true
}

export function centerElementInScroller(scroller: HTMLElement, element: HTMLElement) {
  const targetLeft = element.offsetLeft - (scroller.clientWidth - element.offsetWidth) / 2
  scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
}
