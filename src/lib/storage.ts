import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  FeedingLog,
  FeedingSchedulePeriod,
  PresetSelection,
  TmiLog,
  WeightLog,
  WeightSchedulePeriod,
} from '../types'
import {
  seedDefecationLogs,
  seedEnvironmentLogs,
  seedFeedingLogs,
  seedPresetSelections,
  seedTmiLogs,
} from './seed'

const KEYS = {
  settings: 'eri-di-ery.settings',
  feeding: 'eri-di-ery.feeding',
  weight: 'eri-di-ery.weight',
  tmi: 'eri-di-ery.tmi',
  presets: 'eri-di-ery.presets',
  environment: 'eri-di-ery.environment',
  defecation: 'eri-di-ery.defecation',
  seedVersion: 'eri-di-ery.seed-version',
}

const SEED_VERSION = '2026-09-05-v3'

export const defaultSettings: AppSettings = {
  adoptionDate: '2026-08-30',
  feedingStartDate: '2026-08-31',
  feedingIntervalDays: 2,
  feedingTime: '21:00',
  feedingGraceUntilHour: 6,
  weightIntervalDays: 7,
  fontPreset: 'system',
  weatherAlertsEnabled: true,
  feedingScheduleHistory: [],
  weightScheduleHistory: [],
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizeSettings(value: Partial<AppSettings>): AppSettings {
  const feedingIntervalDays = Math.max(
    1,
    Number(value.feedingIntervalDays ?? defaultSettings.feedingIntervalDays),
  )
  const feedingGraceUntilHour = Math.min(
    12,
    Math.max(
      0,
      Number(
        value.feedingGraceUntilHour ??
          defaultSettings.feedingGraceUntilHour,
      ),
    ),
  )
  const weightIntervalDays = Math.max(
    1,
    Number(value.weightIntervalDays ?? defaultSettings.weightIntervalDays),
  )

  const feedingStartDate =
    value.feedingStartDate ?? defaultSettings.feedingStartDate
  const feedingTime =
    value.feedingTime ?? defaultSettings.feedingTime

  const storedFeedingHistory =
    (value.feedingScheduleHistory as FeedingSchedulePeriod[] | undefined) ?? []

  const feedingScheduleHistory: FeedingSchedulePeriod[] =
    storedFeedingHistory.length
      ? [...storedFeedingHistory].sort((a, b) =>
          a.effectiveFrom.localeCompare(b.effectiveFrom),
        )
      : [
          {
            id: `migrated-feeding-${feedingStartDate}`,
            effectiveFrom: feedingStartDate,
            intervalDays: feedingIntervalDays,
            time: feedingTime,
            graceUntilHour: feedingGraceUntilHour,
          },
        ]

  const storedWeightHistory =
    (value.weightScheduleHistory as WeightSchedulePeriod[] | undefined) ?? []

  const weightScheduleHistory: WeightSchedulePeriod[] =
    storedWeightHistory.length
      ? [...storedWeightHistory].sort((a, b) =>
          a.effectiveFrom.localeCompare(b.effectiveFrom),
        )
      : value.weightStartDate
        ? [
            {
              id: `migrated-weight-${value.weightStartDate}`,
              effectiveFrom: value.weightStartDate,
              intervalDays: weightIntervalDays,
            },
          ]
        : []

  return {
    ...defaultSettings,
    ...value,
    feedingStartDate,
    feedingIntervalDays,
    feedingTime,
    feedingGraceUntilHour,
    weightIntervalDays,
    fontPreset: value.fontPreset ?? defaultSettings.fontPreset,
    weatherAlertsEnabled:
      value.weatherAlertsEnabled ??
      defaultSettings.weatherAlertsEnabled,
    feedingScheduleHistory,
    weightScheduleHistory,
  }
}

function mergeById<T extends { id: string }>(existing: T[], seeded: T[]): T[] {
  const ids = new Set(existing.map((item) => item.id))
  return [...existing, ...seeded.filter((item) => !ids.has(item.id))]
}

function replaceSeedRecordsById<T extends { id: string }>(existing: T[], seeded: T[]): T[] {
  const seedIds = new Set(seeded.map((item) => item.id))
  return [...existing.filter((item) => !seedIds.has(item.id)), ...seeded]
}

function removeOldFeedingSeedIds(existing: FeedingLog[]): FeedingLog[] {
  const oldIds = new Set([
    'seed-feed-2026-08-31',
    'seed-feed-2026-09-02',
    'seed-feed-2026-09-04',
  ])
  return existing.filter((item) => !oldIds.has(item.id))
}

function ensureHistoricalSeed() {
  if (localStorage.getItem(KEYS.seedVersion) === SEED_VERSION) return

  const existingFeeding = removeOldFeedingSeedIds(load<FeedingLog[]>(KEYS.feeding, []))
  save(KEYS.feeding, mergeById(existingFeeding, seedFeedingLogs))

  // TMI seed는 문체 수정이 있을 수 있으므로 같은 seed id만 새 내용으로 교체.
  // 사용자가 직접 추가한 TMI는 그대로 유지한다.
  save(KEYS.tmi, replaceSeedRecordsById(load<TmiLog[]>(KEYS.tmi, []), seedTmiLogs))

  save(KEYS.presets, mergeById(load<PresetSelection[]>(KEYS.presets, []), seedPresetSelections))
  save(KEYS.environment, mergeById(load<EnvironmentLog[]>(KEYS.environment, []), seedEnvironmentLogs))
  save(KEYS.defecation, mergeById(load<DefecationLog[]>(KEYS.defecation, []), seedDefecationLogs))

  localStorage.setItem(KEYS.seedVersion, SEED_VERSION)
}

export const store = {
  initialize: ensureHistoricalSeed,

  getSettings: () => normalizeSettings(load<Partial<AppSettings>>(KEYS.settings, defaultSettings)),
  saveSettings: (value: AppSettings) => save(KEYS.settings, normalizeSettings(value)),

  getFeedingLogs: () => load<FeedingLog[]>(KEYS.feeding, []),
  saveFeedingLogs: (value: FeedingLog[]) => save(KEYS.feeding, value),

  getWeightLogs: () => load<WeightLog[]>(KEYS.weight, []),
  saveWeightLogs: (value: WeightLog[]) => save(KEYS.weight, value),

  getTmiLogs: () => load<TmiLog[]>(KEYS.tmi, []),
  saveTmiLogs: (value: TmiLog[]) => save(KEYS.tmi, value),

  getPresetSelections: () => load<PresetSelection[]>(KEYS.presets, []),
  savePresetSelections: (value: PresetSelection[]) => save(KEYS.presets, value),

  getEnvironmentLogs: () => load<EnvironmentLog[]>(KEYS.environment, []),
  saveEnvironmentLogs: (value: EnvironmentLog[]) => save(KEYS.environment, value),

  getDefecationLogs: () => load<DefecationLog[]>(KEYS.defecation, []),
  saveDefecationLogs: (value: DefecationLog[]) => save(KEYS.defecation, value),
}
