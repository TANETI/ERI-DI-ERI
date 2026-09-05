import { useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card'
import {
  currentKoreaHour,
  todayISO,
} from '../lib/date'
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

function currentKoreanHourForDate(date: string) {
  return date === todayISO()
    ? currentKoreaHour()
    : null
}

function formatHour(hour: number) {
  return String(hour).padStart(2, '0')
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
  const periodStripRef = useRef<HTMLDivElement | null>(null)

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


  useEffect(() => {
    if (!snapshot) return

    const currentHour = currentKoreanHourForDate(snapshot.date)
    if (currentHour === null) return

    const strip = periodStripRef.current
    const currentCard = strip?.querySelector<HTMLElement>(
      '[data-current-period="true"]',
    )

    if (!strip || !currentCard) return

    const frame = window.requestAnimationFrame(() => {
      const targetLeft =
        currentCard.offsetLeft -
        (strip.clientWidth - currentCard.offsetWidth) / 2

      strip.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [snapshot])

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
      <div className="weather-source-line">
        <span className="weather-source-badge">구래동 기준</span>
        <span>{snapshot.locationLabel}</span>
      </div>

      <div className="weather-day-overview" aria-label="하루 전체 요약">
        <span>
          하루 전체
          <strong>{snapshot.temperatureMin}–{snapshot.temperatureMax}℃</strong>
        </span>
        <span>
          습도
          <strong>{snapshot.humidityMin}–{snapshot.humidityMax}%</strong>
        </span>
        <span>
          강수
          <strong>
            {snapshot.precipitationSum} mm
            {snapshot.precipitationProbabilityMax !== undefined
              ? ` · 최대 ${snapshot.precipitationProbabilityMax}%`
              : ''}
          </strong>
        </span>
        <span className="weather-day-source">Open-Meteo</span>
      </div>

      <div className="weather-dial-wrap">
        <div className="weather-dial-center-mark" aria-hidden="true" />

        <div
          className="weather-period-dial"
          ref={periodStripRef}
          aria-label="2시간 단위 날씨 다이얼"
        >
          {snapshot.periods2h.map((period) => {
            const currentHour = currentKoreanHourForDate(snapshot.date)
            const isCurrent =
              currentHour !== null &&
              currentHour >= period.startHour &&
              currentHour < period.endHour

            return (
              <div
                className={`weather-dial-card ${isCurrent ? 'current' : ''}`}
                data-current-period={isCurrent ? 'true' : 'false'}
                key={`${period.startHour}-${period.endHour}`}
              >
                <div className="weather-dial-time">
                  <strong>{formatHour(period.startHour)}</strong>
                  <span>–{formatHour(period.endHour)}</span>
                </div>

                <div className="weather-dial-label">
                  {isCurrent ? '지금' : period.label}
                </div>

                <div className="weather-dial-temp">
                  {period.temperatureMin === period.temperatureMax
                    ? `${period.temperatureMin}℃`
                    : `${period.temperatureMin}–${period.temperatureMax}℃`}
                </div>

                <div className="weather-dial-meta">
                  <span>
                    💧 {period.humidityMin === period.humidityMax
                      ? `${period.humidityMin}%`
                      : `${period.humidityMin}–${period.humidityMax}%`}
                  </span>

                  {(period.precipitationSum > 0 ||
                    (period.precipitationProbabilityMax ?? 0) > 0) && (
                    <span>
                      ☔ {period.precipitationSum > 0
                        ? `${period.precipitationSum} mm`
                        : `${period.precipitationProbabilityMax}%`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
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
        구래동 중심부 근처 좌표의 실외 날씨를 바탕으로 한 ‘확인 알림’이에요. 사육장 내부 온습도를 그대로 뜻하지는 않습니다.
      </p>
    </Card>
  )
}
