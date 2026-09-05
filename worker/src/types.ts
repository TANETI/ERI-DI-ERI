import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  EvaluationLog,
  FeedingLog,
  FeedingSchedulePeriod,
  ManagementDecision,
  PhotoMeta,
  PresetSelection,
  StructuredDataSnapshot,
  TmiLog,
  WeightLog,
  WeightSchedulePeriod,
} from '../../src/types'

export type Env = {
  DB: D1Database
  API_TOKEN?: string
  ALLOWED_ORIGIN?: string
}

export type SettingsRow = {
  adoption_date: string
  feeding_start_date: string
  feeding_interval_days: number
  feeding_time: string
  feeding_grace_until_hour: number
  weight_start_date: string | null
  weight_interval_days: number
  font_preset: AppSettings['fontPreset']
  weather_location_label: string | null
  weather_latitude: number | null
  weather_longitude: number | null
  weather_alerts_enabled: number
}

export type FeedingScheduleRow = {
  id: string
  effective_from: string
  interval_days: number
  time: string
  grace_until_hour: number
}

export type WeightScheduleRow = {
  id: string
  effective_from: string
  interval_days: number
}

export type FeedingRow = {
  id: string
  date: string
  time: string | null
  food: string
  amount: number | null
  amount_ml: number | null
  memo: string | null
}

export type WeightRow = {
  id: string
  date: string
  weight: number
  memo: string | null
}

export type TmiRow = {
  id: string
  date: string
  text: string
}

export type PresetRow = {
  id: string
  date: string
  group_name: PresetSelection['group']
  label: string
}

export type EnvironmentRow = {
  id: string
  date: string
  time: string | null
  temperature: number | null
  humidity: number | null
  memo: string | null
}

export type DefecationRow = {
  id: string
  date: string
  status: DefecationLog['status'] | null
  memo: string | null
}

export type EvaluationRow = {
  id: string
  created_at: string
  report_start: string
  report_end: string
  text: string
}

export type DecisionRow = {
  id: string
  date: string
  created_at: string
  category: ManagementDecision['category']
  status: ManagementDecision['status']
  title: string
  detail: string | null
  evaluation_id: string | null
}

export type PhotoRow = {
  id: string
  date: string
  created_at: string
  caption: string | null
  is_cover: number
  file_name: string
  mime_type: string
  size_bytes: number
  object_key: string | null
}

export type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  EvaluationLog,
  FeedingLog,
  FeedingSchedulePeriod,
  ManagementDecision,
  PhotoMeta,
  PresetSelection,
  StructuredDataSnapshot,
  TmiLog,
  WeightLog,
  WeightSchedulePeriod,
}
