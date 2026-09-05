import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  EvaluationLog,
  FeedingLog,
  FeedingSchedulePeriod,
  ManagementDecision,
  PresetSelection,
  StructuredDataSnapshot,
  TmiLog,
  WeightLog,
  WeightSchedulePeriod,
} from '../types'
import { defaultSettings } from './defaultSettings'
import {
  seedDefecationLogs,
  seedEnvironmentLogs,
  seedFeedingLogs,
  seedPresetSelections,
  seedTmiLogs,
} from './seed'

export { defaultSettings } from './defaultSettings'

const KEYS = {
  settings: 'eri-di-ery.settings',
  feeding: 'eri-di-ery.feeding',
  weight: 'eri-di-ery.weight',
  tmi: 'eri-di-ery.tmi',
  presets: 'eri-di-ery.presets',
  environment: 'eri-di-ery.environment',
  defecation: 'eri-di-ery.defecation',
  evaluations: 'eri-di-ery.evaluations',
  decisions: 'eri-di-ery.decisions',
  seedVersion: 'eri-di-ery.seed-version',
}

const SEED_VERSION = '2026-09-05-v4'

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

    // 개인용 앱 기본 위치: 김포시 구래동 중심부에 가까운 좌표.
    // 예전 광역 김포시 검색값이 저장돼 있어도 이 버전에서 구래동으로 정리한다.
    weatherLocationLabel: defaultSettings.weatherLocationLabel,
    weatherLatitude: defaultSettings.weatherLatitude,
    weatherLongitude: defaultSettings.weatherLongitude,
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
  // v4: 초기 3회 급여의 섭취량을 사용자가 직접 보정했으므로
  // 같은 seed id의 급여 기록만 새 값으로 교체한다.
  // 사용자가 직접 추가한 다른 급여 기록은 그대로 유지한다.
  save(
    KEYS.feeding,
    replaceSeedRecordsById(existingFeeding, seedFeedingLogs),
  )

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

  getEvaluationLogs: () =>
    load<EvaluationLog[]>(KEYS.evaluations, []).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  saveEvaluationLogs: (value: EvaluationLog[]) =>
    save(KEYS.evaluations, value),

  getManagementDecisions: () =>
    load<ManagementDecision[]>(KEYS.decisions, []).sort((a, b) =>
      `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
    ),
  saveManagementDecisions: (value: ManagementDecision[]) =>
    save(KEYS.decisions, value),

  exportStructuredData: (): StructuredDataSnapshot => ({
    settings: normalizeSettings(
      load<Partial<AppSettings>>(KEYS.settings, defaultSettings),
    ),
    feedingLogs: load<FeedingLog[]>(KEYS.feeding, []),
    weightLogs: load<WeightLog[]>(KEYS.weight, []),
    tmiLogs: load<TmiLog[]>(KEYS.tmi, []),
    presetSelections: load<PresetSelection[]>(KEYS.presets, []),
    environmentLogs: load<EnvironmentLog[]>(KEYS.environment, []),
    defecationLogs: load<DefecationLog[]>(KEYS.defecation, []),
    evaluationLogs: load<EvaluationLog[]>(KEYS.evaluations, []),
    managementDecisions: load<ManagementDecision[]>(KEYS.decisions, []),
  }),

  replaceStructuredData: (data: StructuredDataSnapshot) => {
    save(KEYS.settings, normalizeSettings(data.settings))
    save(KEYS.feeding, data.feedingLogs ?? [])
    save(KEYS.weight, data.weightLogs ?? [])
    save(KEYS.tmi, data.tmiLogs ?? [])
    save(KEYS.presets, data.presetSelections ?? [])
    save(KEYS.environment, data.environmentLogs ?? [])
    save(KEYS.defecation, data.defecationLogs ?? [])
    save(KEYS.evaluations, data.evaluationLogs ?? [])
    save(KEYS.decisions, data.managementDecisions ?? [])

    // 복원 직후 historical seed가 다시 덮어쓰지 않도록 현재 seed 버전으로 표시.
    localStorage.setItem(KEYS.seedVersion, SEED_VERSION)
  },
}
