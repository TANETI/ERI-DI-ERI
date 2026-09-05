import type {
  AppSettings,
  WeatherAdvice,
  WeatherLocation,
  WeatherSnapshot,
} from '../types'

type GeocodingResult = {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  admin2?: string
}

type HourlyResponse = {
  hourly?: {
    temperature_2m?: Array<number | null>
    relative_humidity_2m?: Array<number | null>
    precipitation?: Array<number | null>
    precipitation_probability?: Array<number | null>
  }
}

const CACHE_PREFIX = 'eri-di-ery.weather-cache.'
const NOTIFY_PREFIX = 'eri-di-ery.weather-notified.'

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits))
}

function validNumbers(values?: Array<number | null>): number[] {
  return (values ?? []).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  )
}

function cacheKey(date: string, latitude: number, longitude: number) {
  return `${CACHE_PREFIX}${date}.${latitude.toFixed(3)}.${longitude.toFixed(3)}`
}

function readCache(
  date: string,
  latitude: number,
  longitude: number,
): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(cacheKey(date, latitude, longitude))
    if (!raw) return null

    const snapshot = JSON.parse(raw) as WeatherSnapshot
    const age = Date.now() - new Date(snapshot.fetchedAt).getTime()
    const today = new Date().toISOString().slice(0, 10)
    const maxAge =
      date >= today
        ? 3 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000

    return age <= maxAge ? snapshot : null
  } catch {
    return null
  }
}

function writeCache(snapshot: WeatherSnapshot) {
  localStorage.setItem(
    cacheKey(snapshot.date, snapshot.latitude, snapshot.longitude),
    JSON.stringify(snapshot),
  )
}

export async function searchWeatherLocations(
  query: string,
): Promise<WeatherLocation[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', '6')
  url.searchParams.set('language', 'ko')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) throw new Error('지역 검색에 실패했습니다.')

  const data = (await response.json()) as { results?: GeocodingResult[] }

  return (data.results ?? []).map((item) => {
    const region = [item.admin2, item.admin1, item.country]
      .filter(Boolean)
      .join(', ')

    return {
      label: region ? `${item.name} · ${region}` : item.name,
      latitude: item.latitude,
      longitude: item.longitude,
    }
  })
}

export function weatherLocationFromSettings(
  settings: AppSettings,
): WeatherLocation | null {
  if (
    typeof settings.weatherLatitude !== 'number' ||
    typeof settings.weatherLongitude !== 'number'
  ) {
    return null
  }

  return {
    label: settings.weatherLocationLabel || '설정한 지역',
    latitude: settings.weatherLatitude,
    longitude: settings.weatherLongitude,
  }
}

export async function fetchWeatherForDate(
  date: string,
  location: WeatherLocation,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const cached = readCache(date, location.latitude, location.longitude)
  if (cached) return cached

  const today = new Date().toISOString().slice(0, 10)
  const isPast = date < today
  const endpoint = isPast
    ? 'https://archive-api.open-meteo.com/v1/archive'
    : 'https://api.open-meteo.com/v1/forecast'

  const url = new URL(endpoint)
  url.searchParams.set('latitude', String(location.latitude))
  url.searchParams.set('longitude', String(location.longitude))
  url.searchParams.set('start_date', date)
  url.searchParams.set('end_date', date)
  url.searchParams.set('timezone', 'Asia/Seoul')

  const hourly = [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
  ]
  if (!isPast) hourly.push('precipitation_probability')
  url.searchParams.set('hourly', hourly.join(','))

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(
      isPast
        ? '과거 지역 날씨를 불러오지 못했습니다.'
        : '지역 날씨 예보를 불러오지 못했습니다.',
    )
  }

  const data = (await response.json()) as HourlyResponse
  const temperatures = validNumbers(data.hourly?.temperature_2m)
  const humidities = validNumbers(data.hourly?.relative_humidity_2m)
  const precipitation = validNumbers(data.hourly?.precipitation)
  const precipitationProbability = validNumbers(
    data.hourly?.precipitation_probability,
  )

  if (!temperatures.length || !humidities.length) {
    throw new Error('이 날짜의 기온·습도 자료가 없습니다.')
  }

  const snapshot: WeatherSnapshot = {
    date,
    locationLabel: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    source: isPast ? 'archive' : 'forecast',
    temperatureMin: round(Math.min(...temperatures)),
    temperatureMax: round(Math.max(...temperatures)),
    humidityMin: Math.round(Math.min(...humidities)),
    humidityMax: Math.round(Math.max(...humidities)),
    humidityAverage: Math.round(
      humidities.reduce((sum, value) => sum + value, 0) / humidities.length,
    ),
    precipitationSum: round(
      precipitation.reduce((sum, value) => sum + value, 0),
    ),
    precipitationProbabilityMax: precipitationProbability.length
      ? Math.round(Math.max(...precipitationProbability))
      : undefined,
    fetchedAt: new Date().toISOString(),
  }

  writeCache(snapshot)
  return snapshot
}

/**
 * 외부 날씨를 사육장 내부 환경으로 간주하지 않고,
 * '오늘은 무엇을 한 번 더 확인할지'를 알려주는 보조 신호만 만든다.
 */
export function buildWeatherAdvice(
  snapshot: WeatherSnapshot,
): WeatherAdvice[] {
  const result: WeatherAdvice[] = []

  if (snapshot.temperatureMax >= 28) {
    result.push({
      id: 'hot',
      icon: '🌡️',
      title: '오늘은 냉방 여부를 확인해요',
      message:
        '바깥 최고기온이 높아요. 실내와 사육장이 평소보다 더워질 수 있으니 에어컨 사용이나 사육장 위치를 확인하는 편이 좋아요.',
      level: 'attention',
    })
  }

  if (snapshot.temperatureMin <= 14) {
    result.push({
      id: 'cold',
      icon: '🧊',
      title: '창가 쪽 급랭을 확인해요',
      message:
        '바깥 최저기온이 낮아요. 창가나 외벽 가까운 사육장이 평소보다 차가워지지 않는지 확인해 주세요.',
      level: 'check',
    })
  }

  const veryHumid =
    snapshot.humidityAverage >= 80 ||
    snapshot.humidityMax >= 92 ||
    snapshot.precipitationSum >= 5

  if (veryHumid) {
    result.push({
      id: 'humid',
      icon: '💧',
      title: '오늘은 분무를 조금 보수적으로',
      message:
        '바깥 공기가 매우 습하거나 비가 오는 날이에요. 사육장이 평소보다 천천히 마를 수 있으니 분무 전에 내부 상태를 보고, 필요하면 평소보다 양을 줄이는 편이 좋아요.',
      level: 'check',
    })
  } else if (snapshot.humidityAverage <= 45) {
    result.push({
      id: 'dry',
      icon: '🍂',
      title: '오늘은 건조 속도를 확인해요',
      message:
        '바깥 공기가 건조해요. 사육장이 평소보다 빨리 마를 수 있으니 저녁 분무 뒤 상태를 한 번 더 확인해 주세요.',
      level: 'info',
    })
  }

  if (!result.length) {
    result.push({
      id: 'normal',
      icon: '🌿',
      title: '날씨상 특별한 관리 신호는 없어요',
      message:
        '오늘 지역 날씨만 보면 큰 변수가 두드러지지 않아요. 평소 루틴대로 관리하면 됩니다.',
      level: 'info',
    })
  }

  return result
}

export async function maybeNotifyWeatherAdvice(
  snapshot: WeatherSnapshot,
  advices: WeatherAdvice[],
  settings: AppSettings,
) {
  if (!settings.weatherAlertsEnabled) return
  if (snapshot.date !== new Date().toISOString().slice(0, 10)) return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const noteworthy = advices.filter((item) => item.level !== 'info')
  if (!noteworthy.length) return

  const key = `${NOTIFY_PREFIX}${snapshot.date}.${snapshot.latitude.toFixed(3)}.${snapshot.longitude.toFixed(3)}`
  if (localStorage.getItem(key)) return

  new Notification('🦎 ERI DI-ERY 날씨 체크', {
    body: noteworthy
      .slice(0, 2)
      .map((item) => `${item.icon} ${item.title}`)
      .join(' · '),
    tag: `eri-weather-${snapshot.date}`,
  })

  localStorage.setItem(key, new Date().toISOString())
}
