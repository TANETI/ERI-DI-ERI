import type { AppSettings } from '../types'

export const defaultSettings: AppSettings = {
  adoptionDate: '2026-08-30',

  feedingStartDate: '2026-08-31',
  feedingIntervalDays: 2,
  feedingTime: '21:00',
  feedingGraceUntilHour: 6,

  weightIntervalDays: 7,

  fontPreset: 'system',

  weatherLocationLabel: '경기도 김포시 구래동',
  weatherLatitude: 37.64368,
  weatherLongitude: 126.62370,
  weatherAlertsEnabled: true,

  feedingScheduleHistory: [],
  weightScheduleHistory: [],
}
