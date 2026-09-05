import { useEffect, useMemo, useState } from 'react'
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
  PresetSelection,
  TmiLog,
  WeightLog,
} from './types'

type Tab = 'today' | 'calendar' | 'record' | 'album' | 'more'

export default function App() {
  store.initialize()

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

  const actions = useMemo(() => ({
    addFeeding(log: FeedingLog) {
      setFeedingLogs((prev) => {
        const next = [log, ...prev]
        store.saveFeedingLogs(next)
        return next
      })
    },

    addWeight(log: WeightLog) {
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
    },

    addTmi(log: TmiLog) {
      setTmiLogs((prev) => {
        const next = [log, ...prev]
        store.saveTmiLogs(next)
        return next
      })
    },

    addPreset(log: PresetSelection) {
      setPresetSelections((prev) => {
        const next = [log, ...prev]
        store.savePresetSelections(next)
        return next
      })
    },


    addDefecation(log: DefecationLog) {
      setDefecationLogs((prev) => {
        const next = [log, ...prev]
        store.saveDefecationLogs(next)
        return next
      })
    },
  }), [])

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
            onAddFeeding={actions.addFeeding}
            onAddWeight={actions.addWeight}
            onAddTmi={actions.addTmi}
            onAddPreset={actions.addPreset}
            onAddDefecation={actions.addDefecation}
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
