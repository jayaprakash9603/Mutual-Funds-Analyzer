import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MAX_CHART_POINTS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`
}

export function downsample<T>(data: T[], maxPoints = MAX_CHART_POINTS): T[] {
  if (data.length <= maxPoints) return data
  const step = data.length / maxPoints
  const result: T[] = []
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)])
  }
  return result
}

export function parseNavDate(dateStr: string): Date {
  const match = dateStr.match(/^([A-Za-z]+ \d+, \d+)/)
  if (!match) return new Date(dateStr)
  return new Date(match[1])
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}
