export type {
  RollingReturnRow,
  GoldenTriangleResult,
  TimelineEvent,
} from '@/api/schemas'

export interface NavPoint {
  date: Date
  nav: number
}

export interface AnalysisInput {
  fund: import('@/api/schemas').RollingReturnRow[]
  benchmark: import('@/api/schemas').RollingReturnRow[]
  period: string
}
