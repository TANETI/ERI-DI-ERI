const KOREA_TIME_ZONE = 'Asia/Seoul'

function koreaDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: Number(pick('hour')),
  }
}

export function todayISO(date = new Date()): string {
  const { year, month, day } = koreaDateTimeParts(date)
  return `${year}-${month}-${day}`
}

export function currentKoreaHour(date = new Date()): number {
  return koreaDateTimeParts(date).hour
}


export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function diffDays(from: string, to: string): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms / 86_400_000)
}

export function isScheduledDay(date: string, startDate: string, intervalDays: number): boolean {
  if (intervalDays <= 0) return false
  const diff = diffDays(startDate, date)
  return diff >= 0 && diff % intervalDays === 0
}

export function timeToMinutes(value?: string): number | null {
  if (!value) return null
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

export function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

export function monthGrid(year: number, monthZeroBased: number): Array<Date | null> {
  const first = new Date(year, monthZeroBased, 1)
  const last = new Date(year, monthZeroBased + 1, 0)
  const cells: Array<Date | null> = []

  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let day = 1; day <= last.getDate(); day++) {
    cells.push(new Date(year, monthZeroBased, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
