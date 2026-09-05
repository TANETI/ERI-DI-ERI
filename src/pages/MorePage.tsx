import { useMemo, useState } from 'react'
import Card from '../components/Card'
import StatsPage from './StatsPage'
import EvaluationHistoryPage from './EvaluationHistoryPage'
import { buildReport } from '../lib/report'
import {
  addDays,
  parseISODate,
  todayISO,
  toISODate,
} from '../lib/date'
import {
  downloadCsvBundle,
  downloadFullBackup,
  downloadStructuredJson,
  restoreBackupFile,
} from '../lib/backup'
import {
  checkCloudHealth,
  cloudflareRepository,
  getCloudApiBase,
  getCloudDevToken,
  getCloudPhotoMode,
  getRepositoryMode,
  localRepository,
  readCloudPhotos,
  readCloudSnapshot,
  replaceCloudPhotos,
  setCloudApiBase,
  setCloudDevToken,
  setCloudPhotoMode,
  setRepositoryMode,
} from '../data'
import type {
  AppSettings,
  DefecationLog,
  EvaluationLog,
  FeedingLog,
  FontPreset,
  ManagementDecision,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type Mode = 'stats' | 'review' | 'report' | 'settings'

type Props = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]
  evaluationLogs: EvaluationLog[]
  managementDecisions: ManagementDecision[]
  onAddEvaluation: (log: EvaluationLog) => void
  onUpdateEvaluation: (log: EvaluationLog) => void
  onDeleteEvaluation: (id: string) => void
  onAddManagementDecision: (log: ManagementDecision) => void
  onUpdateManagementDecision: (log: ManagementDecision) => void
  onDeleteManagementDecision: (id: string) => void
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
  evaluationLogs,
  managementDecisions,
  onAddEvaluation,
  onUpdateEvaluation,
  onDeleteEvaluation,
  onAddManagementDecision,
  onUpdateManagementDecision,
  onDeleteManagementDecision,
  onSave,
}: Props) {
  const today = todayISO()
  const [mode, setMode] = useState<Mode>('stats')
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [reportStart, setReportStart] = useState(settings.adoptionDate)
  const [reportEnd, setReportEnd] = useState(today)
  const [message, setMessage] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)

  const [cloudApiBaseDraft, setCloudApiBaseDraft] =
    useState(getCloudApiBase())
  const [cloudTokenDraft, setCloudTokenDraft] =
    useState(getCloudDevToken())
  const [cloudBusy, setCloudBusy] =
    useState(false)
  const [cloudStatus, setCloudStatus] =
    useState('')

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

  const exportFullBackup = async () => {
    setBackupBusy(true)

    try {
      const result =
        await downloadFullBackup()

      flash(
        result.photoCount
          ? `전체 백업을 만들었어요. 사진 ${result.photoCount}장 포함!`
          : '전체 백업을 만들었어요.',
      )
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : '전체 백업을 만들지 못했어요.',
      )
    } finally {
      setBackupBusy(false)
    }
  }

  const exportStructuredBackup = async () => {
    setBackupBusy(true)

    try {
      await downloadStructuredJson()
      flash('기록 JSON을 저장했어요.')
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : '기록 JSON을 만들지 못했어요.',
      )
    } finally {
      setBackupBusy(false)
    }
  }

  const exportCsvBackup = async () => {
    setBackupBusy(true)

    try {
      await downloadCsvBundle()
      flash('CSV 묶음을 저장했어요.')
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : 'CSV 묶음을 만들지 못했어요.',
      )
    } finally {
      setBackupBusy(false)
    }
  }

  const restoreBackup = async (
    file: File | undefined,
  ) => {
    if (!file) return

    const confirmed =
      window.confirm(
        '백업을 복원하면 현재 구조화 기록이 백업 내용으로 교체됩니다.\\n\\n전체 TAR 백업은 현재 로컬 사진도 백업 속 사진으로 교체합니다. 계속할까요?',
      )

    if (!confirmed) return

    setBackupBusy(true)

    try {
      const result =
        await restoreBackupFile(file)

      if (result.kind === 'full') {
        window.alert(
          `전체 백업 복원이 끝났어요. 사진 ${result.photoCount}장도 복원했습니다. 앱을 다시 불러올게요.`,
        )
      } else {
        window.alert(
          '기록 JSON 복원이 끝났어요. 사진은 현재 로컬 상태 그대로 유지합니다. 앱을 다시 불러올게요.',
        )
      }

      window.location.reload()
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : '백업 복원에 실패했어요.',
      )
      setBackupBusy(false)
    }
  }

  const saveCloudConnectionDrafts = () => {
    setCloudApiBase(
      cloudApiBaseDraft,
    )
    setCloudDevToken(
      cloudTokenDraft,
    )
  }

  const testCloudConnection = async () => {
    setCloudBusy(true)
    setCloudStatus('')

    try {
      saveCloudConnectionDrafts()

      const health =
        await checkCloudHealth()

      const snapshot =
        await readCloudSnapshot()

      setCloudStatus(
        `연결 성공 · API ${health.version ?? '?'} · D1 schema ${health.database?.schemaVersion ?? '?'} · 급여 ${snapshot.feedingLogs.length}건 / 체중 ${snapshot.weightLogs.length}건`,
      )
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? error.message
          : '클라우드 연결 확인에 실패했어요.',
      )
    } finally {
      setCloudBusy(false)
    }
  }

  const uploadLocalSnapshot = async () => {
    const confirmed =
      window.confirm(
        '현재 이 브라우저의 로컬 구조화 기록으로 D1의 구조화 기록 전체를 교체합니다.\n\n사진은 이번 단계에서 업로드하지 않습니다. 계속할까요?',
      )

    if (!confirmed) return

    setCloudBusy(true)
    setCloudStatus('')

    try {
      saveCloudConnectionDrafts()

      const localData =
        await localRepository
          .getStructuredData()

      await cloudflareRepository
        .replaceStructuredData(
          localData,
        )

      const verified =
        await readCloudSnapshot()

      setCloudStatus(
        `업로드 완료 · 급여 ${verified.feedingLogs.length}건 / 체중 ${verified.weightLogs.length}건 / TMI ${verified.tmiLogs.length}건 / 배변 ${verified.defecationLogs.length}건`,
      )
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? error.message
          : '로컬 기록 업로드에 실패했어요.',
      )
    } finally {
      setCloudBusy(false)
    }
  }

  const inspectCloudPhotos = async () => {
    setCloudBusy(true)
    setCloudStatus('')

    try {
      saveCloudConnectionDrafts()

      const cloudPhotos =
        await readCloudPhotos()

      const totalBytes =
        cloudPhotos.reduce(
          (sum, photo) =>
            sum + photo.sizeBytes,
          0,
        )

      setCloudStatus(
        `R2 사진 메타 ${cloudPhotos.length}장 · ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`,
      )
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? error.message
          : 'R2 사진 상태 확인에 실패했어요.',
      )
    } finally {
      setCloudBusy(false)
    }
  }

  const uploadLocalPhotos = async () => {
    const localPhotos =
      await localRepository.listPhotos()

    if (!localPhotos.length) {
      setCloudStatus(
        '이 브라우저에 옮길 로컬 사진이 없어요.',
      )
      return
    }

    const confirmed =
      window.confirm(
        `현재 브라우저의 사진 ${localPhotos.length}장을 R2로 업로드합니다.\n\n같은 ID의 R2 사진은 교체되고, 모든 업로드가 성공한 뒤 로컬에 없는 R2 사진은 정리합니다. 로컬 원본은 삭제하지 않습니다. 계속할까요?`,
      )

    if (!confirmed) return

    setCloudBusy(true)
    setCloudStatus(
      `로컬 사진 ${localPhotos.length}장 준비 중…`,
    )

    try {
      saveCloudConnectionDrafts()

      const entries = []

      for (let index = 0; index < localPhotos.length; index += 1) {
        const meta =
          localPhotos[index]

        setCloudStatus(
          `사진 준비 중 ${index + 1}/${localPhotos.length} · ${meta.date}`,
        )

        const blob =
          await localRepository.getPhotoBlob(
            meta.id,
          )

        if (!blob) {
          throw new Error(
            `${meta.date} 사진 원본 하나를 로컬 저장소에서 읽지 못했어요.`,
          )
        }

        entries.push({
          meta,
          blob,
        })
      }

      setCloudStatus(
        `R2 업로드 중 · ${entries.length}장`,
      )

      await replaceCloudPhotos(
        entries,
      )

      const verified =
        await readCloudPhotos()

      setCloudStatus(
        `R2 업로드 완료 · ${verified.length}장 확인 · 로컬 사진은 그대로 보존됨`,
      )
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? error.message
          : '사진 R2 업로드에 실패했어요.',
      )
    } finally {
      setCloudBusy(false)
    }
  }

  const activateCloudPhotoMode = async (
    nextMode: 'local' | 'r2',
  ) => {
    if (
      nextMode === getCloudPhotoMode()
    ) {
      setCloudStatus(
        nextMode === 'r2'
          ? '이미 R2 사진 모드를 사용 중이에요.'
          : '이미 로컬 사진 모드를 사용 중이에요.',
      )
      return
    }

    if (nextMode === 'r2') {
      setCloudBusy(true)

      try {
        saveCloudConnectionDrafts()

        const [
          localPhotos,
          cloudPhotos,
        ] = await Promise.all([
          localRepository.listPhotos(),
          readCloudPhotos(),
        ])

        if (
          localPhotos.length > 0 &&
          cloudPhotos.length === 0
        ) {
          setCloudStatus(
            '로컬 사진이 있는데 R2가 비어 있어요. 먼저 ‘로컬 사진 → R2’를 실행해 주세요.',
          )
          setCloudBusy(false)
          return
        }

        setCloudPhotoMode('r2')

        window.alert(
          `R2 사진 모드로 전환합니다. R2 사진 ${cloudPhotos.length}장을 사용하고, 기존 IndexedDB 사진은 백업으로 그대로 남겨둡니다.`,
        )

        window.location.reload()
      } catch (error) {
        setCloudStatus(
          error instanceof Error
            ? error.message
            : 'R2 사진 모드로 전환하지 못했어요.',
        )
        setCloudBusy(false)
      }

      return
    }

    setCloudPhotoMode('local')

    window.alert(
      '사진을 다시 이 브라우저의 IndexedDB에서 읽습니다. R2 사진은 삭제하지 않아요.',
    )

    window.location.reload()
  }

  const activateRepositoryMode = async (
    nextMode: 'local' | 'cloud',
  ) => {
    if (
      nextMode === getRepositoryMode()
    ) {
      setCloudStatus(
        nextMode === 'cloud'
          ? '이미 클라우드 모드를 사용 중이에요.'
          : '이미 로컬 모드를 사용 중이에요.',
      )
      return
    }

    if (nextMode === 'cloud') {
      setCloudBusy(true)

      try {
        saveCloudConnectionDrafts()
        await readCloudSnapshot()

        setRepositoryMode('cloud')

        window.alert(
          `클라우드 모드로 전환합니다. 사진은 ${getCloudPhotoMode() === 'r2' ? 'R2' : '이 브라우저의 로컬 저장소'}를 사용해요.`,
        )

        window.location.reload()
      } catch (error) {
        setCloudStatus(
          error instanceof Error
            ? error.message
            : '클라우드 모드로 전환하지 못했어요.',
        )
        setCloudBusy(false)
      }

      return
    }

    setRepositoryMode('local')

    window.alert(
      '로컬 모드로 전환합니다. 앱을 다시 불러올게요.',
    )

    window.location.reload()
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
    const endIso = todayISO()
    const startIso = toISODate(
      addDays(
        parseISODate(endIso),
        -(days - 1),
      ),
    )

    setReportStart(
      startIso < settings.adoptionDate
        ? settings.adoptionDate
        : startIso,
    )
    setReportEnd(endIso)
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
            className={mode === 'review' ? 'active' : ''}
            onClick={() => setMode('review')}
          >
            평가
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
      ) : mode === 'review' ? (
        <EvaluationHistoryPage
          adoptionDate={settings.adoptionDate}
          evaluations={evaluationLogs}
          decisions={managementDecisions}
          onAddEvaluation={onAddEvaluation}
          onUpdateEvaluation={onUpdateEvaluation}
          onDeleteEvaluation={onDeleteEvaluation}
          onAddDecision={onAddManagementDecision}
          onUpdateDecision={onUpdateManagementDecision}
          onDeleteDecision={onDeleteManagementDecision}
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
              ChatGPT 평가와 실제 관리 결정은 ‘평가’ 탭에 별도로 저장하며,
              새로운 보고서에는 과거 평가를 자동으로 섞지 않습니다.
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
            <div className="home-weather-location-card">
              <div>
                <span>우리 집 기준 지역</span>
                <strong>경기도 김포시 구래동</strong>
                <small>Open-Meteo · 구래동 중심부 근처 좌표 기준</small>
              </div>
              <span className="home-weather-location-badge">HOME</span>
            </div>

            <p className="setting-help">
              개인용 앱이므로 광역 김포시 검색 대신 구래동 좌표를 기본값으로 고정했습니다.
              실제 예보는 위도 37.64368 / 경도 126.62370 지점을 기준으로 요청합니다.
            </p>

            <label className="toggle-row">
              <span>
                <strong>날씨 기반 관리 알림</strong>
                <small>
                  더운 날 냉방 확인, 매우 습한 날 분무량 확인 같은 안내
                </small>
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
                지금은 앱을 열었을 때 확인하고, Cloudflare 배포 뒤에는 아침 자동 알림으로 연결할 예정입니다.
              </span>
            </div>

            <p className="setting-help">
              실외 날씨는 사육장 내부와 같지 않으므로 자동 처방이 아니라
              “오늘은 냉방/분무 상태를 한 번 더 확인하자”는 보조 신호로만 사용합니다.
            </p>
          </Card>

          <Card title="클라우드 데이터 실험실" icon="☁️">
            <div className="cloud-lab-head">
              <div>
                <span>Phase 5.4</span>
                <strong>
                  D1 + R2 + Access
                </strong>
                <small>
                  실제 도메인에서는 Cloudflare Access 로그인 뒤 같은 주소의 API를 사용해요.
                </small>
              </div>

              <span
                className={`cloud-mode-badge ${getRepositoryMode()}`}
              >
                {getRepositoryMode() === 'cloud'
                  ? 'CLOUD'
                  : 'LOCAL'}
              </span>
            </div>

            <div className="cloud-lab-fields">
              <label>
                <span>Worker API 주소</span>
                <input
                  type="url"
                  value={cloudApiBaseDraft}
                  placeholder="http://localhost:8787"
                  onChange={(event) =>
                    setCloudApiBaseDraft(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  개발용 API 토큰
                  <small>
                    · localhost / 비상 테스트 전용
                  </small>
                </span>
                <input
                  type="password"
                  value={cloudTokenDraft}
                  placeholder="Access 배포 후에는 비워도 됨"
                  autoComplete="off"
                  onChange={(event) =>
                    setCloudTokenDraft(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <div className="cloud-lab-actions">
              <button
                type="button"
                disabled={cloudBusy}
                onClick={() =>
                  void testCloudConnection()
                }
              >
                🔌 연결 확인
              </button>

              <button
                type="button"
                disabled={cloudBusy}
                onClick={() =>
                  void uploadLocalSnapshot()
                }
              >
                ⬆️ 로컬 기록 → D1
              </button>
            </div>

            <div className="cloud-photo-panel">
              <div className="cloud-photo-panel-head">
                <div>
                  <span>사진 저장소</span>
                  <strong>
                    {getCloudPhotoMode() === 'r2'
                      ? 'Cloudflare R2'
                      : '이 브라우저 IndexedDB'}
                  </strong>
                </div>

                <span
                  className={`cloud-photo-badge ${getCloudPhotoMode()}`}
                >
                  {getCloudPhotoMode() === 'r2'
                    ? 'R2'
                    : 'LOCAL'}
                </span>
              </div>

              <div className="cloud-lab-actions">
                <button
                  type="button"
                  disabled={cloudBusy}
                  onClick={() =>
                    void inspectCloudPhotos()
                  }
                >
                  🖼️ R2 사진 확인
                </button>

                <button
                  type="button"
                  disabled={cloudBusy}
                  onClick={() =>
                    void uploadLocalPhotos()
                  }
                >
                  ⬆️ 로컬 사진 → R2
                </button>
              </div>

              <div className="cloud-mode-switch cloud-photo-switch">
                <button
                  type="button"
                  className={
                    getCloudPhotoMode() === 'local'
                      ? 'active'
                      : ''
                  }
                  disabled={cloudBusy}
                  onClick={() =>
                    void activateCloudPhotoMode(
                      'local',
                    )
                  }
                >
                  브라우저 사진
                </button>

                <button
                  type="button"
                  className={
                    getCloudPhotoMode() === 'r2'
                      ? 'active'
                      : ''
                  }
                  disabled={cloudBusy}
                  onClick={() =>
                    void activateCloudPhotoMode(
                      'r2',
                    )
                  }
                >
                  R2 사진
                </button>
              </div>

              <p className="cloud-photo-note">
                R2로 옮겨도 기존 IndexedDB 원본은 자동 삭제하지 않아요.
                먼저 복사 → 확인 → R2 전환 순서로 진행합니다.
              </p>
            </div>

            <div className="cloud-mode-switch">
              <button
                type="button"
                className={
                  getRepositoryMode() === 'local'
                    ? 'active'
                    : ''
                }
                disabled={cloudBusy}
                onClick={() =>
                  void activateRepositoryMode(
                    'local',
                  )
                }
              >
                로컬 모드
              </button>

              <button
                type="button"
                className={
                  getRepositoryMode() === 'cloud'
                    ? 'active'
                    : ''
                }
                disabled={cloudBusy}
                onClick={() =>
                  void activateRepositoryMode(
                    'cloud',
                  )
                }
              >
                클라우드 모드
              </button>
            </div>

            {cloudStatus && (
              <p className="cloud-lab-status">
                {cloudStatus}
              </p>
            )}

            <div className="cloud-lab-warning">
              <strong>개발 단계 인증</strong>
              <p>
                localhost 테스트에서는 API_TOKEN을 현재 탭의
                sessionStorage에만 넣어 사용할 수 있습니다.
                실제 eri.issssm.com에서는 Cloudflare Access가 인증을 처리하므로
                브라우저에 API 토큰을 넣지 않습니다.
              </p>
            </div>
          </Card>

          <Card title="백업 · 복원" icon="💾">
            <div className="backup-hero">
              <div>
                <span>서버 이전 전 안전장치</span>
                <strong>기록 + 사진을 한 번에 보관</strong>
                <small>
                  D1/R2 연결 전에도 언제든 로컬 데이터를 꺼내둘 수 있어요.
                </small>
              </div>
              <span className="backup-hero-badge">
                LOCAL
              </span>
            </div>

            <div className="backup-action-grid">
              <button
                type="button"
                className="backup-action-card primary"
                disabled={backupBusy}
                onClick={() =>
                  void exportFullBackup()
                }
              >
                <span aria-hidden="true">📦</span>
                <div>
                  <strong>전체 백업</strong>
                  <small>
                    JSON + CSV + 사진 원본 · TAR
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="backup-action-card"
                disabled={backupBusy}
                onClick={() =>
                  void exportStructuredBackup()
                }
              >
                <span aria-hidden="true">🧾</span>
                <div>
                  <strong>기록 JSON</strong>
                  <small>
                    구조화 기록만 · 사진 제외
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="backup-action-card"
                disabled={backupBusy}
                onClick={() =>
                  void exportCsvBackup()
                }
              >
                <span aria-hidden="true">📊</span>
                <div>
                  <strong>CSV 묶음</strong>
                  <small>
                    표로 열기 좋은 기록 모음 · TAR
                  </small>
                </div>
              </button>
            </div>

            <div className="backup-restore-box">
              <div>
                <strong>백업에서 복원</strong>
                <p>
                  전체 TAR은 기록과 사진을 모두 교체하고,
                  기록 JSON은 구조화 기록만 교체합니다.
                </p>
              </div>

              <label
                className={`backup-restore-button ${backupBusy ? 'disabled' : ''}`}
              >
                <input
                  type="file"
                  accept=".tar,.json,application/x-tar,application/json"
                  disabled={backupBusy}
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0]
                    event.target.value = ''
                    void restoreBackup(file)
                  }}
                />
                {backupBusy
                  ? '처리 중…'
                  : '백업 파일 선택'}
              </label>
            </div>

            <div className="backup-warning">
              <strong>⚠️ 로컬 사진 주의</strong>
              <p>
                아직 사진은 이 브라우저의 IndexedDB에 있어요.
                사이트 데이터 삭제나 브라우저 초기화 전에
                <strong> 전체 백업</strong>을 받아두는 게 가장 안전합니다.
              </p>
            </div>
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
