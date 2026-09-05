import { addDays, isScheduledDay, parseISODate, timeToMinutes, toISODate } from './date'
import type { AppSettings, FeedingLog } from '../types'

/**
 * "급여 예정일"과 "실제 급여일"을 분리해서 다룬다.
 *
 * 기본 규칙:
 * - 예정일 당일에 한 급여는 그 회차 성공.
 * - 예정일 다음 날 새벽이라도 설정한 마감 시각 이하라면
 *   전날 급여 회차의 성공으로 인정.
 *
 * 예:
 * 8/31 예정 + 9/1 02:00 실제 급여 -> 8/31 회차 성공
 */
export function feedingMatchesScheduledDate(
  log: FeedingLog,
  scheduledDate: string,
  settings: AppSettings,
): boolean {
  if (log.date === scheduledDate) return true

  const nextDate = toISODate(addDays(parseISODate(scheduledDate), 1))
  if (log.date !== nextDate) return false

  const minutes = timeToMinutes(log.time)
  if (minutes === null) return false

  return minutes <= settings.feedingGraceUntilHour * 60
}

export function getMatchedFeedingLog(
  scheduledDate: string,
  feedingLogs: FeedingLog[],
  settings: AppSettings,
): FeedingLog | undefined {
  return [...feedingLogs]
    .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
    .find((log) => feedingMatchesScheduledDate(log, scheduledDate, settings))
}

/**
 * 실제 급여가 어떤 예정 회차에 속하는지 계산.
 * 향후 보고서 집계에서도 같은 규칙을 재사용한다.
 */
export function getScheduledDateForFeedingLog(
  log: FeedingLog,
  settings: AppSettings,
): string | null {
  if (isScheduledDay(log.date, settings.feedingStartDate, settings.feedingIntervalDays)) {
    return log.date
  }

  const previousDate = toISODate(addDays(parseISODate(log.date), -1))
  if (
    isScheduledDay(previousDate, settings.feedingStartDate, settings.feedingIntervalDays) &&
    feedingMatchesScheduledDate(log, previousDate, settings)
  ) {
    return previousDate
  }

  return null
}
