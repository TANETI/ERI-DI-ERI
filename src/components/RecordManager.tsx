import { useMemo, useState } from 'react'
import Card from './Card'
import { getScheduledDateForFeedingLog } from '../lib/feeding'
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
  date: string
  settings: AppSettings

  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]

  onUpdateFeeding: (log: FeedingLog) => void
  onDeleteFeeding: (id: string) => void

  onUpdateWeight: (log: WeightLog) => void
  onDeleteWeight: (id: string) => void

  onUpdateTmi: (log: TmiLog) => void
  onDeleteTmi: (id: string) => void

  onUpdatePreset: (log: PresetSelection) => void
  onDeletePreset: (id: string) => void

  onUpdateDefecation: (log: DefecationLog) => void
  onDeleteDefecation: (id: string) => void
}

type EditTarget =
  | { kind: 'feeding'; id: string }
  | { kind: 'weight'; id: string }
  | { kind: 'tmi'; id: string }
  | { kind: 'preset'; id: string }
  | { kind: 'defecation'; id: string }

type ManagerItem = {
  key: string
  kind: EditTarget['kind']
  id: string
  icon: string
  title: string
  summary: string
}

const amountLabels = [
  '안 먹음',
  '맛만 봄',
  '소량',
  '보통',
  '많이',
  '거의 다 먹음',
]

const groupLabels: Record<PresetSelection['group'], string> = {
  activity: '활동성',
  location: '위치',
  shedding: '탈피',
  body: '신체 관찰',
  health: '건강 · 이전 형식',
}

function shortDate(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function feedingSummary(log: FeedingLog) {
  const amount =
    log.amount === null ? '섭취량 미기록' : amountLabels[log.amount]
  return `실제 ${shortDate(log.date)} ${log.time ?? '시간 미기록'} · ${log.food} · ${amount}`
}

export default function RecordManager({
  date,
  settings,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  onUpdateFeeding,
  onDeleteFeeding,
  onUpdateWeight,
  onDeleteWeight,
  onUpdateTmi,
  onDeleteTmi,
  onUpdatePreset,
  onDeletePreset,
  onUpdateDefecation,
  onDeleteDefecation,
}: Props) {
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [notice, setNotice] = useState('')

  const flash = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 1800)
  }

  const visibleFeedings = useMemo(() => {
    const byId = new Map<string, FeedingLog>()

    feedingLogs.forEach((log) => {
      const scheduledDate = getScheduledDateForFeedingLog(log, settings)

      if (log.date === date || scheduledDate === date) {
        byId.set(log.id, log)
      }
    })

    return [...byId.values()].sort((a, b) =>
      `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`),
    )
  }, [date, feedingLogs, settings])

  const items = useMemo<ManagerItem[]>(() => {
    const result: ManagerItem[] = []

    visibleFeedings.forEach((log) => {
      const scheduledDate = getScheduledDateForFeedingLog(log, settings)

      result.push({
        key: `feeding-${log.id}`,
        kind: 'feeding',
        id: log.id,
        icon: '🍚',
        title: scheduledDate
          ? `급여 · ${shortDate(scheduledDate)} 회차`
          : '추가 급여',
        summary: feedingSummary(log),
      })
    })

    weightLogs
      .filter((log) => log.date === date)
      .forEach((log) => {
        result.push({
          key: `weight-${log.id}`,
          kind: 'weight',
          id: log.id,
          icon: '⚖️',
          title: '체중',
          summary: `${log.weight.toFixed(1)} g${log.memo ? ` · ${log.memo}` : ''}`,
        })
      })

    defecationLogs
      .filter((log) => log.date === date)
      .forEach((log) => {
        result.push({
          key: `defecation-${log.id}`,
          kind: 'defecation',
          id: log.id,
          icon: '💩',
          title: '배변',
          summary: `${log.status ?? '미분류'}${log.memo ? ` · ${log.memo}` : ''}`,
        })
      })

    presetSelections
      .filter((log) => log.date === date)
      .forEach((log) => {
        result.push({
          key: `preset-${log.id}`,
          kind: 'preset',
          id: log.id,
          icon: '✓',
          title: groupLabels[log.group],
          summary: log.label,
        })
      })

    tmiLogs
      .filter((log) => log.date === date)
      .forEach((log) => {
        result.push({
          key: `tmi-${log.id}`,
          kind: 'tmi',
          id: log.id,
          icon: '💬',
          title: 'TMI',
          summary: log.text,
        })
      })

    return result
  }, [
    date,
    visibleFeedings,
    weightLogs,
    defecationLogs,
    presetSelections,
    tmiLogs,
    settings,
  ])

  const requestDelete = (target: EditTarget) => {
    const kindLabel = {
      feeding: '급여',
      weight: '체중',
      tmi: 'TMI',
      preset: '관찰',
      defecation: '배변',
    }[target.kind]

    const confirmed = window.confirm(
      `${kindLabel} 기록을 삭제할까요?\n\n삭제한 기록은 자동으로 복구되지 않습니다.`,
    )

    if (!confirmed) return

    if (target.kind === 'feeding') onDeleteFeeding(target.id)
    if (target.kind === 'weight') onDeleteWeight(target.id)
    if (target.kind === 'tmi') onDeleteTmi(target.id)
    if (target.kind === 'preset') onDeletePreset(target.id)
    if (target.kind === 'defecation') onDeleteDefecation(target.id)

    if (editing?.kind === target.kind && editing.id === target.id) {
      setEditing(null)
    }

    flash('기록을 삭제했어요.')
  }

  return (
    <>
      <Card title={`이 날짜의 기록 · ${items.length}개`} icon="✎">
        {items.length === 0 ? (
          <p className="empty">
            아직 저장된 기록이 없어요. 아래에서 새 기록을 추가할 수 있어요.
          </p>
        ) : (
          <div className="record-manager-list">
            {items.map((item) => (
              <div className="record-manager-row" key={item.key}>
                <span className="record-manager-icon" aria-hidden="true">
                  {item.icon}
                </span>

                <div className="record-manager-copy">
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>

                <div className="record-manager-actions">
                  <button
                    type="button"
                    className="mini-action"
                    onClick={() =>
                      setEditing({ kind: item.kind, id: item.id } as EditTarget)
                    }
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="mini-action danger"
                    onClick={() =>
                      requestDelete({
                        kind: item.kind,
                        id: item.id,
                      } as EditTarget)
                    }
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <EditPanel
          key={`${editing.kind}-${editing.id}`}
          target={editing}
          feedingLogs={feedingLogs}
          weightLogs={weightLogs}
          tmiLogs={tmiLogs}
          presetSelections={presetSelections}
          defecationLogs={defecationLogs}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            flash('수정 내용을 저장했어요.')
          }}
          onUpdateFeeding={onUpdateFeeding}
          onUpdateWeight={onUpdateWeight}
          onUpdateTmi={onUpdateTmi}
          onUpdatePreset={onUpdatePreset}
          onUpdateDefecation={onUpdateDefecation}
        />
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </>
  )
}

function EditPanel({
  target,
  feedingLogs,
  weightLogs,
  tmiLogs,
  presetSelections,
  defecationLogs,
  onCancel,
  onSaved,
  onUpdateFeeding,
  onUpdateWeight,
  onUpdateTmi,
  onUpdatePreset,
  onUpdateDefecation,
}: {
  target: EditTarget
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  defecationLogs: DefecationLog[]
  onCancel: () => void
  onSaved: () => void
  onUpdateFeeding: (log: FeedingLog) => void
  onUpdateWeight: (log: WeightLog) => void
  onUpdateTmi: (log: TmiLog) => void
  onUpdatePreset: (log: PresetSelection) => void
  onUpdateDefecation: (log: DefecationLog) => void
}) {
  if (target.kind === 'feeding') {
    const log = feedingLogs.find((item) => item.id === target.id)
    if (!log) return null

    return (
      <FeedingEditor
        log={log}
        onCancel={onCancel}
        onSave={(next) => {
          onUpdateFeeding(next)
          onSaved()
        }}
      />
    )
  }

  if (target.kind === 'weight') {
    const log = weightLogs.find((item) => item.id === target.id)
    if (!log) return null

    return (
      <WeightEditor
        log={log}
        onCancel={onCancel}
        onSave={(next) => {
          onUpdateWeight(next)
          onSaved()
        }}
      />
    )
  }

  if (target.kind === 'tmi') {
    const log = tmiLogs.find((item) => item.id === target.id)
    if (!log) return null

    return (
      <TmiEditor
        log={log}
        onCancel={onCancel}
        onSave={(next) => {
          onUpdateTmi(next)
          onSaved()
        }}
      />
    )
  }

  if (target.kind === 'preset') {
    const log = presetSelections.find((item) => item.id === target.id)
    if (!log) return null

    return (
      <PresetEditor
        log={log}
        onCancel={onCancel}
        onSave={(next) => {
          onUpdatePreset(next)
          onSaved()
        }}
      />
    )
  }

  const log = defecationLogs.find((item) => item.id === target.id)
  if (!log) return null

  return (
    <DefecationEditor
      log={log}
      onCancel={onCancel}
      onSave={(next) => {
        onUpdateDefecation(next)
        onSaved()
      }}
    />
  )
}

function EditorActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="editor-actions">
      <button type="button" className="secondary-action" onClick={onCancel}>
        취소
      </button>
      <button type="button" className="primary-action editor-save" onClick={onSave}>
        수정 저장
      </button>
    </div>
  )
}

function FeedingEditor({
  log,
  onCancel,
  onSave,
}: {
  log: FeedingLog
  onCancel: () => void
  onSave: (log: FeedingLog) => void
}) {
  const [date, setDate] = useState(log.date)
  const [time, setTime] = useState(log.time ?? '')
  const [food, setFood] = useState(log.food)
  const [amount, setAmount] = useState<FeedingAmount | null>(log.amount)
  const [memo, setMemo] = useState(log.memo ?? '')

  return (
    <Card title="급여 기록 수정" icon="🍚" className="record-editor-card">
      <div className="form-grid">
        <label className="field">
          <span>실제 급여 날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>실제 급여 시간</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="field">
          <span>먹이</span>
          <input value={food} onChange={(e) => setFood(e.target.value)} />
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
          {amountLabels.map((label, index) => (
            <button
              type="button"
              key={label}
              className={amount === index ? 'chip selected' : 'chip'}
              onClick={() => setAmount(index as FeedingAmount)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="field editor-memo">
        <span>메모</span>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="선택 사항"
        />
      </label>

      <EditorActions
        onCancel={onCancel}
        onSave={() => {
          if (!date || !food.trim()) return
          onSave({
            ...log,
            date,
            time: time || undefined,
            food: food.trim(),
            amount,
            memo: memo.trim() || undefined,
          })
        }}
      />
    </Card>
  )
}

function WeightEditor({
  log,
  onCancel,
  onSave,
}: {
  log: WeightLog
  onCancel: () => void
  onSave: (log: WeightLog) => void
}) {
  const [date, setDate] = useState(log.date)
  const [weight, setWeight] = useState(String(log.weight))
  const [memo, setMemo] = useState(log.memo ?? '')

  return (
    <Card title="체중 기록 수정" icon="⚖️" className="record-editor-card">
      <div className="form-grid">
        <label className="field">
          <span>날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>체중 (g)</span>
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
      </div>

      <label className="field editor-memo">
        <span>메모</span>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="선택 사항"
        />
      </label>

      <EditorActions
        onCancel={onCancel}
        onSave={() => {
          const parsed = Number(weight)
          if (!date || !Number.isFinite(parsed) || parsed <= 0) return

          onSave({
            ...log,
            date,
            weight: parsed,
            memo: memo.trim() || undefined,
          })
        }}
      />
    </Card>
  )
}

function TmiEditor({
  log,
  onCancel,
  onSave,
}: {
  log: TmiLog
  onCancel: () => void
  onSave: (log: TmiLog) => void
}) {
  const [date, setDate] = useState(log.date)
  const [text, setText] = useState(log.text)

  return (
    <Card title="TMI 수정" icon="💬" className="record-editor-card">
      <label className="field">
        <span>날짜</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label className="field editor-memo">
        <span>그림일기</span>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <EditorActions
        onCancel={onCancel}
        onSave={() => {
          if (!date || !text.trim()) return
          onSave({ ...log, date, text: text.trim() })
        }}
      />
    </Card>
  )
}

function PresetEditor({
  log,
  onCancel,
  onSave,
}: {
  log: PresetSelection
  onCancel: () => void
  onSave: (log: PresetSelection) => void
}) {
  const [date, setDate] = useState(log.date)
  const [group, setGroup] = useState<PresetSelection['group']>(log.group)
  const [label, setLabel] = useState(log.label)

  return (
    <Card title="관찰 기록 수정" icon="✓" className="record-editor-card">
      <div className="form-grid">
        <label className="field">
          <span>날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="field">
          <span>분류</span>
          <select
            value={group}
            onChange={(e) =>
              setGroup(e.target.value as PresetSelection['group'])
            }
          >
            <option value="activity">활동성</option>
            <option value="location">위치</option>
            <option value="shedding">탈피</option>
            <option value="body">신체 관찰</option>
            <option value="health">건강 · 이전 형식</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>내용</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>

      <EditorActions
        onCancel={onCancel}
        onSave={() => {
          if (!date || !label.trim()) return
          onSave({ ...log, date, group, label: label.trim() })
        }}
      />
    </Card>
  )
}

function DefecationEditor({
  log,
  onCancel,
  onSave,
}: {
  log: DefecationLog
  onCancel: () => void
  onSave: (log: DefecationLog) => void
}) {
  const [date, setDate] = useState(log.date)
  const [status, setStatus] = useState<DefecationLog['status']>(
    log.status ?? '미분류',
  )
  const [memo, setMemo] = useState(log.memo ?? '')

  return (
    <Card title="배변 기록 수정" icon="💩" className="record-editor-card">
      <div className="form-grid">
        <label className="field">
          <span>날짜</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label className="field">
          <span>상태</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as DefecationLog['status'])
            }
          >
            <option value="정상">정상</option>
            <option value="묽음">묽음</option>
            <option value="단단함">단단함</option>
            <option value="형태 이상">형태 이상</option>
            <option value="미분류">미분류</option>
          </select>
        </label>
      </div>

      <label className="field editor-memo">
        <span>메모</span>
        <textarea
          rows={4}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="색, 요산, 형태 등 기억나는 내용을 적어둘 수 있어요."
        />
      </label>

      <EditorActions
        onCancel={onCancel}
        onSave={() => {
          if (!date) return
          onSave({
            ...log,
            date,
            status,
            memo: memo.trim() || undefined,
          })
        }}
      />
    </Card>
  )
}
