import { useMemo, useRef, useState } from 'react'
import Card from '../components/Card'
import WeatherContextCard from '../components/WeatherContextCard'
import {
  addDays,
  diffDays,
  monthGrid,
  parseISODate,
  todayISO,
  toISODate,
} from '../lib/date'
import {
  getMatchedFeedingLog,
  getScheduledDateForFeedingLog,
} from '../lib/feeding'
import { feedingAmountText } from '../lib/feedingAmount'
import {
  getFeedingScheduleForDate,
  isFeedingScheduledDay,
} from '../lib/schedule'
import {
  getMatchedWeightLog,
  isWeightScheduledDay,
} from '../lib/weight'
import type {
  AppSettings,
  DefecationLog,
  FeedingLog,
  PhotoMeta,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type ViewMode = 'daily' | 'monthly'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]
  photos: PhotoMeta[]
  onAddRecord: (date: string) => void
}

function formatLongDate(iso: string) {
  const date = parseISODate(iso)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

function formatMonth(iso: string) {
  const date = parseISODate(iso)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

function formatShortDay(iso: string) {
  const date = parseISODate(iso)
  return {
    weekday: new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date),
    day: date.getDate(),
  }
}

function formatActualFeeding(log: FeedingLog) {
  const [, month, day] = log.date.split('-')
  const prefix = `${Number(month)}/${Number(day)}`
  if (!log.time) return `${prefix} · 시간 미기록`

  const [hour, minute] = log.time.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 || 12
  const minuteText = minute === 0 ? '' : ` ${String(minute).padStart(2, '0')}분`
  return `${prefix} ${period} ${displayHour}시${minuteText}`
}

export default function CalendarPage({
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  photos,
  onAddRecord,
}: Props) {
  const todayIso = todayISO()
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [monthDate, setMonthDate] = useState(() => {
    const today = parseISODate(todayIso)
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const touchStartX = useRef<number | null>(null)

  const selectDate = (iso: string) => {
    setSelectedDate(iso)
    const date = parseISODate(iso)
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  const moveDay = (delta: number) => {
    const next = addDays(parseISODate(selectedDate), delta)
    selectDate(toISODate(next))
  }

  const weekStrip = useMemo(() => {
    const center = parseISODate(selectedDate)
    return Array.from({ length: 7 }, (_, index) => {
      return toISODate(addDays(center, index - 3))
    })
  }, [selectedDate])

  const monthCells = useMemo(
    () => monthGrid(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  )

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < 55) return
    if (delta < 0) moveDay(1)
    else moveDay(-1)
  }

  return (
    <main className="page calendar-page">
      <header className="section-header calendar-page-header">
        <div>
          <p className="eyebrow">관찰 기록</p>
          <h1>달력</h1>
        </div>

        <div className="view-toggle" role="group" aria-label="달력 보기 방식">
          <button
            type="button"
            className={viewMode === 'daily' ? 'active' : ''}
            onClick={() => setViewMode('daily')}
          >
            일간
          </button>
          <button
            type="button"
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => setViewMode('monthly')}
          >
            월간
          </button>
        </div>
      </header>

      {viewMode === 'daily' ? (
        <DailyView
          date={selectedDate}
          todayIso={todayIso}
          settings={settings}
          feedingLogs={feedingLogs}
          weightLogs={weightLogs}
          tmiLogs={tmiLogs}
          presetSelections={presetSelections}
          defecationLogs={defecationLogs}
          photos={photos}
          weekStrip={weekStrip}
          onSelectDate={selectDate}
          onMoveDay={moveDay}
          onAddRecord={onAddRecord}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />
      ) : (
        <MonthlyView
          monthDate={monthDate}
          todayIso={todayIso}
          settings={settings}
          feedingLogs={feedingLogs}
          weightLogs={weightLogs}
          tmiLogs={tmiLogs}
          defecationLogs={defecationLogs}
          photos={photos}
          cells={monthCells}
          onMoveMonth={(delta) => {
            setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
          }}
          onSelectDate={(iso) => {
            selectDate(iso)
            setViewMode('daily')
          }}
        />
      )}
    </main>
  )
}

function DailyView({
  date,
  todayIso,
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  photos,
  weekStrip,
  onSelectDate,
  onMoveDay,
  onAddRecord,
  onTouchStart,
  onTouchEnd,
}: {
  date: string
  todayIso: string
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]
  photos: PhotoMeta[]
  weekStrip: string[]
  onSelectDate: (iso: string) => void
  onMoveDay: (delta: number) => void
  onAddRecord: (date: string) => void
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}) {
  const feedsOnDate = feedingLogs.filter((x) => x.date === date)
  const weights = weightLogs.filter((x) => x.date === date)
  const tmis = tmiLogs.filter((x) => x.date === date)
  const presets = presetSelections.filter((x) => x.date === date)
  const poops = defecationLogs.filter((x) => x.date === date)
  const photosOnDate = photos.filter((x) => x.date === date)

  const scheduled = isFeedingScheduledDay(date, settings)
  const feedingSchedule = getFeedingScheduleForDate(date, settings)
  const matchedFeed = scheduled ? getMatchedFeedingLog(date, feedingLogs, settings) : undefined
  const extraFeeds = feedsOnDate.filter(
    (feed) => getScheduledDateForFeedingLog(feed, settings) === null,
  )

  const dayTogether = diffDays(settings.adoptionDate, date) + 1
  const isToday = date === todayIso
  const weightScheduled = isWeightScheduledDay(date, settings)
  const matchedWeight = weightScheduled
    ? getMatchedWeightLog(date, weightLogs, settings)
    : undefined
  const weightDone = weights.length > 0


  return (
    <>
      <div className="week-strip" aria-label="근처 날짜">
        {weekStrip.map((iso) => {
          const item = formatShortDay(iso)
          const active = iso === date
          const today = iso === todayIso
          return (
            <button
              type="button"
              key={iso}
              className={`week-day ${active ? 'active' : ''} ${today ? 'today' : ''}`}
              onClick={() => onSelectDate(iso)}
            >
              <span>{item.weekday}</span>
              <strong>{item.day}</strong>
              {today && <small>오늘</small>}
            </button>
          )
        })}
      </div>

      <section
        className="daily-swipe-area"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') onMoveDay(-1)
          if (event.key === 'ArrowRight') onMoveDay(1)
        }}
        tabIndex={0}
        aria-label={`${formatLongDate(date)} 일간 기록. 좌우 스와이프 또는 방향키로 날짜 이동`}
      >
        <div className="daily-date-nav">
          <button type="button" onClick={() => onMoveDay(-1)} aria-label="이전 날짜">‹</button>

          <div className="daily-date-title">
            <span>{formatMonth(date)}</span>
            <strong>{formatLongDate(date)}</strong>
            <small>
              {isToday ? '오늘 · ' : ''}
              에리와 함께한 지 {dayTogether}일째
            </small>
          </div>

          <button type="button" onClick={() => onMoveDay(1)} aria-label="다음 날짜">›</button>
        </div>

        <Card className="daily-summary-card">
          <div className="daily-section">
            <div className="daily-section-head">
              <span className="daily-section-icon">🍚</span>
              <strong>급여</strong>
            </div>

            {scheduled ? (
              matchedFeed ? (
                <div className="daily-primary-row complete">
                  <span>☑</span>
                  <div>
                    <strong>급여 완료</strong>
                    <small>{formatActualFeeding(matchedFeed)}</small>
                    <small>
                      {matchedFeed.food} · {feedingAmountText(matchedFeed)}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="daily-primary-row due">
                  <span>☐</span>
                  <div>
                    <strong>급여 예정</strong>
                    <small>기본 시간 {feedingSchedule?.time ?? settings.feedingTime}</small>
                    <small>
                      다음 날 {String(feedingSchedule?.graceUntilHour ?? settings.feedingGraceUntilHour).padStart(2, '0')}:00까지 같은 회차로 인정
                    </small>
                  </div>
                </div>
              )
            ) : (
              <div className="daily-empty-line">정규 급여 예정 없음</div>
            )}

            {extraFeeds.map((feed) => (
              <div className="daily-sub-row" key={feed.id}>
                <span>＋</span>
                <div>
                  <strong>추가 급여</strong>
                  <small>{formatActualFeeding(feed)} · {feed.food}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="daily-divider" />

          <div className="daily-grid">
            <DailyStat
              icon="⚖"
              title={weightScheduled ? '체중 · 측정일' : '체중'}
              value={
                matchedWeight
                  ? `${matchedWeight.weight.toFixed(1)} g${
                      matchedWeight.date !== date
                        ? ` · ${matchedWeight.date} 측정`
                        : ''
                    }`
                  : weightDone
                    ? `${weights[weights.length - 1].weight.toFixed(1)} g`
                    : weightScheduled
                      ? '측정 예정'
                      : '기록 없음'
              }
            />
            <DailyStat
              icon="💩"
              title="배변"
              value={poops.length ? `${poops.length}회` : '기록 없음'}
            />
          </div>

          {photosOnDate.length > 0 && (
            <>
              <div className="daily-divider" />
              <div className="daily-photo-row">
                <span aria-hidden="true">📷</span>
                <strong>사진 {photosOnDate.length}장</strong>
                {photosOnDate.some((photo) => photo.isCover) && (
                  <small>대표 사진 지정됨</small>
                )}
              </div>
            </>
          )}

          {presets.length > 0 && (
            <>
              <div className="daily-divider" />
              <div className="daily-section">
                <div className="daily-section-head">
                  <span className="daily-section-icon">✓</span>
                  <strong>관찰</strong>
                </div>
                <div className="daily-tags">
                  {presets.map((item) => (
                    <span key={item.id}>{item.label}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tmis.length > 0 && (
            <>
              <div className="daily-divider" />
              <div className="daily-section">
                <div className="daily-section-head">
                  <span className="daily-section-icon">💬</span>
                  <strong>TMI</strong>
                </div>
                <div className="daily-tmi-list">
                  {tmis.map((item) => (
                    <p key={item.id}>{item.text}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>

        <WeatherContextCard date={date} settings={settings} compact />

        <button className="primary-action" onClick={() => onAddRecord(date)}>
          ✎ 이 날짜 기록 관리
        </button>

        <p className="swipe-hint">← 좌우로 스와이프해서 날짜 이동 →</p>
      </section>
    </>
  )
}

function DailyStat({
  icon,
  title,
  value,
}: {
  icon: string
  title: string
  value: string
}) {
  return (
    <div className="daily-stat">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function formatRange(values: number[], suffix: string) {
  if (!values.length) return '기록 없음'
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`
}

function MonthlyView({
  monthDate,
  todayIso,
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  defecationLogs,
  photos,
  cells,
  onMoveMonth,
  onSelectDate,
}: {
  monthDate: Date
  todayIso: string
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  defecationLogs: DefecationLog[]
  photos: PhotoMeta[]
  cells: Array<Date | null>
  onMoveMonth: (delta: number) => void
  onSelectDate: (iso: string) => void
}) {
  return (
    <Card className="calendar-card monthly-compact-card">
      <div className="calendar-head">
        <button className="ghost-button" onClick={() => onMoveMonth(-1)} aria-label="이전 달">‹</button>
        <strong>{monthDate.getFullYear()}년 {monthDate.getMonth() + 1}월</strong>
        <button className="ghost-button" onClick={() => onMoveMonth(1)} aria-label="다음 달">›</button>
      </div>

      <div className="weekday-row">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="calendar-grid monthly-compact-grid">
        {cells.map((date, index) => {
          if (!date) return <div className="calendar-cell empty-cell" key={`empty-${index}`} />

          const iso = toISODate(date)
          const scheduled = isFeedingScheduledDay(iso, settings)
          const matchedFeed = scheduled ? getMatchedFeedingLog(iso, feedingLogs, settings) : undefined
          const weightScheduled = isWeightScheduledDay(iso, settings)
          const matchedWeight = weightScheduled
            ? getMatchedWeightLog(iso, weightLogs, settings)
            : undefined
          const hasWeight = weightLogs.some((x) => x.date === iso)
          const hasPoop = defecationLogs.some((x) => x.date === iso)
          const hasTmi = tmiLogs.some((x) => x.date === iso)
          const photoCount = photos.filter((x) => x.date === iso).length
          const isToday = iso === todayIso

          return (
            <button
              type="button"
              className={`calendar-cell calendar-button monthly-cell ${isToday ? 'today-cell' : ''}`}
              key={iso}
              onClick={() => onSelectDate(iso)}
            >
              <span className="calendar-day-head">
                <span className="day-number">{date.getDate()}</span>
                {isToday && <span className="today-dot" aria-label="오늘" />}
              </span>

              <span className="monthly-icons">
                {scheduled && <span title={matchedFeed ? '급여 완료' : '급여 예정'}>{matchedFeed ? '☑🍚' : '☐🍚'}</span>}
                {(weightScheduled || hasWeight) && (
                  <span
                    title={
                      matchedWeight
                        ? '체중 측정 회차 완료'
                        : hasWeight
                          ? '추가 체중 측정'
                          : '체중 측정 예정'
                    }
                  >
                    {matchedWeight ? '☑⚖' : hasWeight ? '⚖' : '☐⚖'}
                  </span>
                )}
                {hasPoop && <span title="배변">💩</span>}
                {hasTmi && <span title="TMI">💬</span>}
                {photoCount > 0 && (
                  <span title={`사진 ${photoCount}장`}>
                    📷{photoCount > 1 ? photoCount : ''}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="calendar-footnote">
        <span>☑🍚 급여 완료</span>
        <span>☐🍚 급여 예정</span>
        <span>☑⚖ 체중 완료</span>
        <span>☐⚖ 체중 예정</span>
        <span>날짜를 누르면 일간 보기로 이동</span>
      </div>
    </Card>
  )
}
