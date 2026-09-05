import Card from '../components/Card'
import { diffDays, isScheduledDay } from '../lib/date'
import { getMatchedFeedingLog, getScheduledDateForFeedingLog } from '../lib/feeding'
import { feedingAmountText } from '../lib/feedingAmount'
import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  FeedingLog,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type Props = {
  date: string
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  environmentLogs: EnvironmentLog[]
  defecationLogs: DefecationLog[]
  onBack: () => void
  onAddRecord: (date: string) => void
}

export default function DayDetailPage({
  date,
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  environmentLogs,
  defecationLogs,
  onBack,
  onAddRecord,
}: Props) {
  const feeds = feedingLogs.filter((x) => x.date === date)
  const weights = weightLogs.filter((x) => x.date === date)
  const tmis = tmiLogs.filter((x) => x.date === date)
  const presets = presetSelections.filter((x) => x.date === date)
  const environments = environmentLogs.filter((x) => x.date === date)
  const poops = defecationLogs.filter((x) => x.date === date)

  const scheduled = isScheduledDay(date, settings.feedingStartDate, settings.feedingIntervalDays)
  const matchedFeed = scheduled ? getMatchedFeedingLog(date, feedingLogs, settings) : undefined

  const dayTogether = diffDays(settings.adoptionDate, date) + 1
  const hasAny = feeds.length || weights.length || tmis.length || presets.length || environments.length || poops.length

  return (
    <main className="page">
      <header className="section-header detail-header">
        <div>
          <button className="text-button" onClick={onBack}>← 달력으로</button>
          <p className="eyebrow">에리와 함께한 지 {dayTogether}일째</p>
          <h1>{date}</h1>
        </div>
      </header>

      <Card title="급여" icon="🍚">
        {scheduled ? (
          matchedFeed ? (
            <div className="schedule-summary complete">
              <strong>이 날의 급여 회차는 완료됐어요.</strong>
              <span>
                실제 급여: {matchedFeed.date} {matchedFeed.time ?? '시간 미기록'}
                {matchedFeed.date !== date ? ' · 다음 날 새벽 급여 인정' : ''}
              </span>
            </div>
          ) : (
            <div className="schedule-summary due">
              <strong>이 날은 급여 예정일이에요.</strong>
              <span>
                다음 날 {String(settings.feedingGraceUntilHour).padStart(2, '0')}:00까지의 급여를 같은 회차로 인정합니다.
              </span>
            </div>
          )
        ) : (
          <p className="subtle">이 날은 정규 급여 예정일이 아니었어요.</p>
        )}

        {feeds.length === 0 ? (
          <p className="empty">이 날짜 자체의 실제 급여 기록은 없음</p>
        ) : feeds.map((feed) => {
          const occurrence = getScheduledDateForFeedingLog(feed, settings)
          return (
            <div className="detail-item" key={feed.id}>
              <strong>{feed.food}</strong>
              <span>{feed.time ? feed.time : '시간 미기록'}</span>
              <span>섭취량: {feedingAmountText(feed)}</span>
              {occurrence && occurrence !== feed.date && (
                <span className="linked-session">→ {occurrence} 급여 회차로 인정</span>
              )}
              {feed.memo && <p>{feed.memo}</p>}
            </div>
          )
        })}
      </Card>

      <Card title="체중" icon="⚖️">
        {weights.length === 0 ? (
          <p className="empty">체중 기록 없음</p>
        ) : weights.map((item) => (
          <div className="detail-item" key={item.id}>
            <strong>{item.weight.toFixed(1)} g</strong>
            {item.memo && <p>{item.memo}</p>}
          </div>
        ))}
      </Card>

      {environments.length > 0 && (
        <Card title="온도 · 습도" icon="🌡">
          <div className="detail-stack">
            {environments.map((item) => (
              <div className="detail-item compact" key={item.id}>
                <strong>
                  {item.temperature !== undefined ? `${item.temperature}℃` : '온도 미기록'}
                  {' · '}
                  {item.humidity !== undefined ? `${item.humidity}%` : '습도 미기록'}
                </strong>
                {item.time && <span>{item.time}</span>}
                {item.memo && <p>{item.memo}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {poops.length > 0 && (
        <Card title="배변" icon="●">
          {poops.map((item) => (
            <div className="detail-item" key={item.id}>
              <strong>{item.status ?? '미분류'}</strong>
              {item.memo && <p>{item.memo}</p>}
            </div>
          ))}
        </Card>
      )}

      {presets.length > 0 && (
        <Card title="빠른 관찰 기록" icon="✓">
          <div className="chip-wrap">
            {presets.map((item) => (
              <span className="chip static-chip" key={item.id}>{item.label}</span>
            ))}
          </div>
        </Card>
      )}

      {tmis.length > 0 && (
        <Card title="TMI · 메모" icon="💬">
          <div className="detail-stack">
            {tmis.map((item) => (
              <div className="detail-item" key={item.id}>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!hasAny && (
        <Card>
          <p className="empty">이 날은 아직 저장된 관찰 기록이 없어요.</p>
        </Card>
      )}

      <button className="primary-action" onClick={() => onAddRecord(date)}>
        + 이 날짜에 기록 추가
      </button>
    </main>
  )
}
