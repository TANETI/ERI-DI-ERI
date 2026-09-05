import { useRef, useState } from 'react'
import Card from '../components/Card'
import WeatherContextCard from '../components/WeatherContextCard'
import {
  diffDays,
  formatKoreanDate,
  toISODate,
} from '../lib/date'
import { getMatchedFeedingLog } from '../lib/feeding'
import {
  getFeedingScheduleForDate,
  getNextFeedingScheduledDate,
  isFeedingScheduledDay,
} from '../lib/schedule'
import {
  getMatchedWeightLog,
  getNextWeightScheduledDate,
  getOldestOutstandingWeightDueDate,
  isWeightScheduledDay,
  latestWeightLog,
} from '../lib/weight'
import { feedingAmountText } from '../lib/feedingAmount'
import type { AppSettings, FeedingLog, WeightLog } from '../types'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  onQuickRecord: () => void
}

export default function TodayPage({
  settings,
  feedingLogs,
  weightLogs,
  onQuickRecord,
}: Props) {
  const geckoRef = useRef<HTMLButtonElement>(null)
  const [geckoPosition, setGeckoPosition] = useState<{ x: number; y: number } | null>(null)
  const [geckoAngle, setGeckoAngle] = useState(0)
  const [geckoDurationMs, setGeckoDurationMs] = useState(312)
  const [geckoMoving, setGeckoMoving] = useState(false)
  const [geckoPopped, setGeckoPopped] = useState(false)

  const pickGeckoTarget = (currentX: number, currentY: number) => {
    const size = 62
    const padding = 18
    const bottomSafeArea = 108
    const maxX = Math.max(padding, window.innerWidth - size - padding)
    const maxY = Math.max(padding, window.innerHeight - size - bottomSafeArea)

    const availableWidth = Math.max(1, maxX - padding)
    const availableHeight = Math.max(1, maxY - padding)
    const minDistance = Math.min(
      220,
      Math.max(110, Math.hypot(availableWidth, availableHeight) * 0.28),
    )

    let target = { x: padding, y: padding }

    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = {
        x: Math.round(padding + Math.random() * availableWidth),
        y: Math.round(padding + Math.random() * availableHeight),
      }

      target = candidate

      if (Math.hypot(candidate.x - currentX, candidate.y - currentY) >= minDistance) {
        break
      }
    }

    return target
  }

  const runGecko = () => {
    const element = geckoRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const current = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
    }
    const target = pickGeckoTarget(current.x, current.y)
    const distance = Math.hypot(
      target.x - current.x,
      target.y - current.y,
    )

    // 가까우면 빠르게, 멀수록 눈으로 쫓을 수 있을 만큼 조금 더 오래.
    // 약 1450px/s 정도의 체감 속도 + 312~820ms 범위.
    const durationMs = Math.round(
      Math.min(820, Math.max(312, distance / 1.45)),
    )
    setGeckoDurationMs(durationMs)

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // 🦎 이모지는 기본적으로 고개가 위쪽을 향하므로,
    // 이동 벡터의 atan2 각도에 +90°를 더해 고개가 목적지를 향하게 한다.
    const travelAngle =
      (Math.atan2(target.y - current.y, target.x - current.x) * 180) / Math.PI + 90
    setGeckoAngle(travelAngle)
    setGeckoPopped(false)

    const arrive = () => {
      setGeckoMoving(false)
      setGeckoPopped(true)
      window.setTimeout(() => setGeckoPopped(false), 420)
    }

    if (prefersReducedMotion) {
      setGeckoPosition(target)
      arrive()
      return
    }

    setGeckoMoving(true)

    // 첫 클릭에서는 원래 헤더 위치를 fixed 좌표로 먼저 고정한 뒤
    // 다음 프레임에 목적지를 넣어야 순간이동하지 않고 이동 과정이 보인다.
    if (!geckoPosition) {
      setGeckoPosition(current)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGeckoPosition(target)
        })
      })
    } else {
      setGeckoPosition(target)
    }
  }

  const today = new Date()
  const todayIso = toISODate(today)
  const dayTogether = diffDays(settings.adoptionDate, todayIso) + 1

  const feedingToday = isFeedingScheduledDay(todayIso, settings)
  const todayFeedingSchedule = getFeedingScheduleForDate(todayIso, settings)
  const nextFeeding = getNextFeedingScheduledDate(todayIso, settings)
  const nextFeedingSchedule = nextFeeding
    ? getFeedingScheduleForDate(nextFeeding, settings)
    : null
  const matchedTodayFeeding = feedingToday
    ? getMatchedFeedingLog(todayIso, feedingLogs, settings)
    : undefined

  const latestWeight = latestWeightLog(weightLogs)
  const weightScheduleStarted = Boolean(settings.weightStartDate)
  const weightToday = isWeightScheduledDay(todayIso, settings)
  const matchedTodayWeight = weightToday
    ? getMatchedWeightLog(todayIso, weightLogs, settings)
    : undefined
  const overdueWeightDate = getOldestOutstandingWeightDueDate(
    todayIso,
    weightLogs,
    settings,
  )
  const nextWeight = getNextWeightScheduledDate(todayIso, settings)

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">{formatKoreanDate(today)}</p>
          <h1>ERI DI-ERY</h1>
          <p className="subtle">에리와 함께한 지 <strong>{dayTogether}일째</strong></p>
        </div>
        <button
          ref={geckoRef}
          type="button"
          className={`gecko-badge gecko-easter-egg ${geckoPosition ? 'escaped' : ''} ${geckoMoving ? 'moving' : ''} ${geckoPopped ? 'popped' : ''}`}
          onClick={runGecko}
          onTransitionEnd={(event) => {
            if (
              !['left', 'top'].includes(event.propertyName) ||
              !geckoMoving
            ) {
              return
            }

            setGeckoMoving(false)
            setGeckoPopped(true)
            window.setTimeout(() => setGeckoPopped(false), 420)
          }}
          aria-label="도망가는 에리 잡기"
          title="에리?"
          style={
            {
              ...(geckoPosition
                ? {
                    left: `${geckoPosition.x}px`,
                    top: `${geckoPosition.y}px`,
                  }
                : {}),
              '--gecko-duration': `${geckoDurationMs}ms`,
            } as any
          }
        >
          <span
            className="gecko-heading"
            style={{ transform: `rotate(${geckoAngle}deg)` }}
            aria-hidden="true"
          >
            <span className={`gecko-sprite ${geckoMoving ? 'running' : ''}`}>
              🦎
            </span>
          </span>
          {geckoPopped && <span className="gecko-pop" aria-hidden="true">쀽!</span>}
        </button>
      </header>

      <WeatherContextCard
        date={todayIso}
        settings={settings}
        title="오늘 날씨"
        compact
      />

      <Card className="photo-card">
        <div className="photo-placeholder">
          <span>오늘의 에리</span>
          <small>사진 기능은 R2 연동 단계에서 활성화</small>
        </div>
      </Card>

      <div className="grid-two">
        <Card title="급여" icon="🍚">
          {feedingToday ? (
            <>
              <div className={matchedTodayFeeding ? 'status-badge' : 'status-badge due'}>
                {matchedTodayFeeding ? '오늘 회차 완료' : '오늘 급여일'}
              </div>
              <p className="big-number">
                {matchedTodayFeeding
                  ? `${matchedTodayFeeding.date} ${matchedTodayFeeding.time ?? ''}`.trim()
                  : todayFeedingSchedule?.time ?? settings.feedingTime}
              </p>
              <p className="subtle">
                {matchedTodayFeeding
                  ? `${matchedTodayFeeding.food} · ${feedingAmountText(matchedTodayFeeding)}`
                  : `다음 날 ${String(todayFeedingSchedule?.graceUntilHour ?? settings.feedingGraceUntilHour).padStart(2, '0')}:00까지 같은 회차로 인정`}
              </p>
            </>
          ) : (
            <>
              <div className="status-badge">다음 급여</div>
              <p className="big-number">{nextFeeding ?? '—'}</p>
              <p className="subtle">
                {nextFeedingSchedule?.time ?? settings.feedingTime}
                {' · '}
                {nextFeedingSchedule?.intervalDays ?? settings.feedingIntervalDays}일 간격
              </p>
            </>
          )}
        </Card>

        <Card title="체중" icon="⚖️">
          {!weightScheduleStarted ? (
            <>
              <div className="status-badge">첫 측정 대기</div>
              <p className="big-number">{latestWeight ? `${latestWeight.weight.toFixed(1)} g` : '—'}</p>
              <p className="subtle">
                첫 체중을 기록하면 그 날짜부터 {settings.weightIntervalDays}일 간격 측정 일정이 시작돼요.
              </p>
            </>
          ) : overdueWeightDate && overdueWeightDate < todayIso ? (
            <>
              <div className="status-badge due">체중 측정 지연</div>
              <p className="big-number">{overdueWeightDate}</p>
              <p className="subtle">
                예정일은 그대로 유지돼요. 지금 측정해도 이 회차의 늦은 측정으로 기록됩니다.
              </p>
            </>
          ) : weightToday ? (
            <>
              <div className={matchedTodayWeight ? 'status-badge' : 'status-badge due'}>
                {matchedTodayWeight ? '오늘 회차 완료' : '오늘 측정일'}
              </div>
              <p className="big-number">
                {matchedTodayWeight
                  ? `${matchedTodayWeight.weight.toFixed(1)} g`
                  : latestWeight
                    ? `${latestWeight.weight.toFixed(1)} g`
                    : '—'}
              </p>
              <p className="subtle">
                {matchedTodayWeight
                  ? matchedTodayWeight.date === todayIso
                    ? '오늘 체중 기록 완료'
                    : `${matchedTodayWeight.date}에 늦게 측정해 이 회차를 완료했어요.`
                  : `최근 체중 ${latestWeight ? `${latestWeight.weight.toFixed(1)} g` : '없음'}`}
              </p>
            </>
          ) : (
            <>
              <div className="status-badge">다음 체중 측정</div>
              <p className="big-number">{nextWeight ?? '—'}</p>
              <p className="subtle">
                최근 {latestWeight ? `${latestWeight.weight.toFixed(1)} g · ${latestWeight.date}` : '체중 기록 없음'}
              </p>
            </>
          )}
        </Card>
      </div>

      <button className="primary-action" onClick={onQuickRecord}>
        + 오늘 기록하기
      </button>

      <Card title="최근 급여 기록">
        {feedingLogs.length === 0 ? (
          <p className="empty">아직 급여 기록이 없어요.</p>
        ) : (
          <div className="simple-list">
            {[...feedingLogs]
              .sort((a, b) => `${b.date}${b.time ?? ''}`.localeCompare(`${a.date}${a.time ?? ''}`))
              .slice(0, 4)
              .map((log) => (
                <div className="list-row" key={log.id}>
                  <div>
                    <strong>{log.date}{log.time ? ` · ${log.time}` : ''}</strong>
                    <span>{log.food}</span>
                  </div>
                  <span className="pill">{feedingAmountText(log)}</span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </main>
  )
}
