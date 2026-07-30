import type { FundReportAssessment } from '../../schemas'
import { qualityComponentsForDisplay } from '../verdictPresentation'

type QualityComponent = FundReportAssessment['qualityScore']['components'][number]

export const RISK_QUALITY_COMPONENT_NAMES = new Set([
  'Sharpe',
  'Standard Deviation',
  'Beta Risk Level',
  'Rolling Returns',
  'Consistency',
])

export function riskQualityComponents(components: QualityComponent[]): QualityComponent[] {
  return qualityComponentsForDisplay(components).filter((component) =>
    RISK_QUALITY_COMPONENT_NAMES.has(component.name),
  )
}

export function supportingQualityComponents(components: QualityComponent[]): QualityComponent[] {
  return qualityComponentsForDisplay(components).filter(
    (component) => !RISK_QUALITY_COMPONENT_NAMES.has(component.name),
  )
}

export function averageRiskQualityScore(components: QualityComponent[]): number | null {
  const riskComponents = riskQualityComponents(components)
  if (riskComponents.length === 0) {
    return null
  }
  const total = riskComponents.reduce((sum, component) => sum + component.score, 0)
  return Math.round(total / riskComponents.length)
}
