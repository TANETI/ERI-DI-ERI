import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { feedingAmountLabels } from '../lib/feedingAmount'
import RecordManager from '../components/RecordManager'
import { todayISO } from '../lib/date'
import type {
  AppSettings,
  DefecationLog,
  FeedingAmount,
  FeedingLog,
  PresetGroup,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

type DetailSection = 'feeding' | 'weight' | 'defecation' | 'tmi' | null
type FeedingAmountMode = 'qualitative' | 'ml' | 'both'

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
  onSetPresetGroup: (
    date: string,
    group: PresetGroup,
    labels: string[],
  ) => void

  onAddDefecation: (log: DefecationLog) => void
  onUpdateDefecation: (log: DefecationLog) => void
  onDeleteDefecation: (id: string) => void
}

const activityPresets = [
  '평소와 비슷',
  '평소보다 조용함',
  '평소보다 활발함',
]

const locationPresets = [
  '은신처',
  '유리벽',
  '천장',
  '가지',
  '잎',
  '바닥',
  '물그릇 주변',
]

const sheddingPresets = [
  '탈피 징후',
  '탈피 중',
  '탈피 완료',
  '잔피부 보임',
]

const bodyPresets = [
  '특이사항 없음',
  '외상 보임',
  '호흡이 평소와 다름',
  '균형이 평소와 다름',
  '붙는 힘이 평소보다 약함',
]

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
  onSetPresetGroup,
  onAddDefecation,
  onUpdateDefecation,
  onDeleteDefecation,
}: Props) {
  const today = todayISO()
  const [date, setDate] = useState(initialDate ?? today)
  const [openSection, setOpenSection] = useState<DetailSection>(null)

  const [food, setFood] = useState('G-REP Insect')
  const [time, setTime] = useState('21:00')

  // 요청 반영: 따로 선택하지 않으면 '보통'(3)으로 저장.
  const [amountMode, setAmountMode] =
    useState<FeedingAmountMode>('qualitative')
  const [amount, setAmount] = useState<FeedingAmount | null>(3)
  const [amountMl, setAmountMl] = useState('')

  const [weight, setWeight] = useState('')
  const [tmi, setTmi] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setDate(initialDate ?? today)
    setOpenSection(null)
  }, [initialDate, today])

  const datePresets = useMemo(
    () => presetSelections.filter((item) => item.date === date),
    [presetSelections, date],
  )

  const selectedLabels = (group: PresetGroup) =>
    datePresets
      .filter((item) => item.group === group)
      .map((item) => item.label)

  const legacyHealthCount = datePresets.filter(
    (item) => item.group === 'health',
  ).length

  const flash = (message: string) => {
    setSaved(message)
    window.setTimeout(() => setSaved(''), 1600)
  }

  const toggleSection = (section: Exclude<DetailSection, null>) => {
    setOpenSection((current) => (current === section ? null : section))
  }

  const setSinglePreset = (group: PresetGroup, label: string) => {
    const current = selectedLabels(group)
    const next = current.includes(label) ? [] : [label]
    onSetPresetGroup(date, group, next)
  }

  const toggleMultiPreset = (group: PresetGroup, label: string) => {
    const current = selectedLabels(group)
    const next = current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label]

    onSetPresetGroup(date, group, next)
  }

  const toggleBodyPreset = (label: string) => {
    const current = selectedLabels('body')

    if (label === '특이사항 없음') {
      onSetPresetGroup(
        date,
        'body',
        current.includes(label) ? [] : ['특이사항 없음'],
      )
      return
    }

    const withoutNormal = current.filter(
      (item) => item !== '특이사항 없음',
    )

    const next = withoutNormal.includes(label)
      ? withoutNormal.filter((item) => item !== label)
      : [...withoutNormal, label]

    onSetPresetGroup(date, 'body', next)
  }

  const saveFeeding = () => {
    if (!food.trim()) {
      flash('먹이 이름을 확인해 주세요.')
      return
    }

    const parsedMl = Number(amountMl)
    const needsMl = amountMode === 'ml' || amountMode === 'both'

    if (
      needsMl &&
      (
        !amountMl.trim() ||
        !Number.isFinite(parsedMl) ||
        parsedMl < 0
      )
    ) {
      flash('mL 값을 확인해 주세요.')
      return
    }

    onAddFeeding({
      id: crypto.randomUUID(),
      date,
      time: time || undefined,
      food: food.trim(),
      amount:
        amountMode === 'ml'
          ? null
          : amount,
      amountMl:
        needsMl
          ? parsedMl
          : undefined,
    })

    setAmountMode('qualitative')
    setAmount(3)
    setAmountMl('')
    setOpenSection(null)

    if (amountMode === 'qualitative' && amount === 3) {
      flash('급여를 “보통” 섭취로 저장했어요.')
    } else if (amountMode === 'ml') {
      flash(`급여량 ${parsedMl} mL를 저장했어요.`)
    } else {
      flash('급여 기록을 저장했어요.')
    }
  }

  const saveWeight = () => {
    const parsed = Number(weight)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      flash('체중 값을 확인해 주세요.')
      return
    }

    onAddWeight({
      id: crypto.randomUUID(),
      date,
      weight: parsed,
    })

    setWeight('')
    setOpenSection(null)
    flash('체중 기록을 저장했어요.')
  }

  const saveTmi = () => {
    if (!tmi.trim()) {
      flash('TMI 내용을 입력해 주세요.')
      return
    }

    onAddTmi({
      id: crypto.randomUUID(),
      date,
      text: tmi.trim(),
    })

    setTmi('')
    setOpenSection(null)
    flash('그림일기를 저장했어요.')
  }

  const savePoop = (status: DefecationLog['status']) => {
    onAddDefecation({
      id: crypto.randomUUID(),
      date,
      status,
    })

    setOpenSection(null)
    flash(`배변 “${status}” 기록 완료`)
  }

  return (
    <main className="page">
      <header className="section-header">
        <div>
          <p className="eyebrow">빠른 체크 + 상세 기록</p>
          <h1>기록</h1>
          <p className="subtle">
            자주 보는 항목은 체크만 하고, 필요한 기록만 펼쳐서 적어요.
          </p>
        </div>
      </header>

      <Card>
        <label className="field">
          <span>기록 날짜</span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setOpenSection(null)
            }}
          />
        </label>
      </Card>

      <Card title="빠른 체크" icon="✓" className="quick-check-card">
        <PresetChecklist
          title="활동성"
          note="하루에 하나만 선택"
          items={activityPresets}
          selected={selectedLabels('activity')}
          onToggle={(label) => setSinglePreset('activity', label)}
        />

        <PresetChecklist
          title="위치"
          note="여러 곳 선택 가능"
          items={locationPresets}
          selected={selectedLabels('location')}
          onToggle={(label) => toggleMultiPreset('location', label)}
        />

        <PresetChecklist
          title="탈피"
          note="해당되는 것만 체크"
          items={sheddingPresets}
          selected={selectedLabels('shedding')}
          onToggle={(label) => toggleMultiPreset('shedding', label)}
        />

        <PresetChecklist
          title="신체 관찰"
          note="‘특이사항 없음’은 다른 항목과 동시에 선택되지 않음"
          items={bodyPresets}
          selected={selectedLabels('body')}
          onToggle={toggleBodyPreset}
        />

        {legacyHealthCount > 0 && (
          <p className="legacy-preset-note">
            이전 버전의 건강 프리셋 {legacyHealthCount}개가 남아 있어요.
            삭제하지 않았으며 위 ‘이 날짜의 기록’에서 수정할 수 있습니다.
          </p>
        )}
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

      <Card title="상세 기록 추가" icon="+">
        <div className="detail-launcher-grid">
          <DetailLauncher
            icon="🍚"
            label="급여"
            active={openSection === 'feeding'}
            onClick={() => toggleSection('feeding')}
          />
          <DetailLauncher
            icon="⚖️"
            label="체중"
            active={openSection === 'weight'}
            onClick={() => toggleSection('weight')}
          />
          <DetailLauncher
            icon="💩"
            label="배변"
            active={openSection === 'defecation'}
            onClick={() => toggleSection('defecation')}
          />
          <DetailLauncher
            icon="💬"
            label="TMI"
            active={openSection === 'tmi'}
            onClick={() => toggleSection('tmi')}
          />
        </div>
      </Card>

      {openSection === 'feeding' && (
        <Card title="급여 기록" icon="🍚" className="accordion-record-card">
          <div className="form-grid">
            <label className="field">
              <span>먹이</span>
              <input
                value={food}
                onChange={(event) => setFood(event.target.value)}
              />
            </label>

            <label className="field">
              <span>급여 시간</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <span>급여량 기록 방식</span>
            <div
              className="feeding-mode-toggle"
              role="group"
              aria-label="급여량 기록 방식"
            >
              <button
                type="button"
                className={amountMode === 'qualitative' ? 'active' : ''}
                onClick={() => setAmountMode('qualitative')}
              >
                체감 단계
              </button>
              <button
                type="button"
                className={amountMode === 'ml' ? 'active' : ''}
                onClick={() => setAmountMode('ml')}
              >
                mL
              </button>
              <button
                type="button"
                className={amountMode === 'both' ? 'active' : ''}
                onClick={() => setAmountMode('both')}
              >
                둘 다
              </button>
            </div>
            <p className="field-help">
              기본은 <strong>체감 단계 · 보통</strong>이에요.
              나중에 실제 양을 재기 시작하면 mL만, 또는 둘 다 기록할 수 있어요.
            </p>
          </div>

          {(amountMode === 'qualitative' || amountMode === 'both') && (
            <div className="field feeding-amount-section">
              <span>체감 섭취 단계</span>
              <div className="chip-wrap">
                <button
                  type="button"
                  className={amount === null ? 'chip selected' : 'chip'}
                  onClick={() => setAmount(null)}
                >
                  미기록
                </button>

                {feedingAmountLabels.map((label, index) => (
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
          )}

          {(amountMode === 'ml' || amountMode === 'both') && (
            <label className="field feeding-amount-section">
              <span>실제 급여량 (mL)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={amountMl}
                onChange={(event) => setAmountMl(event.target.value)}
                placeholder="예: 1.5"
              />
            </label>
          )}

          <button
            type="button"
            className="primary-action accordion-save"
            onClick={saveFeeding}
          >
            급여 저장
          </button>
        </Card>
      )}

      {openSection === 'weight' && (
        <Card title="체중 기록" icon="⚖️" className="accordion-record-card">
          <div className="inline-form">
            <label className="field grow">
              <span>체중 (g)</span>
              <input
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="예: 4.8"
              />
            </label>

            <button
              type="button"
              className="secondary-action align-end"
              onClick={saveWeight}
            >
              저장
            </button>
          </div>
        </Card>
      )}

      {openSection === 'defecation' && (
        <Card title="배변 기록" icon="💩" className="accordion-record-card">
          <p className="field-help">
            대략적인 상태만 빠르게 남기고, 자세한 내용은 저장 후 수정에서
            메모할 수 있어요.
          </p>

          <div className="chip-wrap">
            {(
              [
                '정상',
                '묽음',
                '단단함',
                '형태 이상',
                '미분류',
              ] as const
            ).map((status) => (
              <button
                type="button"
                className="chip"
                key={status}
                onClick={() => savePoop(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </Card>
      )}

      {openSection === 'tmi' && (
        <Card title="TMI · 그림일기" icon="💬" className="accordion-record-card">
          <label className="field">
            <span>오늘 있었던 일</span>
            <textarea
              value={tmi}
              onChange={(event) => setTmi(event.target.value)}
              placeholder="예: 오늘은 에리가 물그릇 앞에 오래 앉아 있었다. 작은 욕조를 구경하는 것 같아서 참 귀여웠다."
              rows={5}
            />
          </label>

          <button
            type="button"
            className="primary-action accordion-save"
            onClick={saveTmi}
          >
            그림일기 저장
          </button>
        </Card>
      )}

      {saved && <div className="toast" role="status">{saved}</div>}
    </main>
  )
}

function PresetChecklist({
  title,
  note,
  items,
  selected,
  onToggle,
}: {
  title: string
  note: string
  items: string[]
  selected: string[]
  onToggle: (label: string) => void
}) {
  return (
    <section className="preset-check-group">
      <div className="preset-check-head">
        <strong>{title}</strong>
        <span>{note}</span>
      </div>

      <div className="preset-toggle-wrap">
        {items.map((item) => {
          const active = selected.includes(item)

          return (
            <button
              type="button"
              key={item}
              className={active ? 'preset-toggle selected' : 'preset-toggle'}
              aria-pressed={active}
              onClick={() => onToggle(item)}
            >
              <span className="preset-checkmark" aria-hidden="true">
                {active ? '✓' : ''}
              </span>
              {item}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function DetailLauncher({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={active ? 'detail-launcher active' : 'detail-launcher'}
      aria-expanded={active}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
      <strong>{label}</strong>
      <small>{active ? '접기' : '열기'}</small>
    </button>
  )
}
