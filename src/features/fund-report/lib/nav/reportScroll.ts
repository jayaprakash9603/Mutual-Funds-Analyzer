import { REPORT_SECTION_SCROLL_OFFSET } from './reportLayoutConstants'

export { REPORT_SECTION_SCROLL_OFFSET } from './reportLayoutConstants'

const REPORT_MOBILE_LAYOUT_MQ = '(max-width: 1023px)'

export function isReportMobileLayoutViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REPORT_MOBILE_LAYOUT_MQ).matches
}

export function scrollToReportSection(
  id: string,
  offsetPx: number = REPORT_SECTION_SCROLL_OFFSET,
): number | false {
  const el = document.getElementById(id)
  if (!el) return false

  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offsetPx)
  const behavior: ScrollBehavior = isReportMobileLayoutViewport() ? 'auto' : 'smooth'
  window.scrollTo({ top, behavior })
  return top
}

function isElementFullyVisibleInScroller(scroller: HTMLElement, element: HTMLElement): boolean {
  const left = element.offsetLeft
  const right = left + element.offsetWidth
  const viewLeft = scroller.scrollLeft
  const viewRight = viewLeft + scroller.clientWidth
  return left >= viewLeft - 1 && right <= viewRight + 1
}

export function centerElementInScroller(
  scroller: HTMLElement,
  element: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (isElementFullyVisibleInScroller(scroller, element)) return

  const targetLeft = element.offsetLeft - (scroller.clientWidth - element.offsetWidth) / 2
  scroller.scrollTo({ left: Math.max(0, targetLeft), behavior })
}
