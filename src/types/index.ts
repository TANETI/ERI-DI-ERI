

export type StructuredDataSnapshot = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  environmentLogs: EnvironmentLog[]
  defecationLogs: DefecationLog[]
  evaluationLogs: EvaluationLog[]
  managementDecisions: ManagementDecision[]
}

export type PhotoMeta = {
  id: string
  date: string
  createdAt: string
  caption?: string
  isCover: boolean
  fileName: string
  mimeType: string
  sizeBytes: number
}


export type EvaluationLog = {
  id: string
  createdAt: string
  reportStart: string
  reportEnd: string
  text: string
}

export type DecisionCategory =
  | 'feeding'
  | 'weight'
  | 'weather'
  | 'habitat'
  | 'observation'
  | 'other'

export type DecisionStatus =
  | 'planned'
  | 'applied'
  | 'ended'

export type ManagementDecision = {
  id: string
  date: string
  createdAt: string
  category: DecisionCategory
  status: DecisionStatus
  title: string
  detail?: string
  evaluationId?: string
}

export type FeedingAmount = 0 | 1 | 2 | 3 | 4 | 5
export type FontPreset = 'system' | 'malgun' | 'pretendard' | 'serif' | 'rounded'

export type FeedingLog = {
  id: string
  date: string
  time?: string
  food: string

  /**
   * 체감 섭취 단계.
   * 0=안 먹음, 1=맛만 봄, 2=소량, 3=보통, 4=많이, 5=거의 다 먹음.
   * 기존 기록과 기본 입력 방식은 이 값을 사용한다.
   */
  amount: FeedingAmount | null

  /**
   * 실제 급여량을 계량하기 시작했을 때 사용할 선택적 mL 값.
   * amount와 amountMl은 둘 다 기록할 수도 있다.
   */
  amountMl?: number

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

export type WeatherPeriodSummary = {
  startHour: number
  endHour: number
  label: string
  temperatureMin: number
  temperatureMax: number
  humidityMin: number
  humidityMax: number
  precipitationSum: number
  precipitationProbabilityMax?: number
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

  // 00-02부터 22-24까지 2시간 단위 12구간.
  periods2h: WeatherPeriodSummary[]

  fetchedAt: string
}

export type WeatherAdvice = {
  id: string
  icon: string
  title: string
  message: string
  level: 'info' | 'check' | 'attention'
}

export type FeedingSchedulePeriod = {
  id: string
  effectiveFrom: string
  intervalDays: number
  time: string
  graceUntilHour: number
}

export type WeightSchedulePeriod = {
  id: string
  effectiveFrom: string
  intervalDays: number
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

  feedingScheduleHistory: FeedingSchedulePeriod[]
  weightScheduleHistory: WeightSchedulePeriod[]
}
