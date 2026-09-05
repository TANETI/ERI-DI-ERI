import { useMemo, useState } from 'react'
import Card from '../components/Card'
import StatsPage from './StatsPage'
import { buildReport } from '../lib/report'
import { searchWeatherLocations } from '../lib/weather'
import { toISODate } from '../lib/date'
import type {
  AppSettings,
  DefecationLog,
  FeedingLog,
  FontPreset,
  PresetSelection,
  TmiLog,
  WeightLog,
  WeatherLocation,
} from '../types'

type Mode = 'stats' | 'report' | 'settings'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]
  onSave: (settings: AppSettings) => void
}

const fontOptions: Array<{ value: FontPreset; label: string; note: string }> = [
  { value: 'system', label: '기본 · 시스템', note: '가장 무난하고 안정적' },
  { value: 'malgun', label: '맑은 고딕', note: 'Windows 기본 한글 글꼴' },
  { value: 'pretendard', label: 'Pretendard 우선', note: '설치되어 있으면 Pretendard 사용' },
  { value: 'serif', label: '명조 · 바탕', note: '관찰일지 느낌의 세리프 계열' },
  { value: 'rounded', label: '둥근 고딕', note: '설치된 둥근 계열 글꼴 우선' },
]

export default function MorePage({
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  onSave,
}: Props) {
  const today = toISODate(new Date())
  const [mode, setMode] = useState<Mode>('stats')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [reportStart, setReportStart] = useState(settings.adoptionDate)
  const [reportEnd, setReportEnd] = useState(today)
  const [message, setMessage] = useState('')
  const [locationQuery, setLocationQuery] = useState(settings.weatherLocationLabel ?? '')
  const [locationResults, setLocationResults] = useState<WeatherLocation[]>([])
  const [locationSearching, setLocationSearching] = useState(false)

  const report = useMemo(() => {
    try {
      return buildReport(reportStart, reportEnd, {
        settings,
        feedingLogs,
        weightLogs,
        tmiLogs,
        presetSelections,
              defecationLogs,
      })
    } catch {
      return null
    }
  }, [
    reportStart,
    reportEnd,
    settings,
    feedingLogs,
    weightLogs,
    tmiLogs,
    presetSelections,
      defecationLogs,
  ])

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 1800)
  }

  const save = () => {
    onSave(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      flash(`${label}을 클립보드에 복사했어요.`)
    } catch {
      flash('복사에 실패했어요. 브라우저 권한을 확인해 주세요.')
    }
  }

  const downloadJson = () => {
    if (!report) return

    const blob = new Blob([JSON.stringify(report.json, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `eri-report_${reportStart}_${reportEnd}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    flash('JSON 보고서를 저장했어요.')
  }

  const searchLocation = async () => {
    if (!locationQuery.trim()) {
      flash('지역 이름을 입력해 주세요.')
      return
    }

    setLocationSearching(true)
    try {
      const results = await searchWeatherLocations(locationQuery)
      setLocationResults(results)
      if (!results.length) flash('검색 결과가 없어요.')
    } catch {
      flash('지역 검색에 실패했어요.')
    } finally {
      setLocationSearching(false)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      flash('이 브라우저는 알림을 지원하지 않아요.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') flash('브라우저 알림을 허용했어요.')
    else flash('알림 권한이 허용되지 않았어요.')
  }

  const setRecentDays = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    const startIso = toISODate(start)
    setReportStart(startIso < settings.adoptionDate ? settings.adoptionDate : startIso)
    setReportEnd(toISODate(end))
  }

  return (
    <main className="page">
      <header className="section-header more-header">
        <div>
          <p className="eyebrow">도구와 설정</p>
          <h1>더보기</h1>
        </div>

        <div className="view-toggle more-mode-toggle" role="group" aria-label="더보기 메뉴">
          <button
            type="button"
            className={mode === 'stats' ? 'active' : ''}
            onClick={() => setMode('stats')}
          >
            통계
          </button>
          <button
            type="button"
            className={mode === 'report' ? 'active' : ''}
            onClick={() => setMode('report')}
          >
            보고서
          </button>
          <button
            type="button"
            className={mode === 'settings' ? 'active' : ''}
            onClick={() => setMode('settings')}
          >
            설정
          </button>
        </div>
      </header>

      {mode === 'stats' ? (
        <StatsPage
          feedingLogs={feedingLogs}
          weightLogs={weightLogs}
        />
      ) : mode === 'report' ? (
        <>
          <Card title="관찰 보고서" icon="📄">
            <p className="setting-help report-intro">
              기간을 골라 급여·체중·배변·관찰·TMI를 한 번에 정리합니다.
              ChatGPT 평가용 출력에는 분석 지침과 평가서 양식까지 자동으로 붙습니다.
            </p>

            <div className="report-presets">
              <button onClick={() => setRecentDays(7)}>최근 7일</button>
              <button onClick={() => setRecentDays(14)}>최근 14일</button>
              <button onClick={() => setRecentDays(30)}>최근 30일</button>
              <button
                onClick={() => {
                  setReportStart(settings.adoptionDate)
                  setReportEnd(today)
                }}
              >
                처음부터
              </button>
            </div>

            <div className="settings-grid report-range">
              <label className="field">
                <span>시작일</span>
                <input
                  type="date"
                  value={reportStart}
                  min={settings.adoptionDate}
                  onChange={(e) => setReportStart(e.target.value)}
                />
              </label>
              <label className="field">
                <span>종료일</span>
                <input
                  type="date"
                  value={reportEnd}
                  onChange={(e) => setReportEnd(e.target.value)}
                />
              </label>
            </div>

            {!report ? (
              <div className="report-error">날짜 범위를 확인해 주세요.</div>
            ) : (
              <>
                <div className="report-actions">
                  <button
                    className="secondary-action"
                    onClick={() => copyText(report.markdown, 'Markdown 보고서')}
                  >
                    Markdown 복사
                  </button>
                  <button
                    className="primary-action report-primary"
                    onClick={() => copyText(report.chatgptPackage, 'ChatGPT 평가용 보고서')}
                  >
                    ChatGPT 평가용 전체 복사
                  </button>
                  <button className="secondary-action" onClick={downloadJson}>
                    JSON 저장
                  </button>
                </div>

                <div className="report-preview">
                  <div className="report-preview-head">
                    <strong>미리보기</strong>
                    <span>{reportStart} ~ {reportEnd}</span>
                  </div>
                  <pre>{report.markdown}</pre>
                </div>
              </>
            )}
          </Card>

          <Card title="현재 구현 상태">
            <p className="setting-help">
              급여·체중 일정은 적용 시작일별로 이력을 보존합니다.
              보고서와 과거 달력도 해당 날짜에 실제로 적용되던 스케줄로 계산합니다.
            </p>
          </Card>
        </>
      ) : (
        <>
          <Card title="화면" icon="Aa">
            <label className="field">
              <span>글꼴</span>
              <select
                value={draft.fontPreset}
                onChange={(e) => setDraft({ ...draft, fontPreset: e.target.value as FontPreset })}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </label>

            <p className="setting-help">
              {fontOptions.find((font) => font.value === draft.fontPreset)?.note}
            </p>

            <div className="font-preview">
              <strong>에리 관찰일지</strong>
              <span>오늘은 에리가 천장에 오래 붙어 있었다. 참 귀여웠다.</span>
            </div>
          </Card>

          <Card title="급여 일정" icon="🍚">
            <div className="settings-grid">
              <label className="field">
                <span>적용 시작일</span>
                <input
                  type="date"
                  value={draft.feedingStartDate}
                  onChange={(e) => setDraft({ ...draft, feedingStartDate: e.target.value })}
                />
              </label>

              <label className="field">
                <span>급여 간격</span>
                <div className="input-suffix">
                  <input
                    type="number"
                    min="1"
                    value={draft.feedingIntervalDays}
                    onChange={(e) => setDraft({
                      ...draft,
                      feedingIntervalDays: Math.max(1, Number(e.target.value)),
                    })}
                  />
                  <span>일마다</span>
                </div>
              </label>

              <label className="field">
                <span>기본 급여 시간</span>
                <input
                  type="time"
                  value={draft.feedingTime}
                  onChange={(e) => setDraft({ ...draft, feedingTime: e.target.value })}
                />
              </label>

              <label className="field">
                <span>새벽 급여 인정 마감</span>
                <div className="input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={draft.feedingGraceUntilHour}
                    onChange={(e) => setDraft({
                      ...draft,
                      feedingGraceUntilHour: Math.min(12, Math.max(0, Number(e.target.value))),
                    })}
                  />
                  <span>시까지</span>
                </div>
              </label>
            </div>

            <p className="setting-help">
              예: 8/31 급여 회차를 9/1 새벽 2시에 급여해도, 마감이 06시라면 8/31 회차 완료로 기록됩니다.
              새 설정을 저장하면 위 ‘적용 시작일’부터 새 기간이 생기고 이전 일정은 보존됩니다.
            </p>

            <div className="schedule-history">
              <strong>급여 일정 이력</strong>
              {[...settings.feedingScheduleHistory]
                .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
                .map((period) => (
                  <div className="schedule-history-row" key={period.id}>
                    <span>{period.effectiveFrom}부터</span>
                    <small>
                      {period.intervalDays}일마다 · {period.time} · 새벽 {String(period.graceUntilHour).padStart(2, '0')}시까지
                    </small>
                  </div>
                ))}
            </div>
          </Card>


          <Card title="지역 날씨" icon="☁️">
            <p className="setting-help weather-setting-intro">
              직접 온습도를 매번 입력하는 대신, 우리 집 지역의 기온·습도·비 예보를 가져와 관리 체크 알림에 사용합니다.
            </p>

            <div className="weather-location-search">
              <label className="field">
                <span>우리 집 지역</span>
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="예: 인천, 부평, 서울"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      searchLocation()
                    }
                  }}
                />
              </label>

              <button
                type="button"
                className="secondary-action"
                onClick={searchLocation}
                disabled={locationSearching}
              >
                {locationSearching ? '검색 중…' : '지역 검색'}
              </button>
            </div>

            {locationResults.length > 0 && (
              <div className="weather-location-results">
                {locationResults.map((location) => (
                  <button
                    type="button"
                    key={`${location.latitude}-${location.longitude}-${location.label}`}
                    onClick={() => {
                      setDraft({
                        ...draft,
                        weatherLocationLabel: location.label,
                        weatherLatitude: location.latitude,
                        weatherLongitude: location.longitude,
                      })
                      setLocationQuery(location.label)
                      setLocationResults([])
                    }}
                  >
                    <strong>{location.label}</strong>
                    <small>{location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</small>
                  </button>
                ))}
              </div>
            )}

            {typeof draft.weatherLatitude === 'number' &&
              typeof draft.weatherLongitude === 'number' && (
                <div className="selected-weather-location">
                  <span>현재 선택</span>
                  <strong>{draft.weatherLocationLabel ?? '설정한 지역'}</strong>
                </div>
              )}

            <label className="toggle-row">
              <span>
                <strong>날씨 기반 관리 알림</strong>
                <small>더운 날 냉방 확인, 매우 습한 날 분무량 확인 같은 안내</small>
              </span>
              <input
                type="checkbox"
                checked={draft.weatherAlertsEnabled}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weatherAlertsEnabled: e.target.checked,
                  })
                }
              />
            </label>

            <div className="weather-notification-row">
              <button
                type="button"
                className="secondary-action"
                onClick={requestNotificationPermission}
              >
                브라우저 알림 허용
              </button>
              <span>
                현재 로컬 단계에서는 앱을 열었을 때 알림을 띄웁니다.
                완전한 아침 자동 알림은 Cloudflare Worker + Web Push 단계에서 연결합니다.
              </span>
            </div>

            <p className="setting-help">
              실외 날씨는 사육장 내부와 같지 않으므로 ‘자동 처방’이 아니라 관리 여부를 확인하라는 신호로만 사용합니다.
            </p>
          </Card>

          <Card title="체중 측정 일정" icon="⚖️">
            <div className="settings-grid">
              <label className="field">
                <span>첫 측정일</span>
                <input
                  type="date"
                  value={draft.weightStartDate ?? ''}
                  onChange={(e) => setDraft({
                    ...draft,
                    weightStartDate: e.target.value || undefined,
                  })}
                />
              </label>

              <label className="field">
                <span>측정 간격</span>
                <div className="input-suffix">
                  <input
                    type="number"
                    min="1"
                    value={draft.weightIntervalDays}
                    onChange={(e) => setDraft({
                      ...draft,
                      weightIntervalDays: Math.max(1, Number(e.target.value)),
                    })}
                  />
                  <span>일마다</span>
                </div>
              </label>
            </div>

            <div className="schedule-shortcuts">
              <button
                type="button"
                className={draft.weightIntervalDays === 7 ? 'active' : ''}
                onClick={() => setDraft({ ...draft, weightIntervalDays: 7 })}
              >
                매주
              </button>
              <button
                type="button"
                className={draft.weightIntervalDays === 14 ? 'active' : ''}
                onClick={() => setDraft({ ...draft, weightIntervalDays: 14 })}
              >
                격주
              </button>
            </div>

            <p className="setting-help">
              첫 측정일을 비워두면 첫 체중 기록을 저장하는 순간 그 날짜가 자동으로 첫 측정일이 됩니다.
              측정 간격만 바꾸면 저장한 날짜부터 새 주기가 적용되고, 과거 예정일은 다시 계산하지 않습니다.
              첫 측정일 필드는 잘못된 시작점을 바로잡을 때만 수정하면 됩니다.
            </p>

            {settings.weightScheduleHistory.length > 0 && (
              <div className="schedule-history">
                <strong>체중 일정 이력</strong>
                {[...settings.weightScheduleHistory]
                  .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
                  .map((period) => (
                    <div className="schedule-history-row" key={period.id}>
                      <span>{period.effectiveFrom}부터</span>
                      <small>{period.intervalDays}일마다</small>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <div className="settings-save-bar">
            <button className="primary-action settings-save" onClick={save}>설정 저장</button>
            {saved && <span className="save-ok">저장했어요.</span>}
          </div>
        </>
      )}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  )
}
