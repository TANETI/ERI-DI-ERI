import { addDays, diffDays, parseISODate, todayISO, toISODate } from './date'
import type {
  AppSettings,
  FeedingSchedulePeriod,
  WeightSchedulePeriod,
} from '../types'

function sortByEffectiveFrom<T extends { effectiveFrom: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
}

export function getFeedingScheduleHistory(
  settings: Pick<
    AppSettings,
    | 'feedingStartDate'
    | 'feedingIntervalDays'
    | 'feedingTime'
    | 'feedingGraceUntilHour'
    | 'feedingScheduleHistory'
  >,
): FeedingSchedulePeriod[] {
  const history = settings.feedingScheduleHistory ?? []

  if (history.length) return sortByEffectiveFrom(history)

  return [
    {
      id: `legacy-feeding-${settings.feedingStartDate}`,
      effectiveFrom: settings.feedingStartDate,
      intervalDays: settings.feedingIntervalDays,
      time: settings.feedingTime,
      graceUntilHour: settings.feedingGraceUntilHour,
    },
  ]
}

export function getWeightScheduleHistory(
  settings: Pick<
    AppSettings,
    'weightStartDate' | 'weightIntervalDays' | 'weightScheduleHistory'
  >,
): WeightSchedulePeriod[] {
  const history = settings.weightScheduleHistory ?? []

  if (history.length) return sortByEffectiveFrom(history)

  if (!settings.weightStartDate) return []

  return [
    {
      id: `legacy-weight-${settings.weightStartDate}`,
      effectiveFrom: settings.weightStartDate,
      intervalDays: settings.weightIntervalDays,
    },
  ]
}

export function getFeedingScheduleForDate(
  date: string,
  settings: AppSettings,
): FeedingSchedulePeriod | null {
  const history = getFeedingScheduleHistory(settings)

  let active: FeedingSchedulePeriod | null = null

  for (const period of history) {
    if (period.effectiveFrom > date) break
    active = period
  }

  return active
}

export function getWeightScheduleForDate(
  date: string,
  settings: AppSettings,
): WeightSchedulePeriod | null {
  const history = getWeightScheduleHistory(settings)

  let active: WeightSchedulePeriod | null = null

  for (const period of history) {
    if (period.effectiveFrom > date) break
    active = period
  }

  return active
}

export function isFeedingScheduledDay(
  date: string,
  settings: AppSettings,
): boolean {
  const period = getFeedingScheduleForDate(date, settings)
  if (!period || period.intervalDays <= 0) return false

  const diff = diffDays(period.effectiveFrom, date)
  return diff >= 0 && diff % period.intervalDays === 0
}

export function isWeightScheduledDate(
  date: string,
  settings: AppSettings,
): boolean {
  const period = getWeightScheduleForDate(date, settings)
  if (!period || period.intervalDays <= 0) return false

  const diff = diffDays(period.effectiveFrom, date)
  return diff >= 0 && diff % period.intervalDays === 0
}

export function getNextFeedingScheduledDate(
  fromDate: string,
  settings: AppSettings,
): string | null {
  let cursor = parseISODate(fromDate)

  for (let i = 0; i < 730; i++) {
    const iso = toISODate(cursor)
    if (isFeedingScheduledDay(iso, settings)) return iso
    cursor = addDays(cursor, 1)
  }

  return null
}

export function getNextWeightScheduledDateFromHistory(
  fromDate: string,
  settings: AppSettings,
): string | null {
  if (!getWeightScheduleHistory(settings).length) return null

  let cursor = parseISODate(fromDate)

  for (let i = 0; i < 1460; i++) {
    const iso = toISODate(cursor)
    if (isWeightScheduledDate(iso, settings)) return iso
    cursor = addDays(cursor, 1)
  }

  return null
}

function upsertFeedingPeriod(
  history: FeedingSchedulePeriod[],
  period: Omit<FeedingSchedulePeriod, 'id'>,
): FeedingSchedulePeriod[] {
  const existing = history.find((item) => item.effectiveFrom === period.effectiveFrom)

  const nextPeriod: FeedingSchedulePeriod = {
    ...period,
    id: existing?.id ?? crypto.randomUUID(),
  }

  return sortByEffectiveFrom([
    ...history.filter((item) => item.effectiveFrom !== period.effectiveFrom),
    nextPeriod,
  ])
}

function upsertWeightPeriod(
  history: WeightSchedulePeriod[],
  period: Omit<WeightSchedulePeriod, 'id'>,
): WeightSchedulePeriod[] {
  const existing = history.find((item) => item.effectiveFrom === period.effectiveFrom)

  const nextPeriod: WeightSchedulePeriod = {
    ...period,
    id: existing?.id ?? crypto.randomUUID(),
  }

  return sortByEffectiveFrom([
    ...history.filter((item) => item.effectiveFrom !== period.effectiveFrom),
    nextPeriod,
  ])
}

/**
 * 설정 화면에서 새 스케줄을 저장할 때 기존 기간을 덮어쓰지 않고
 * effectiveFrom 날짜부터 새 정책을 추가한다.
 *
 * 같은 effectiveFrom 날짜로 다시 저장하면 그 기간만 수정한다.
 */
export function commitScheduleChanges(
  previous: AppSettings,
  draft: AppSettings,
): AppSettings {
  const previousFeeding = getFeedingScheduleHistory(previous)
  const previousWeight = getWeightScheduleHistory(previous)

  const feedingChanged =
    previous.feedingStartDate !== draft.feedingStartDate ||
    previous.feedingIntervalDays !== draft.feedingIntervalDays ||
    previous.feedingTime !== draft.feedingTime ||
    previous.feedingGraceUntilHour !== draft.feedingGraceUntilHour

  const weightChanged =
    previous.weightStartDate !== draft.weightStartDate ||
    previous.weightIntervalDays !== draft.weightIntervalDays

  const feedingScheduleHistory = feedingChanged
    ? upsertFeedingPeriod(previousFeeding, {
        effectiveFrom: draft.feedingStartDate,
        intervalDays: draft.feedingIntervalDays,
        time: draft.feedingTime,
        graceUntilHour: draft.feedingGraceUntilHour,
      })
    : previousFeeding

  let weightScheduleHistory = previousWeight

  if (weightChanged) {
    if (!draft.weightStartDate) {
      weightScheduleHistory = []
    } else {
      const anchorChanged =
        previous.weightStartDate !== draft.weightStartDate

      const effectiveFrom = anchorChanged
        ? draft.weightStartDate
        : todayISO()

      weightScheduleHistory = upsertWeightPeriod(previousWeight, {
        effectiveFrom,
        intervalDays: draft.weightIntervalDays,
      })
    }
  }

  return {
    ...draft,
    feedingScheduleHistory,
    weightScheduleHistory,
  }
}

export function startWeightSchedule(
  settings: AppSettings,
  firstMeasurementDate: string,
): AppSettings {
  const period: WeightSchedulePeriod = {
    id: crypto.randomUUID(),
    effectiveFrom: firstMeasurementDate,
    intervalDays: settings.weightIntervalDays,
  }

  return {
    ...settings,
    weightStartDate: firstMeasurementDate,
    weightScheduleHistory: [period],
  }
}

/**
 * 첫 체중 기록 자체가 수정/삭제된 경우 첫 기간의 anchor만 정리한다.
 * 이후 사용자가 명시적으로 만든 스케줄 변경 기간은 가능한 한 보존한다.
 */
export function reanchorWeightSchedule(
  settings: AppSettings,
  previousStart: string | undefined,
  nextStart: string | undefined,
): AppSettings {
  if (!previousStart || settings.weightStartDate !== previousStart) {
    return settings
  }

  if (!nextStart) {
    return {
      ...settings,
      weightStartDate: undefined,
      weightScheduleHistory: [],
    }
  }

  const history = getWeightScheduleHistory(settings)
  const first = history[0]

  if (!first) {
    return startWeightSchedule(settings, nextStart)
  }

  const nextHistory = sortByEffectiveFrom([
    {
      ...first,
      effectiveFrom: nextStart,
    },
    ...history.slice(1).filter((item) => item.effectiveFrom > nextStart),
  ])

  return {
    ...settings,
    weightStartDate: nextStart,
    weightScheduleHistory: nextHistory,
  }
}
