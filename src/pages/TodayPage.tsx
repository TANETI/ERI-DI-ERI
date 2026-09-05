import Card from '../components/Card'
import { addDays, diffDays, formatKoreanDate, isScheduledDay, parseISODate, toISODate } from '../lib/date'
import type { AppSettings, FeedingLog, WeightLog } from '../types'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  onQuickRecord: () => void
}

function nextScheduledDate(todayIso: string, startIso: string, interval: number): string {
  let cursor = parseISODate(todayIso)
  for (let i = 0; i < 365; i++) {
    const iso = toISODate(cursor)
    if (isScheduledDay(iso, startIso, interval)) return iso
    cursor = addDays(cursor, 1)
  }
  return todayIso
}

const amountLabel = (amount: FeedingLog['amount']) => {
  if (amount === null) return '섭취량 미기록'
  return `섭취 ${amount}/5`
}

export default function TodayPage({ settings, feedingLogs, weightLogs, onQuickRecord }: Props) {
  const today = new Date()
  const todayIso = toISODate(today)
  const dayTogether = diffDays(settings.adoptionDate, todayIso) + 1
  const feedingToday = isScheduledDay(todayIso, settings.feedingStartDate, settings.feedingIntervalDays)
  const nextFeeding = nextScheduledDate(todayIso, settings.feedingStartDate, settings.feedingIntervalDays)
  const todayFeeding = feedingLogs.find((log) => log.date === todayIso)
  const latestWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">{formatKoreanDate(today)}</p>
          <h1>ERI DI-ERY</h1>
          <p className="subtle">에리와 함께한 지 <strong>{dayTogether}일째</strong></p>
        </div>
        <div className="gecko-badge" aria-hidden="true">🦎</div>
      </header>

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
              <div className="status-badge due">오늘 급여일</div>
              <p className="big-number">{settings.feedingTime}</p>
              <p className="subtle">{todayFeeding ? '오늘 급여 기록 완료' : '아직 급여 기록이 없어요'}</p>
            </>
          ) : (
            <>
              <div className="status-badge">다음 급여</div>
              <p className="big-number">{nextFeeding}</p>
              <p className="subtle">{settings.feedingTime} · {settings.feedingIntervalDays}일 간격</p>
            </>
          )}
        </Card>

        <Card title="체중" icon="⚖️">
          <div className="status-badge">최근 기록</div>
          <p className="big-number">{latestWeight ? `${latestWeight.weight.toFixed(1)} g` : '—'}</p>
          <p className="subtle">{latestWeight ? latestWeight.date : '아직 실제 체중 기록이 없어요'}</p>
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
                    <strong>{log.date}</strong>
                    <span>{log.food}</span>
                  </div>
                  <span className="pill">{amountLabel(log.amount)}</span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </main>
  )
}
