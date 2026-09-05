export type FeedingAmount = 0 | 1 | 2 | 3 | 4 | 5
export type FontPreset = 'system' | 'malgun' | 'pretendard' | 'serif' | 'rounded'

export type FeedingLog = {
  id: string
  date: string
  time?: string
  food: string
  amount: FeedingAmount | null
  memo?: string
}

export type WeightLog = {
  id: string
  date: string
  weight: number
  memo?: string
}

export type TmiLog = {
  id: string
  date: string
  text: string
}

export type PresetGroup =
  | 'activity'
  | 'location'
  | 'shedding'
  | 'body'
  | 'health' // 이전 버전 호환용

export type PresetSelection = {
  id: string
  date: string
  group: PresetGroup
  label: string
}

/** @deprecated Phase 2.2부터 UI/보고서에서는 사용하지 않는 과거 데이터 형식 */
export type EnvironmentLog = {
  id: string
  date: string
  time?: string
  temperature?: number
  humidity?: number
  memo?: string
}

export type DefecationLog = {
  id: string
  date: string
  status?: '정상' | '묽음' | '단단함' | '형태 이상' | '미분류'
  memo?: string
}

export type WeatherLocation = {
  label: string
  latitude: number
  longitude: number
}

export type WeatherSnapshot = {
  date: string
  locationLabel: string
  latitude: number
  longitude: number
  source: 'forecast' | 'archive'
  temperatureMin: number
  temperatureMax: number
  humidityMin: number
  humidityMax: number
  humidityAverage: number
  precipitationSum: number
  precipitationProbabilityMax?: number
  fetchedAt: string
}

export type WeatherAdvice = {
  id: string
  icon: string
  title: string
  message: string
  level: 'info' | 'check' | 'attention'
}

export type AppSettings = {
  adoptionDate: string
  feedingStartDate: string
  feedingIntervalDays: number
  feedingTime: string
  feedingGraceUntilHour: number

  weightStartDate?: string
  weightIntervalDays: number

  fontPreset: FontPreset

  weatherLocationLabel?: string
  weatherLatitude?: number
  weatherLongitude?: number
  weatherAlertsEnabled: boolean
}
