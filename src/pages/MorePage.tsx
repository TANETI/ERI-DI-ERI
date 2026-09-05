import { useState } from 'react'
import Card from '../components/Card'
import type { AppSettings, FontPreset } from '../types'

type Props = {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

const fontOptions: Array<{ value: FontPreset; label: string; note: string }> = [
  { value: 'system', label: '기본 · 시스템', note: '가장 무난하고 안정적' },
  { value: 'malgun', label: '맑은 고딕', note: 'Windows 기본 한글 글꼴' },
  { value: 'pretendard', label: 'Pretendard 우선', note: '설치되어 있으면 Pretendard 사용' },
  { value: 'serif', label: '명조 · 바탕', note: '관찰일지 느낌의 세리프 계열' },
  { value: 'rounded', label: '둥근 고딕', note: '설치된 둥근 계열 글꼴 우선' },
]

export default function MorePage({ settings, onSave }: Props) {
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)

  const save = () => {
    onSave(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <main className="page">
      <header className="section-header compact-header">
        <div>
          <p className="eyebrow">개인 설정</p>
          <h1>설정</h1>
          <p className="subtle">에리 일지를 내 사용 방식에 맞게 조정합니다.</p>
        </div>
      </header>

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
          <span>오늘도 천장에 붙어서 세상을 관찰하는 중.</span>
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
          실제 급여 날짜와 시간은 그대로 보존됩니다.
        </p>
      </Card>

      <div className="settings-save-bar">
        <button className="primary-action settings-save" onClick={save}>설정 저장</button>
        {saved && <span className="save-ok">저장했어요.</span>}
      </div>

      <Card title="다음 단계">
        <ul className="roadmap">
          <li>D1 기반 실제 CRUD + 스케줄 변경 이력</li>
          <li>R2 사진 업로드와 앨범</li>
          <li>체중 그래프 및 기간 통계</li>
          <li>보고서 / ChatGPT 평가용 Markdown</li>
          <li>PWA / 급여·체중 알림</li>
        </ul>
      </Card>
    </main>
  )
}
