import { useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import DesktopNav from './components/DesktopNav'
import AlbumPage from './pages/AlbumPage'
import CalendarPage from './pages/CalendarPage'
import MorePage from './pages/MorePage'
import RecordPage from './pages/RecordPage'
import TodayPage from './pages/TodayPage'
import { todayISO, toISODate } from './lib/date'
import { getAppPlatform } from './lib/platform'
import {
  appRepository,
  getCloudPhotoMode,
  getRepositoryMode,
} from './data'
import { defaultSettings } from './lib/defaultSettings'
import {
  commitScheduleChanges,
  reanchorWeightSchedule,
  startWeightSchedule,
} from './lib/schedule'
import type {
  AppSettings,
  DefecationLog,
  EvaluationLog,
  FeedingLog,
  ManagementDecision,
  PhotoMeta,
  PresetGroup,
  PresetSelection,
  TmiLog,
  WeightLog,
} from './types'

type Tab = 'today' | 'calendar' | 'record' | 'album' | 'more'


export default function App() {

  const platform = getAppPlatform()
  const isDesktop = platform === 'desktop'

  const [tab, setTab] = useState<Tab>('today')
  const [recordDate, setRecordDate] = useState(todayISO())

  const [settings, setSettings] =
    useState<AppSettings>(defaultSettings)
  const [feedingLogs, setFeedingLogs] =
    useState<FeedingLog[]>([])
  const [weightLogs, setWeightLogs] =
    useState<WeightLog[]>([])
  const [tmiLogs, setTmiLogs] =
    useState<TmiLog[]>([])
  const [presetSelections, setPresetSelections] =
    useState<PresetSelection[]>([])
  const [defecationLogs, setDefecationLogs] =
    useState<DefecationLog[]>([])
  const [evaluationLogs, setEvaluationLogs] =
    useState<EvaluationLog[]>([])
  const [managementDecisions, setManagementDecisions] =
    useState<ManagementDecision[]>([])

  const [photos, setPhotos] =
    useState<PhotoMeta[]>([])
  const [photosLoading, setPhotosLoading] =
    useState(true)

  const [booting, setBooting] =
    useState(true)
  const [dataError, setDataError] =
    useState('')

  // 향후 원격 저장소에서도 빠른 연속 입력의 쓰기 순서가
  // 뒤집히지 않도록 구조화 기록 저장을 직렬화한다.
  const writeQueueRef =
    useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        await appRepository.initialize()

        const [
          data,
          photoMeta,
        ] = await Promise.all([
          appRepository.getStructuredData(),
          appRepository.listPhotos(),
        ])

        if (!active) return

        setSettings(data.settings)
        setFeedingLogs(data.feedingLogs)
        setWeightLogs(data.weightLogs)
        setTmiLogs(data.tmiLogs)
        setPresetSelections(data.presetSelections)
        setDefecationLogs(data.defecationLogs)
        setEvaluationLogs(data.evaluationLogs)
        setManagementDecisions(
          data.managementDecisions,
        )
        setPhotos(photoMeta)
        setDataError('')
      } catch (error) {
        if (!active) return

        setDataError(
          error instanceof Error
            ? error.message
            : '저장된 데이터를 불러오지 못했어요.',
        )
      } finally {
        if (active) {
          setPhotosLoading(false)
          setBooting(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.font = settings.fontPreset
  }, [settings.fontPreset])

  const persist = (
    operation: () => Promise<void>,
  ) => {
    const previous =
      writeQueueRef.current ??
      Promise.resolve()

    writeQueueRef.current =
      previous
        .then(operation)
        .catch((error) => {
          console.error(
            'ERI DI-ERY repository write failed',
            error,
          )

          setDataError(
            error instanceof Error
              ? `저장 중 오류: ${error.message}`
              : '저장 중 오류가 발생했어요.',
          )
        })
  }


const addFeeding = (log: FeedingLog) => {
  setFeedingLogs((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveFeedingLogs(next))
    return next
  })
}

const updateFeeding = (log: FeedingLog) => {
  const next = feedingLogs.map((item) => (item.id === log.id ? log : item))
  setFeedingLogs(next)
  persist(() => appRepository.saveFeedingLogs(next))
}

const deleteFeeding = (id: string) => {
  const next = feedingLogs.filter((item) => item.id !== id)
  setFeedingLogs(next)
  persist(() => appRepository.saveFeedingLogs(next))
}

const addWeight = (log: WeightLog) => {
  setWeightLogs((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveWeightLogs(next))
    return next
  })

  setSettings((prev) => {
    if (prev.weightStartDate) return prev
    const next = startWeightSchedule(prev, log.date)
    persist(() => appRepository.saveSettings(next))
    return next
  })
}

const updateWeight = (log: WeightLog) => {
  const previous = weightLogs.find((item) => item.id === log.id)
  const next = weightLogs.map((item) => (item.id === log.id ? log : item))

  setWeightLogs(next)
  persist(() => appRepository.saveWeightLogs(next))

  if (
    previous &&
    settings.weightStartDate === previous.date &&
    previous.date !== log.date
  ) {
    const earliest = [...next].sort((a, b) => a.date.localeCompare(b.date))[0]
    const nextSettings = reanchorWeightSchedule(
      settings,
      previous.date,
      earliest?.date,
    )

    setSettings(nextSettings)
    persist(() => appRepository.saveSettings(nextSettings))
  }
}

const deleteWeight = (id: string) => {
  const target = weightLogs.find((item) => item.id === id)
  const next = weightLogs.filter((item) => item.id !== id)

  setWeightLogs(next)
  persist(() => appRepository.saveWeightLogs(next))

  if (
    target &&
    settings.weightStartDate === target.date &&
    !next.some((item) => item.date === target.date)
  ) {
    const earliest = [...next].sort((a, b) => a.date.localeCompare(b.date))[0]
    const nextSettings = reanchorWeightSchedule(
      settings,
      target.date,
      earliest?.date,
    )

    setSettings(nextSettings)
    persist(() => appRepository.saveSettings(nextSettings))
  }
}

const addTmi = (log: TmiLog) => {
  setTmiLogs((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveTmiLogs(next))
    return next
  })
}

const updateTmi = (log: TmiLog) => {
  const next = tmiLogs.map((item) => (item.id === log.id ? log : item))
  setTmiLogs(next)
  persist(() => appRepository.saveTmiLogs(next))
}

const deleteTmi = (id: string) => {
  const next = tmiLogs.filter((item) => item.id !== id)
  setTmiLogs(next)
  persist(() => appRepository.saveTmiLogs(next))
}

const addPreset = (log: PresetSelection) => {
  setPresetSelections((prev) => {
    const duplicate = prev.some(
      (item) =>
        item.date === log.date &&
        item.group === log.group &&
        item.label === log.label,
    )

    if (duplicate) return prev

    const next = [log, ...prev]
    persist(() => appRepository.savePresetSelections(next))
    return next
  })
}

const updatePreset = (log: PresetSelection) => {
  setPresetSelections((prev) => {
    const next = prev.map((item) => (item.id === log.id ? log : item))
    persist(() => appRepository.savePresetSelections(next))
    return next
  })
}

const deletePreset = (id: string) => {
  setPresetSelections((prev) => {
    const next = prev.filter((item) => item.id !== id)
    persist(() => appRepository.savePresetSelections(next))
    return next
  })
}

const setPresetGroup = (
  date: string,
  group: PresetGroup,
  labels: string[],
) => {
  setPresetSelections((prev) => {
    const existing = prev.filter(
      (item) => item.date === date && item.group === group,
    )

    const preserved = prev.filter(
      (item) => !(item.date === date && item.group === group),
    )

    const nextGroup = labels.map((label) => {
      const found = existing.find((item) => item.label === label)
      return (
        found ?? {
          id: crypto.randomUUID(),
          date,
          group,
          label,
        }
      )
    })

    const next = [...preserved, ...nextGroup]
    persist(() => appRepository.savePresetSelections(next))
    return next
  })
}

const addDefecation = (log: DefecationLog) => {
  setDefecationLogs((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveDefecationLogs(next))
    return next
  })
}

const updateDefecation = (log: DefecationLog) => {
  const next = defecationLogs.map((item) =>
    item.id === log.id ? log : item,
  )
  setDefecationLogs(next)
  persist(() => appRepository.saveDefecationLogs(next))
}

const deleteDefecation = (id: string) => {
  const next = defecationLogs.filter((item) => item.id !== id)
  setDefecationLogs(next)
  persist(() => appRepository.saveDefecationLogs(next))
}

const addEvaluation = (log: EvaluationLog) => {
  setEvaluationLogs((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveEvaluationLogs(next))
    return next
  })
}

const updateEvaluation = (log: EvaluationLog) => {
  setEvaluationLogs((prev) => {
    const next = prev.map((item) =>
      item.id === log.id ? log : item,
    )
    persist(() => appRepository.saveEvaluationLogs(next))
    return next
  })
}

const deleteEvaluation = (id: string) => {
  setEvaluationLogs((prev) => {
    const next = prev.filter((item) => item.id !== id)
    persist(() => appRepository.saveEvaluationLogs(next))
    return next
  })
}

const addManagementDecision = (
  log: ManagementDecision,
) => {
  setManagementDecisions((prev) => {
    const next = [log, ...prev]
    persist(() => appRepository.saveManagementDecisions(next))
    return next
  })
}

const updateManagementDecision = (
  log: ManagementDecision,
) => {
  setManagementDecisions((prev) => {
    const next = prev.map((item) =>
      item.id === log.id ? log : item,
    )
    persist(() => appRepository.saveManagementDecisions(next))
    return next
  })
}

const deleteManagementDecision = (id: string) => {
  setManagementDecisions((prev) => {
    const next = prev.filter((item) => item.id !== id)
    persist(() => appRepository.saveManagementDecisions(next))
    return next
  })
}

const refreshPhotos = async () => {
  const next = await appRepository.listPhotos()
  setPhotos(next)
}

const addPhotos = async (
  date: string,
  files: File[],
) => {
  if (!files.length) return

  let hasCover = photos.some(
    (photo) => photo.date === date && photo.isCover,
  )

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue

    await appRepository.addPhoto(
      file,
      date,
      !hasCover,
    )

    hasCover = true
  }

  await refreshPhotos()
}

const updatePhotoCaption = async (
  id: string,
  caption: string,
) => {
  const photo = photos.find((item) => item.id === id)
  if (!photo) return

  await appRepository.savePhotoMeta({
    ...photo,
    caption: caption || undefined,
  })
  await refreshPhotos()
}

const setPhotoCover = async (id: string) => {
  const target = photos.find((item) => item.id === id)
  if (!target) return

  const sameDate = photos.filter(
    (item) => item.date === target.date,
  )

  await Promise.all(
    sameDate.map((photo) =>
      appRepository.savePhotoMeta({
        ...photo,
        isCover: photo.id === id,
      }),
    ),
  )

  await refreshPhotos()
}

const deletePhoto = async (id: string) => {
  const target = photos.find((item) => item.id === id)
  if (!target) return

  await appRepository.deletePhoto(id)

  if (target.isCover) {
    const replacement = photos
      .filter(
        (item) =>
          item.date === target.date &&
          item.id !== id,
      )
      .sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0]

    if (replacement) {
      await appRepository.savePhotoMeta({
        ...replacement,
        isCover: true,
      })
    }
  }

  await refreshPhotos()
}

  const saveSettings = (draft: AppSettings) => {
    const next = commitScheduleChanges(settings, draft)
    setSettings(next)
    persist(() => appRepository.saveSettings(next))
  }

  const openRecord = (date: string) => {
    setRecordDate(date)
    setTab('record')
  }

  if (booting) {
    return (
      <div className="app-bootstrap">
        <span aria-hidden="true">🦎</span>
        <strong>에리의 기록을 불러오는 중…</strong>
        <small>
          ERI DI-ERY · {getRepositoryMode() === 'cloud'
            ? 'CLOUD'
            : 'LOCAL'}
        </small>
      </div>
    )
  }

  return (
    <div className={`app-shell app-shell-${platform}`}>
      {dataError && (
        <button
          type="button"
          className="repository-error-banner"
          onClick={() => setDataError('')}
          title="눌러서 닫기"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{dataError}</span>
        </button>
      )}

      {isDesktop && (
        <DesktopNav
          current={tab}
          onChange={(next) => {
            if (next === 'record') {
              openRecord(todayISO())
            } else {
              setTab(next)
            }
          }}
        />
      )}

      <div
        className={`content-shell content-shell-${platform} content-tab-${tab}`}
      >
        <span
          className={`repository-mode-dot ${getRepositoryMode()}`}
          title={
            getRepositoryMode() === 'cloud'
              ? `기록: 온라인 보관함 · 사진: ${getCloudPhotoMode() === 'r2' ? '온라인 보관함' : '이 기기'}`
              : '기록/사진: 이 기기'
          }
          aria-label={
            getRepositoryMode() === 'cloud'
              ? `온라인 기록 사용 중 · 사진 ${getCloudPhotoMode() === 'r2' ? '온라인 보관함' : '이 기기'}`
              : '이 기기 기록 사용 중'
          }
        />
        {tab === 'today' && (
          <TodayPage
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            photos={photos}
            onQuickRecord={() => openRecord(todayISO())}
            onOpenAlbum={() => setTab('album')}
          />
        )}

        {tab === 'calendar' && (
          <CalendarPage
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            tmiLogs={tmiLogs}
            presetSelections={presetSelections}
            defecationLogs={defecationLogs}
            photos={photos}
            onAddRecord={openRecord}
          />
        )}

        {tab === 'record' && (
          <RecordPage
            initialDate={recordDate}
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            tmiLogs={tmiLogs}
            presetSelections={presetSelections}
            defecationLogs={defecationLogs}
            onAddFeeding={addFeeding}
            onUpdateFeeding={updateFeeding}
            onDeleteFeeding={deleteFeeding}
            onAddWeight={addWeight}
            onUpdateWeight={updateWeight}
            onDeleteWeight={deleteWeight}
            onAddTmi={addTmi}
            onUpdateTmi={updateTmi}
            onDeleteTmi={deleteTmi}
            onAddPreset={addPreset}
            onUpdatePreset={updatePreset}
            onDeletePreset={deletePreset}
            onSetPresetGroup={setPresetGroup}
            onAddDefecation={addDefecation}
            onUpdateDefecation={updateDefecation}
            onDeleteDefecation={deleteDefecation}
          />
        )}

        {tab === 'album' && (
          <AlbumPage
            photos={photos}
            loading={photosLoading}
            onAddPhotos={addPhotos}
            onUpdateCaption={updatePhotoCaption}
            onSetCover={setPhotoCover}
            onDeletePhoto={deletePhoto}
          />
        )}

        {tab === 'more' && (
          <MorePage
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            tmiLogs={tmiLogs}
            presetSelections={presetSelections}
            defecationLogs={defecationLogs}
            evaluationLogs={evaluationLogs}
            managementDecisions={managementDecisions}
            onAddEvaluation={addEvaluation}
            onUpdateEvaluation={updateEvaluation}
            onDeleteEvaluation={deleteEvaluation}
            onAddManagementDecision={addManagementDecision}
            onUpdateManagementDecision={updateManagementDecision}
            onDeleteManagementDecision={deleteManagementDecision}
            onSave={saveSettings}
          />
        )}
      </div>

      {!isDesktop && (
        <BottomNav
          current={tab}
          onChange={(next) => {
            if (next === 'record') {
              openRecord(todayISO())
            } else {
              setTab(next)
            }
          }}
        />
      )}
    </div>
  )
}
