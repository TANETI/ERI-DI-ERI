import type {
  AppSettings,
  DecisionRow,
  DefecationLog,
  DefecationRow,
  EnvironmentLog,
  EnvironmentRow,
  EvaluationLog,
  EvaluationRow,
  FeedingLog,
  FeedingRow,
  FeedingSchedulePeriod,
  FeedingScheduleRow,
  ManagementDecision,
  PhotoMeta,
  PhotoRow,
  PresetRow,
  PresetSelection,
  SettingsRow,
  StructuredDataSnapshot,
  TmiLog,
  TmiRow,
  WeightLog,
  WeightRow,
  WeightSchedulePeriod,
  WeightScheduleRow,
} from './types'

const nowIso = () => new Date().toISOString()

async function allRows<T>(
  db: D1Database,
  sql: string,
): Promise<T[]> {
  const result = await db.prepare(sql).all<T>()

  if (!result.success) {
    throw new Error(
      result.error || 'D1 query failed',
    )
  }

  return result.results ?? []
}

function nullable<T>(
  value: T | undefined,
): T | null {
  return value === undefined ? null : value
}

function settingsStatement(
  db: D1Database,
  settings: AppSettings,
) {
  return db
    .prepare(`
      INSERT INTO app_settings (
        singleton,
        adoption_date,
        feeding_start_date,
        feeding_interval_days,
        feeding_time,
        feeding_grace_until_hour,
        weight_start_date,
        weight_interval_days,
        font_preset,
        weather_location_label,
        weather_latitude,
        weather_longitude,
        weather_alerts_enabled,
        updated_at
      )
      VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(singleton) DO UPDATE SET
        adoption_date = excluded.adoption_date,
        feeding_start_date = excluded.feeding_start_date,
        feeding_interval_days = excluded.feeding_interval_days,
        feeding_time = excluded.feeding_time,
        feeding_grace_until_hour = excluded.feeding_grace_until_hour,
        weight_start_date = excluded.weight_start_date,
        weight_interval_days = excluded.weight_interval_days,
        font_preset = excluded.font_preset,
        weather_location_label = excluded.weather_location_label,
        weather_latitude = excluded.weather_latitude,
        weather_longitude = excluded.weather_longitude,
        weather_alerts_enabled = excluded.weather_alerts_enabled,
        updated_at = excluded.updated_at
    `)
    .bind(
      settings.adoptionDate,
      settings.feedingStartDate,
      settings.feedingIntervalDays,
      settings.feedingTime,
      settings.feedingGraceUntilHour,
      nullable(settings.weightStartDate),
      settings.weightIntervalDays,
      settings.fontPreset,
      nullable(settings.weatherLocationLabel),
      nullable(settings.weatherLatitude),
      nullable(settings.weatherLongitude),
      settings.weatherAlertsEnabled ? 1 : 0,
      nowIso(),
    )
}

function feedingScheduleStatements(
  db: D1Database,
  rows: FeedingSchedulePeriod[],
) {
  return [
    db.prepare('DELETE FROM feeding_schedule_periods'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO feeding_schedule_periods (
          id,
          effective_from,
          interval_days,
          time,
          grace_until_hour
        )
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        row.id,
        row.effectiveFrom,
        row.intervalDays,
        row.time,
        row.graceUntilHour,
      ),
    ),
  ]
}

function weightScheduleStatements(
  db: D1Database,
  rows: WeightSchedulePeriod[],
) {
  return [
    db.prepare('DELETE FROM weight_schedule_periods'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO weight_schedule_periods (
          id,
          effective_from,
          interval_days
        )
        VALUES (?, ?, ?)
      `).bind(
        row.id,
        row.effectiveFrom,
        row.intervalDays,
      ),
    ),
  ]
}

function feedingStatements(
  db: D1Database,
  rows: FeedingLog[],
) {
  return [
    db.prepare('DELETE FROM feeding_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO feeding_logs (
          id, date, time, food, amount, amount_ml, memo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        nullable(row.time),
        row.food,
        row.amount,
        nullable(row.amountMl),
        nullable(row.memo),
      ),
    ),
  ]
}

function weightStatements(
  db: D1Database,
  rows: WeightLog[],
) {
  return [
    db.prepare('DELETE FROM weight_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO weight_logs (
          id, date, weight, memo
        )
        VALUES (?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        row.weight,
        nullable(row.memo),
      ),
    ),
  ]
}

function tmiStatements(
  db: D1Database,
  rows: TmiLog[],
) {
  return [
    db.prepare('DELETE FROM tmi_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO tmi_logs (
          id, date, text
        )
        VALUES (?, ?, ?)
      `).bind(
        row.id,
        row.date,
        row.text,
      ),
    ),
  ]
}

function presetStatements(
  db: D1Database,
  rows: PresetSelection[],
) {
  return [
    db.prepare('DELETE FROM preset_selections'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO preset_selections (
          id, date, group_name, label
        )
        VALUES (?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        row.group,
        row.label,
      ),
    ),
  ]
}

function environmentStatements(
  db: D1Database,
  rows: EnvironmentLog[],
) {
  return [
    db.prepare('DELETE FROM environment_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO environment_logs (
          id, date, time, temperature, humidity, memo
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        nullable(row.time),
        nullable(row.temperature),
        nullable(row.humidity),
        nullable(row.memo),
      ),
    ),
  ]
}

function defecationStatements(
  db: D1Database,
  rows: DefecationLog[],
) {
  return [
    db.prepare('DELETE FROM defecation_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO defecation_logs (
          id, date, status, memo
        )
        VALUES (?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        nullable(row.status),
        nullable(row.memo),
      ),
    ),
  ]
}

function evaluationStatements(
  db: D1Database,
  rows: EvaluationLog[],
) {
  return [
    db.prepare('DELETE FROM evaluation_logs'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO evaluation_logs (
          id, created_at, report_start, report_end, text
        )
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        row.id,
        row.createdAt,
        row.reportStart,
        row.reportEnd,
        row.text,
      ),
    ),
  ]
}

function decisionStatements(
  db: D1Database,
  rows: ManagementDecision[],
) {
  return [
    db.prepare('DELETE FROM management_decisions'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO management_decisions (
          id,
          date,
          created_at,
          category,
          status,
          title,
          detail,
          evaluation_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        row.id,
        row.date,
        row.createdAt,
        row.category,
        row.status,
        row.title,
        nullable(row.detail),
        nullable(row.evaluationId),
      ),
    ),
  ]
}

function photoStatements(
  db: D1Database,
  rows: PhotoMeta[],
) {
  return [
    db.prepare('DELETE FROM photo_meta'),
    ...rows.map((row) =>
      db.prepare(`
        INSERT INTO photo_meta (
          id,
          date,
          created_at,
          caption,
          is_cover,
          file_name,
          mime_type,
          size_bytes,
          object_key
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).bind(
        row.id,
        row.date,
        row.createdAt,
        nullable(row.caption),
        row.isCover ? 1 : 0,
        row.fileName,
        row.mimeType,
        row.sizeBytes,
      ),
    ),
  ]
}

async function runBatch(
  db: D1Database,
  statements: D1PreparedStatement[],
) {
  const results = await db.batch(statements)
  const failed = results.find((result) => !result.success)

  if (failed) {
    throw new Error(
      failed.error || 'D1 batch failed',
    )
  }
}

export async function readSnapshot(
  db: D1Database,
): Promise<StructuredDataSnapshot> {
  const settingsRow = await db
    .prepare(`
      SELECT
        adoption_date,
        feeding_start_date,
        feeding_interval_days,
        feeding_time,
        feeding_grace_until_hour,
        weight_start_date,
        weight_interval_days,
        font_preset,
        weather_location_label,
        weather_latitude,
        weather_longitude,
        weather_alerts_enabled
      FROM app_settings
      WHERE singleton = 1
    `)
    .first<SettingsRow>()

  if (!settingsRow) {
    throw new Error(
      'D1 app_settings row is missing. Apply migrations first.',
    )
  }

  const [
    feedingScheduleRows,
    weightScheduleRows,
    feedingRows,
    weightRows,
    tmiRows,
    presetRows,
    environmentRows,
    defecationRows,
    evaluationRows,
    decisionRows,
  ] = await Promise.all([
    allRows<FeedingScheduleRow>(
      db,
      'SELECT * FROM feeding_schedule_periods ORDER BY effective_from ASC',
    ),
    allRows<WeightScheduleRow>(
      db,
      'SELECT * FROM weight_schedule_periods ORDER BY effective_from ASC',
    ),
    allRows<FeedingRow>(
      db,
      `SELECT * FROM feeding_logs
       ORDER BY date DESC, COALESCE(time, '') DESC, id DESC`,
    ),
    allRows<WeightRow>(
      db,
      'SELECT * FROM weight_logs ORDER BY date DESC, id DESC',
    ),
    allRows<TmiRow>(
      db,
      'SELECT * FROM tmi_logs ORDER BY date DESC, id DESC',
    ),
    allRows<PresetRow>(
      db,
      'SELECT * FROM preset_selections ORDER BY date DESC, id DESC',
    ),
    allRows<EnvironmentRow>(
      db,
      `SELECT * FROM environment_logs
       ORDER BY date DESC, COALESCE(time, '') DESC, id DESC`,
    ),
    allRows<DefecationRow>(
      db,
      'SELECT * FROM defecation_logs ORDER BY date DESC, id DESC',
    ),
    allRows<EvaluationRow>(
      db,
      'SELECT * FROM evaluation_logs ORDER BY created_at DESC',
    ),
    allRows<DecisionRow>(
      db,
      'SELECT * FROM management_decisions ORDER BY date DESC, created_at DESC',
    ),
  ])

  const settings: AppSettings = {
    adoptionDate: settingsRow.adoption_date,
    feedingStartDate: settingsRow.feeding_start_date,
    feedingIntervalDays: settingsRow.feeding_interval_days,
    feedingTime: settingsRow.feeding_time,
    feedingGraceUntilHour: settingsRow.feeding_grace_until_hour,
    weightStartDate:
      settingsRow.weight_start_date ?? undefined,
    weightIntervalDays: settingsRow.weight_interval_days,
    fontPreset: settingsRow.font_preset,
    weatherLocationLabel:
      settingsRow.weather_location_label ?? undefined,
    weatherLatitude:
      settingsRow.weather_latitude ?? undefined,
    weatherLongitude:
      settingsRow.weather_longitude ?? undefined,
    weatherAlertsEnabled:
      Boolean(settingsRow.weather_alerts_enabled),
    feedingScheduleHistory: feedingScheduleRows.map((row) => ({
      id: row.id,
      effectiveFrom: row.effective_from,
      intervalDays: row.interval_days,
      time: row.time,
      graceUntilHour: row.grace_until_hour,
    })),
    weightScheduleHistory: weightScheduleRows.map((row) => ({
      id: row.id,
      effectiveFrom: row.effective_from,
      intervalDays: row.interval_days,
    })),
  }

  return {
    settings,
    feedingLogs: feedingRows.map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time ?? undefined,
      food: row.food,
      amount:
        row.amount === null
          ? null
          : row.amount as FeedingLog['amount'],
      amountMl: row.amount_ml ?? undefined,
      memo: row.memo ?? undefined,
    })),
    weightLogs: weightRows.map((row) => ({
      id: row.id,
      date: row.date,
      weight: row.weight,
      memo: row.memo ?? undefined,
    })),
    tmiLogs: tmiRows.map((row) => ({
      id: row.id,
      date: row.date,
      text: row.text,
    })),
    presetSelections: presetRows.map((row) => ({
      id: row.id,
      date: row.date,
      group: row.group_name,
      label: row.label,
    })),
    environmentLogs: environmentRows.map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time ?? undefined,
      temperature: row.temperature ?? undefined,
      humidity: row.humidity ?? undefined,
      memo: row.memo ?? undefined,
    })),
    defecationLogs: defecationRows.map((row) => ({
      id: row.id,
      date: row.date,
      status: row.status ?? undefined,
      memo: row.memo ?? undefined,
    })),
    evaluationLogs: evaluationRows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      reportStart: row.report_start,
      reportEnd: row.report_end,
      text: row.text,
    })),
    managementDecisions: decisionRows.map((row) => ({
      id: row.id,
      date: row.date,
      createdAt: row.created_at,
      category: row.category,
      status: row.status,
      title: row.title,
      detail: row.detail ?? undefined,
      evaluationId: row.evaluation_id ?? undefined,
    })),
  }
}

export async function replaceSettings(
  db: D1Database,
  settings: AppSettings,
) {
  await runBatch(db, [
    settingsStatement(db, settings),
    ...feedingScheduleStatements(
      db,
      settings.feedingScheduleHistory,
    ),
    ...weightScheduleStatements(
      db,
      settings.weightScheduleHistory,
    ),
  ])
}

export async function replaceSnapshot(
  db: D1Database,
  snapshot: StructuredDataSnapshot,
) {
  await runBatch(db, [
    settingsStatement(db, snapshot.settings),
    ...feedingScheduleStatements(
      db,
      snapshot.settings.feedingScheduleHistory,
    ),
    ...weightScheduleStatements(
      db,
      snapshot.settings.weightScheduleHistory,
    ),
    ...feedingStatements(db, snapshot.feedingLogs),
    ...weightStatements(db, snapshot.weightLogs),
    ...tmiStatements(db, snapshot.tmiLogs),
    ...presetStatements(db, snapshot.presetSelections),
    ...environmentStatements(db, snapshot.environmentLogs),
    ...defecationStatements(db, snapshot.defecationLogs),
    ...evaluationStatements(db, snapshot.evaluationLogs),
    ...decisionStatements(db, snapshot.managementDecisions),
  ])
}

export const replaceFeedingLogs = (
  db: D1Database,
  rows: FeedingLog[],
) => runBatch(db, feedingStatements(db, rows))

export const replaceWeightLogs = (
  db: D1Database,
  rows: WeightLog[],
) => runBatch(db, weightStatements(db, rows))

export const replaceTmiLogs = (
  db: D1Database,
  rows: TmiLog[],
) => runBatch(db, tmiStatements(db, rows))

export const replacePresetSelections = (
  db: D1Database,
  rows: PresetSelection[],
) => runBatch(db, presetStatements(db, rows))

export const replaceDefecationLogs = (
  db: D1Database,
  rows: DefecationLog[],
) => runBatch(db, defecationStatements(db, rows))

export const replaceEvaluationLogs = (
  db: D1Database,
  rows: EvaluationLog[],
) => runBatch(db, evaluationStatements(db, rows))

export const replaceManagementDecisions = (
  db: D1Database,
  rows: ManagementDecision[],
) => runBatch(db, decisionStatements(db, rows))

export async function readPhotoMeta(
  db: D1Database,
): Promise<PhotoMeta[]> {
  const rows = await allRows<PhotoRow>(
    db,
    `SELECT * FROM photo_meta
     ORDER BY date DESC, created_at DESC`,
  )

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    createdAt: row.created_at,
    caption: row.caption ?? undefined,
    isCover: Boolean(row.is_cover),
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
  }))
}

export const replacePhotoMeta = (
  db: D1Database,
  rows: PhotoMeta[],
) => runBatch(db, photoStatements(db, rows))
