import { addDays, parseISODate, toISODate } from './date'
import {
  getNextWeightScheduledDateFromHistory,
  getWeightScheduleHistory,
  isWeightScheduledDate,
} from './schedule'
import type { AppSettings, WeightLog } from '../types'

export function isWeightScheduledDay(
  date: string,
  settings: AppSettings,
): boolean {
  return isWeightScheduledDate(date, settings)
}

export function getNextWeightScheduledDate(
  fromDate: string,
  settings: AppSettings,
): string | null {
  return getNextWeightScheduledDateFromHistory(fromDate, settings)
}

export function hasWeightLogOnDate(
  date: string,
  weightLogs: WeightLog[],
): boolean {
  return weightLogs.some((log) => log.date === date)
}

export function latestWeightLog(
  weightLogs: WeightLog[],
): WeightLog | undefined {
  return [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
}

/**
 * 예정일 이후, 다음 예정일 직전까지 들어온 첫 체중 기록을
 * 그 예정 회차의 늦은 측정으로 인정한다.
 *
 * 이렇게 하면 9/15 측정을 놓치고 9/16에 재도
 * 일정 자체가 9/16 기준으로 밀리지는 않는다.
 */
export function getMatchedWeightLog(
  scheduledDate: string,
  weightLogs: WeightLog[],
  settings: AppSettings,
): WeightLog | undefined {
  if (!isWeightScheduledDate(scheduledDate, settings)) return undefined

  const nextSearchStart = toISODate(
    addDays(parseISODate(scheduledDate), 1),
  )
  const nextScheduled =
    getNextWeightScheduledDateFromHistory(nextSearchStart, settings)

  return [...weightLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find(
      (log) =>
        log.date >= scheduledDate &&
        (!nextScheduled || log.date < nextScheduled),
    )
}

export function getOldestOutstandingWeightDueDate(
  today: string,
  weightLogs: WeightLog[],
  settings: AppSettings,
): string | null {
  const history = getWeightScheduleHistory(settings)
  if (!history.length) return null

  let cursor = parseISODate(history[0].effectiveFrom)
  const end = parseISODate(today)

  while (cursor.getTime() <= end.getTime()) {
    const iso = toISODate(cursor)

    if (
      isWeightScheduledDate(iso, settings) &&
      !getMatchedWeightLog(iso, weightLogs, settings)
    ) {
      return iso
    }

    cursor = addDays(cursor, 1)
  }

  return null
}
