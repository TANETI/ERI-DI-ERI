import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import AlbumPage from './pages/AlbumPage'
import CalendarPage from './pages/CalendarPage'
import MorePage from './pages/MorePage'
import RecordPage from './pages/RecordPage'
import TodayPage from './pages/TodayPage'
import { store } from './lib/storage'
import { toISODate } from './lib/date'
import type {
  AppSettings,
  DefecationLog,
  FeedingLog,
  PresetGroup,
  PresetSelection,
  TmiLog,
  WeightLog,
} from './types'

type Tab = 'today' | 'calendar' | 'record' | 'album' | 'more'

store.initialize()

export default function App() {

  const [tab, setTab] = useState<Tab>('today')
  const [recordDate, setRecordDate] = useState(toISODate(new Date()))
  const [settings, setSettings] = useState<AppSettings>(() => store.getSettings())
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>(() => store.getFeedingLogs())
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => store.getWeightLogs())
  const [tmiLogs, setTmiLogs] = useState<TmiLog[]>(() => store.getTmiLogs())
  const [presetSelections, setPresetSelections] = useState<PresetSelection[]>(() => store.getPresetSelections())
  const [defecationLogs, setDefecationLogs] = useState<DefecationLog[]>(() => store.getDefecationLogs())

  useEffect(() => {
    document.documentElement.dataset.font = settings.fontPreset
  }, [settings.fontPreset])


const addFeeding = (log: FeedingLog) => {
  setFeedingLogs((prev) => {
    const next = [log, ...prev]
    store.saveFeedingLogs(next)
    return next
  })
}

const updateFeeding = (log: FeedingLog) => {
  const next = feedingLogs.map((item) => (item.id === log.id ? log : item))
  setFeedingLogs(next)
  store.saveFeedingLogs(next)
}

const deleteFeeding = (id: string) => {
  const next = feedingLogs.filter((item) => item.id !== id)
  setFeedingLogs(next)
  store.saveFeedingLogs(next)
}

const addWeight = (log: WeightLog) => {
  setWeightLogs((prev) => {
    const next = [log, ...prev]
    store.saveWeightLogs(next)
    return next
  })

  setSettings((prev) => {
    if (prev.weightStartDate) return prev
    const next = { ...prev, weightStartDate: log.date }
    store.saveSettings(next)
    return next
  })
}

const updateWeight = (log: WeightLog) => {
  const previous = weightLogs.find((item) => item.id === log.id)
  const next = weightLogs.map((item) => (item.id === log.id ? log : item))

  setWeightLogs(next)
  store.saveWeightLogs(next)

  if (
    previous &&
    settings.weightStartDate === previous.date &&
    previous.date !== log.date
  ) {
    const earliest = [...next].sort((a, b) => a.date.localeCompare(b.date))[0]
    const nextSettings = {
      ...settings,
      weightStartDate: earliest?.date,
    }

    setSettings(nextSettings)
    store.saveSettings(nextSettings)
  }
}

const deleteWeight = (id: string) => {
  const target = weightLogs.find((item) => item.id === id)
  const next = weightLogs.filter((item) => item.id !== id)

  setWeightLogs(next)
  store.saveWeightLogs(next)

  if (
    target &&
    settings.weightStartDate === target.date &&
    !next.some((item) => item.date === target.date)
  ) {
    const earliest = [...next].sort((a, b) => a.date.localeCompare(b.date))[0]
    const nextSettings = {
      ...settings,
      weightStartDate: earliest?.date,
    }

    setSettings(nextSettings)
    store.saveSettings(nextSettings)
  }
}

const addTmi = (log: TmiLog) => {
  setTmiLogs((prev) => {
    const next = [log, ...prev]
    store.saveTmiLogs(next)
    return next
  })
}

const updateTmi = (log: TmiLog) => {
  const next = tmiLogs.map((item) => (item.id === log.id ? log : item))
  setTmiLogs(next)
  store.saveTmiLogs(next)
}

const deleteTmi = (id: string) => {
  const next = tmiLogs.filter((item) => item.id !== id)
  setTmiLogs(next)
  store.saveTmiLogs(next)
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
    store.savePresetSelections(next)
    return next
  })
}

const updatePreset = (log: PresetSelection) => {
  setPresetSelections((prev) => {
    const next = prev.map((item) => (item.id === log.id ? log : item))
    store.savePresetSelections(next)
    return next
  })
}

const deletePreset = (id: string) => {
  setPresetSelections((prev) => {
    const next = prev.filter((item) => item.id !== id)
    store.savePresetSelections(next)
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
    store.savePresetSelections(next)
    return next
  })
}

const addDefecation = (log: DefecationLog) => {
  setDefecationLogs((prev) => {
    const next = [log, ...prev]
    store.saveDefecationLogs(next)
    return next
  })
}

const updateDefecation = (log: DefecationLog) => {
  const next = defecationLogs.map((item) =>
    item.id === log.id ? log : item,
  )
  setDefecationLogs(next)
  store.saveDefecationLogs(next)
}

const deleteDefecation = (id: string) => {
  const next = defecationLogs.filter((item) => item.id !== id)
  setDefecationLogs(next)
  store.saveDefecationLogs(next)
}

  const saveSettings = (next: AppSettings) => {
    setSettings(next)
    store.saveSettings(next)
  }

  const openRecord = (date: string) => {
    setRecordDate(date)
    setTab('record')
  }

  return (
    <div className="app-shell">
      <div className="content-shell">
        {tab === 'today' && (
          <TodayPage
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            onQuickRecord={() => openRecord(toISODate(new Date()))}
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

        {tab === 'album' && <AlbumPage />}

        {tab === 'more' && (
          <MorePage
            settings={settings}
            feedingLogs={feedingLogs}
            weightLogs={weightLogs}
            tmiLogs={tmiLogs}
            presetSelections={presetSelections}
            defecationLogs={defecationLogs}
            onSave={saveSettings}
          />
        )}
      </div>

      <BottomNav
        current={tab}
        onChange={(next) => {
          if (next === 'record') openRecord(toISODate(new Date()))
          else setTab(next)
        }}
      />
    </div>
  )
}
