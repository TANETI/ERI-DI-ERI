import { useEffect, useMemo, useState } from 'react'
import Card from './Card'
import {
  buildWeatherAdvice,
  fetchWeatherForDate,
  maybeNotifyWeatherAdvice,
  weatherLocationFromSettings,
} from '../lib/weather'
import type { AppSettings, WeatherSnapshot } from '../types'

type Props = {
  date: string
  settings: AppSettings
  compact?: boolean
  title?: string
}

export default function WeatherContextCard({
  date,
  settings,
  compact = false,
  title = '지역 날씨',
}: Props) {
  const location = useMemo(
    () => weatherLocationFromSettings(settings),
    [
      settings.weatherLocationLabel,
      settings.weatherLatitude,
      settings.weatherLongitude,
    ],
  )

  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    if (!location) {
      setSnapshot(null)
      setError('')
      setLoading(false)
      return () => controller.abort()
    }

    setLoading(true)
    setError('')

    fetchWeatherForDate(date, location, controller.signal)
      .then(async (result) => {
        if (controller.signal.aborted) return
        setSnapshot(result)
        const advices = buildWeatherAdvice(result)
        await maybeNotifyWeatherAdvice(result, advices, settings)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setSnapshot(null)
        setError(
          reason instanceof Error
            ? reason.message
            : '지역 날씨를 불러오지 못했습니다.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [
    date,
    location?.label,
    location?.latitude,
    location?.longitude,
    settings.weatherAlertsEnabled,
  ])

  const className = compact ? 'weather-card compact' : 'weather-card'

  if (!location) {
    return (
      <Card title={title} icon="☁️" className={className}>
        <p className="empty">더보기 → 설정에서 우리 집 지역을 먼저 지정해 주세요.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card title={title} icon="☁️" className={className}>
        <p className="empty">{location.label} 날씨를 불러오는 중…</p>
      </Card>
    )
  }

  if (error || !snapshot) {
    return (
      <Card title={title} icon="☁️" className={className}>
        <p className="empty">{error || '날씨 자료가 없습니다.'}</p>
      </Card>
    )
  }

  const advices = buildWeatherAdvice(snapshot)

  return (
    <Card title={title} icon="☁️" className={className}>
      <div className="weather-summary">
        <div>
          <span>지역</span>
          <strong>{snapshot.locationLabel}</strong>
        </div>
        <div>
          <span>기온</span>
          <strong>{snapshot.temperatureMin}–{snapshot.temperatureMax}℃</strong>
        </div>
        <div>
          <span>습도</span>
          <strong>{snapshot.humidityMin}–{snapshot.humidityMax}%</strong>
        </div>
        <div>
          <span>강수</span>
          <strong>
            {snapshot.precipitationSum} mm
            {snapshot.precipitationProbabilityMax !== undefined
              ? ` · 최대 ${snapshot.precipitationProbabilityMax}%`
              : ''}
          </strong>
        </div>
      </div>

      <div className="weather-advice-list">
        {advices.map((item) => (
          <div className={`weather-advice ${item.level}`} key={item.id}>
            <span aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="weather-disclaimer">
        지역 실외 날씨를 바탕으로 한 ‘확인 알림’이에요. 사육장 내부 온습도를 그대로 뜻하지는 않습니다.
      </p>
    </Card>
  )
}
