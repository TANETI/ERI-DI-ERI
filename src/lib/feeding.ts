import { addDays, parseISODate, timeToMinutes, toISODate } from './date'
import {
  getFeedingScheduleForDate,
  isFeedingScheduledDay,
} from './schedule'
import type { AppSettings, FeedingLog } from '../types'

/**
 * 급여 예정 회차에 적용되던 당시의 시간/새벽 인정 규칙으로 실제 급여를 매칭한다.
 */
export function feedingMatchesScheduledDate(
  log: FeedingLog,
  scheduledDate: string,
  settings: AppSettings,
): boolean {
  const schedule = getFeedingScheduleForDate(scheduledDate, settings)
  if (!schedule || !isFeedingScheduledDay(scheduledDate, settings)) {
    return false
  }

  if (log.date === scheduledDate) return true

  const nextDate = toISODate(addDays(parseISODate(scheduledDate), 1))
  if (log.date !== nextDate) return false

  const minutes = timeToMinutes(log.time)
  if (minutes === null) return false

  return minutes <= schedule.graceUntilHour * 60
}

export function getMatchedFeedingLog(
  scheduledDate: string,
  feedingLogs: FeedingLog[],
  settings: AppSettings,
): FeedingLog | undefined {
  return [...feedingLogs]
    .sort((a, b) =>
      `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`),
    )
    .find((log) =>
      feedingMatchesScheduledDate(log, scheduledDate, settings),
    )
}

/**
 * 실제 급여가 어떤 역사적 예정 회차에 속하는지 계산한다.
 */
export function getScheduledDateForFeedingLog(
  log: FeedingLog,
  settings: AppSettings,
): string | null {
  if (isFeedingScheduledDay(log.date, settings)) {
    return log.date
  }

  const previousDate = toISODate(addDays(parseISODate(log.date), -1))

  if (
    isFeedingScheduledDay(previousDate, settings) &&
    feedingMatchesScheduledDate(log, previousDate, settings)
  ) {
    return previousDate
  }

  return null
}
