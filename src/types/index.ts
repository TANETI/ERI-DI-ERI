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

export type PresetSelection = {
  id: string
  date: string
  group: 'activity' | 'location' | 'health'
  label: string
}

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

export type AppSettings = {
  adoptionDate: string
  feedingStartDate: string
  feedingIntervalDays: number
  feedingTime: string
  feedingGraceUntilHour: number
  weightStartDate?: string
  weightIntervalDays: number
  fontPreset: FontPreset
}
