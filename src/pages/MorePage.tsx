import { useMemo, useState } from 'react'
import Card from '../components/Card'
import { buildReport } from '../lib/report'
import { toISODate } from '../lib/date'
import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  FeedingLog,
  FontPreset,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type Mode = 'report' | 'settings'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  environmentLogs: EnvironmentLog[]
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
  environmentLogs,
  defecationLogs,
  onSave,
}: Props) {
  const today = toISODate(new Date())
  const [mode, setMode] = useState<Mode>('report')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [reportStart, setReportStart] = useState(settings.adoptionDate)
  const [reportEnd, setReportEnd] = useState(today)
  const [message, setMessage] = useState('')

  const report = useMemo(() => {
    try {
      return buildReport(reportStart, reportEnd, {
        settings,
        feedingLogs,
        weightLogs,
        tmiLogs,
        presetSelections,
        environmentLogs,
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
    environmentLogs,
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

        <div className="view-toggle" role="group" aria-label="더보기 메뉴">
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

      {mode === 'report' ? (
        <>
          <Card title="관찰 보고서" icon="📄">
            <p className="setting-help report-intro">
              기간을 골라 급여·체중·배변·환경·관찰·TMI를 한 번에 정리합니다.
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
              이번 로컬 버전은 현재 설정을 기준으로 급여 예정 회차를 계산합니다.
              ‘급여 정책 변경 이력’까지 과거 날짜별로 정확히 적용하는 기능은 D1 연동 단계에서 넣을 예정입니다.
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
            </p>
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
