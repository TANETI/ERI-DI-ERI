import { useEffect, useState } from 'react'
import Card from '../components/Card'
import RecordManager from '../components/RecordManager'
import { toISODate } from '../lib/date'
import type {
  AppSettings,
  DefecationLog,
  FeedingAmount,
  FeedingLog,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type Props = {
  initialDate?: string
  settings: AppSettings

  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]

  onAddFeeding: (log: FeedingLog) => void
  onUpdateFeeding: (log: FeedingLog) => void
  onDeleteFeeding: (id: string) => void

  onAddWeight: (log: WeightLog) => void
  onUpdateWeight: (log: WeightLog) => void
  onDeleteWeight: (id: string) => void

  onAddTmi: (log: TmiLog) => void
  onUpdateTmi: (log: TmiLog) => void
  onDeleteTmi: (id: string) => void

  onAddPreset: (log: PresetSelection) => void
  onUpdatePreset: (log: PresetSelection) => void
  onDeletePreset: (id: string) => void

  onAddDefecation: (log: DefecationLog) => void
  onUpdateDefecation: (log: DefecationLog) => void
  onDeleteDefecation: (id: string) => void
}

const amountLabels = ['안 먹음', '맛만 봄', '소량', '보통', '많이', '거의 다 먹음']
const activityPresets = ['매우 조용함', '조용함', '평소와 비슷', '활발함', '매우 활발함']
const locationPresets = ['은신처', '유리벽', '천장', '가지', '잎', '바닥', '물그릇 주변']
const healthPresets = ['특이사항 없음', '식욕 변화', '움직임 변화', '배변 변화', '탈피 문제', '외상 관찰', '호흡 변화']

export default function RecordPage({
  initialDate,
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  onAddFeeding,
  onUpdateFeeding,
  onDeleteFeeding,
  onAddWeight,
  onUpdateWeight,
  onDeleteWeight,
  onAddTmi,
  onUpdateTmi,
  onDeleteTmi,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onAddDefecation,
  onUpdateDefecation,
  onDeleteDefecation,
}: Props) {
  const today = toISODate(new Date())
  const [date, setDate] = useState(initialDate ?? today)
  const [food, setFood] = useState('G-REP Insect')
  const [time, setTime] = useState('21:00')
  const [amount, setAmount] = useState<FeedingAmount | null>(null)
  const [weight, setWeight] = useState('')
  const [tmi, setTmi] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setDate(initialDate ?? today)
  }, [initialDate, today])

  const flash = (msg: string) => {
    setSaved(msg)
    window.setTimeout(() => setSaved(''), 1800)
  }

  const saveFeeding = () => {
    onAddFeeding({
      id: crypto.randomUUID(),
      date,
      time,
      food,
      amount,
    })
    flash('급여 기록을 저장했어요.')
  }

  const saveWeight = () => {
    const parsed = Number(weight)
    if (!Number.isFinite(parsed) || parsed <= 0) return flash('체중 값을 확인해 주세요.')
    onAddWeight({ id: crypto.randomUUID(), date, weight: parsed })
    setWeight('')
    flash('체중 기록을 저장했어요.')
  }

  const saveTmi = () => {
    if (!tmi.trim()) return flash('TMI 내용을 입력해 주세요.')
    onAddTmi({ id: crypto.randomUUID(), date, text: tmi.trim() })
    setTmi('')
    flash('TMI를 저장했어요.')
  }

  const savePreset = (group: PresetSelection['group'], label: string) => {
    onAddPreset({ id: crypto.randomUUID(), date, group, label })
    flash(`“${label}” 기록 완료`)
  }

  const savePoop = (status: DefecationLog['status']) => {
    onAddDefecation({ id: crypto.randomUUID(), date, status })
    flash(`배변 “${status}” 기록 완료`)
  }

  return (
    <main className="page">
      <header className="section-header">
        <div>
          <p className="eyebrow">추가 · 수정 · 삭제</p>
          <h1>기록</h1>
          <p className="subtle">날짜를 고르고 기존 기록을 고치거나 새 기록을 추가할 수 있어요.</p>
        </div>
      </header>

      <Card>
        <label className="field">
          <span>기록 날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </Card>


      <RecordManager
        date={date}
        settings={settings}
        feedingLogs={feedingLogs}
        weightLogs={weightLogs}
        tmiLogs={tmiLogs}
        presetSelections={presetSelections}
        defecationLogs={defecationLogs}
        onUpdateFeeding={onUpdateFeeding}
        onDeleteFeeding={onDeleteFeeding}
        onUpdateWeight={onUpdateWeight}
        onDeleteWeight={onDeleteWeight}
        onUpdateTmi={onUpdateTmi}
        onDeleteTmi={onDeleteTmi}
        onUpdatePreset={onUpdatePreset}
        onDeletePreset={onDeletePreset}
        onUpdateDefecation={onUpdateDefecation}
        onDeleteDefecation={onDeleteDefecation}
      />

      <Card title="프리셋 빠른 기록" icon="✓">
        <PresetGroup title="활동성" items={activityPresets} onPick={(label) => savePreset('activity', label)} />
        <PresetGroup title="위치" items={locationPresets} onPick={(label) => savePreset('location', label)} />
        <PresetGroup title="건강 관찰" items={healthPresets} onPick={(label) => savePreset('health', label)} />
      </Card>

      <Card title="급여" icon="🍚">
        <div className="form-grid">
          <label className="field">
            <span>먹이</span>
            <input value={food} onChange={(e) => setFood(e.target.value)} />
          </label>
          <label className="field">
            <span>급여 시간</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span>섭취량</span>
          <div className="chip-wrap">
            <button
              type="button"
              className={amount === null ? 'chip selected' : 'chip'}
              onClick={() => setAmount(null)}
            >
              미기록
            </button>
            {amountLabels.map((label, idx) => (
              <button
                type="button"
                key={label}
                className={amount === idx ? 'chip selected' : 'chip'}
                onClick={() => setAmount(idx as FeedingAmount)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="secondary-action" onClick={saveFeeding}>급여 저장</button>
      </Card>

      <Card title="체중" icon="⚖️">
        <div className="inline-form">
          <label className="field grow">
            <span>체중 (g)</span>
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 4.8" />
          </label>
          <button type="button" className="secondary-action align-end" onClick={saveWeight}>저장</button>
        </div>
      </Card>


      <Card title="배변" icon="●">
        <div className="chip-wrap">
          {(['정상', '묽음', '단단함', '형태 이상', '미분류'] as const).map((status) => (
            <button type="button" className="chip" key={status} onClick={() => savePoop(status)}>{status}</button>
          ))}
        </div>
      </Card>

      <Card title="TMI" icon="💬">
        <label className="field">
          <span>오늘 있었던 일</span>
          <textarea
            value={tmi}
            onChange={(e) => setTmi(e.target.value)}
            placeholder="예: 오늘은 에리가 물그릇 앞에 오래 앉아 있었다. 작은 욕조를 구경하는 것 같아서 참 귀여웠다."
            rows={4}
          />
        </label>
        <button type="button" className="secondary-action" onClick={saveTmi}>TMI 저장</button>
      </Card>

      {saved && <div className="toast" role="status">{saved}</div>}
    </main>
  )
}

function PresetGroup({ title, items, onPick }: { title: string; items: string[]; onPick: (label: string) => void }) {
  return (
    <div className="preset-group">
      <strong>{title}</strong>
      <div className="chip-wrap">
        {items.map((item) => (
          <button type="button" className="chip" key={item} onClick={() => onPick(item)}>{item}</button>
        ))}
      </div>
    </div>
  )
}
