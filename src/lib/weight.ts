import { addDays, diffDays, parseISODate, toISODate } from './date'
import type { AppSettings, WeightLog } from '../types'

export function isWeightScheduledDay(date: string, settings: AppSettings): boolean {
  if (!settings.weightStartDate || settings.weightIntervalDays <= 0) return false
  const diff = diffDays(settings.weightStartDate, date)
  return diff >= 0 && diff % settings.weightIntervalDays === 0
}

export function getNextWeightScheduledDate(
  fromDate: string,
  settings: AppSettings,
): string | null {
  if (!settings.weightStartDate || settings.weightIntervalDays <= 0) return null

  let cursor = parseISODate(fromDate)

  for (let i = 0; i < 730; i++) {
    const iso = toISODate(cursor)
    if (isWeightScheduledDay(iso, settings)) return iso
    cursor = addDays(cursor, 1)
  }

  return null
}

export function hasWeightLogOnDate(date: string, weightLogs: WeightLog[]): boolean {
  return weightLogs.some((log) => log.date === date)
}

export function latestWeightLog(weightLogs: WeightLog[]): WeightLog | undefined {
  return [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
}
