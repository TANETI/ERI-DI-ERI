import { useMemo, useState } from 'react'
import Card from '../components/Card'
import { todayISO } from '../lib/date'
import type {
  DecisionCategory,
  DecisionStatus,
  EvaluationLog,
  ManagementDecision,
} from '../types'

type Props = {
  adoptionDate: string
  evaluations: EvaluationLog[]
  decisions: ManagementDecision[]
  onAddEvaluation: (log: EvaluationLog) => void
  onUpdateEvaluation: (log: EvaluationLog) => void
  onDeleteEvaluation: (id: string) => void
  onAddDecision: (log: ManagementDecision) => void
  onUpdateDecision: (log: ManagementDecision) => void
  onDeleteDecision: (id: string) => void
}

const categoryLabels: Record<DecisionCategory, string> = {
  feeding: '급여',
  weight: '체중',
  weather: '날씨',
  habitat: '사육환경',
  observation: '관찰',
  other: '기타',
}

const statusLabels: Record<DecisionStatus, string> = {
  planned: '예정',
  applied: '적용',
  ended: '종료',
}

export default function EvaluationHistoryPage({
  adoptionDate,
  evaluations,
  decisions,
  onAddEvaluation,
  onUpdateEvaluation,
  onDeleteEvaluation,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
}: Props) {
  const today = todayISO()

  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const [reportStart, setReportStart] = useState(adoptionDate)
  const [reportEnd, setReportEnd] = useState(today)
  const [evaluationText, setEvaluationText] = useState('')

  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [decisionDate, setDecisionDate] = useState(today)
  const [decisionCategory, setDecisionCategory] =
    useState<DecisionCategory>('feeding')
  const [decisionStatus, setDecisionStatus] =
    useState<DecisionStatus>('applied')
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionDetail, setDecisionDetail] = useState('')
  const [linkedEvaluationId, setLinkedEvaluationId] = useState('')

  const [message, setMessage] = useState('')

  const sortedEvaluations = useMemo(
    () =>
      [...evaluations].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [evaluations],
  )

  const sortedDecisions = useMemo(
    () =>
      [...decisions].sort((a, b) =>
        `${b.date}${b.createdAt}`.localeCompare(
          `${a.date}${a.createdAt}`,
        ),
      ),
    [decisions],
  )

  const appliedCount = decisions.filter(
    (decision) => decision.status === 'applied',
  ).length

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 1800)
  }

  const resetEvaluationForm = () => {
    setEvaluationId(null)
    setReportStart(adoptionDate)
    setReportEnd(today)
    setEvaluationText('')
  }

  const saveEvaluation = () => {
    const text = evaluationText.trim()

    if (!text) {
      flash('평가 내용을 붙여넣어 주세요.')
      return
    }

    if (reportStart > reportEnd) {
      flash('평가 기간을 확인해 주세요.')
      return
    }

    if (evaluationId) {
      const original = evaluations.find(
        (item) => item.id === evaluationId,
      )
      if (!original) return

      onUpdateEvaluation({
        ...original,
        reportStart,
        reportEnd,
        text,
      })
      flash('평가 기록을 수정했어요.')
    } else {
      onAddEvaluation({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        reportStart,
        reportEnd,
        text,
      })
      flash('ChatGPT 평가를 저장했어요.')
    }

    resetEvaluationForm()
  }

  const editEvaluation = (log: EvaluationLog) => {
    setEvaluationId(log.id)
    setReportStart(log.reportStart)
    setReportEnd(log.reportEnd)
    setEvaluationText(log.text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetDecisionForm = () => {
    setDecisionId(null)
    setDecisionDate(today)
    setDecisionCategory('feeding')
    setDecisionStatus('applied')
    setDecisionTitle('')
    setDecisionDetail('')
    setLinkedEvaluationId('')
  }

  const saveDecision = () => {
    const title = decisionTitle.trim()

    if (!title) {
      flash('관리 결정을 한 줄로 적어 주세요.')
      return
    }

    const payload = {
      date: decisionDate,
      category: decisionCategory,
      status: decisionStatus,
      title,
      detail: decisionDetail.trim() || undefined,
      evaluationId: linkedEvaluationId || undefined,
    }

    if (decisionId) {
      const original = decisions.find(
        (item) => item.id === decisionId,
      )
      if (!original) return

      onUpdateDecision({
        ...original,
        ...payload,
      })
      flash('관리 결정을 수정했어요.')
    } else {
      onAddDecision({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...payload,
      })
      flash('관리 결정을 저장했어요.')
    }

    resetDecisionForm()
  }

  const editDecision = (log: ManagementDecision) => {
    setDecisionId(log.id)
    setDecisionDate(log.date)
    setDecisionCategory(log.category)
    setDecisionStatus(log.status)
    setDecisionTitle(log.title)
    setDecisionDetail(log.detail ?? '')
    setLinkedEvaluationId(log.evaluationId ?? '')
  }

  return (
    <div className="evaluation-history-page">
      <div className="evaluation-summary">
        <SummaryBox
          icon="🤖"
          label="저장된 평가"
          value={`${evaluations.length}건`}
        />
        <SummaryBox
          icon="📝"
          label="관리 결정"
          value={`${decisions.length}건`}
        />
        <SummaryBox
          icon="🌿"
          label="현재 적용"
          value={`${appliedCount}건`}
        />
      </div>

      <Card title="ChatGPT 평가 저장" icon="🤖">
        <p className="setting-help">
          보고서로 받은 평가 답변을 그대로 붙여넣어 보관해요.
          관찰 원본과는 분리되며, 다음 보고서에 자동으로 섞이지 않습니다.
        </p>

        <div className="settings-grid evaluation-range">
          <label className="field">
            <span>평가 시작일</span>
            <input
              type="date"
              min={adoptionDate}
              value={reportStart}
              onChange={(event) => setReportStart(event.target.value)}
            />
          </label>

          <label className="field">
            <span>평가 종료일</span>
            <input
              type="date"
              value={reportEnd}
              onChange={(event) => setReportEnd(event.target.value)}
            />
          </label>
        </div>

        <label className="field evaluation-textarea-field">
          <span>평가 내용</span>
          <textarea
            value={evaluationText}
            onChange={(event) => setEvaluationText(event.target.value)}
            placeholder="ChatGPT가 작성한 평가서를 여기에 붙여넣기"
            rows={12}
          />
        </label>

        <div className="history-form-actions">
          {evaluationId && (
            <button
              type="button"
              className="secondary-action"
              onClick={resetEvaluationForm}
            >
              수정 취소
            </button>
          )}
          <button
            type="button"
            className="primary-action history-save-button"
            onClick={saveEvaluation}
          >
            {evaluationId ? '평가 수정 저장' : '평가 저장'}
          </button>
        </div>
      </Card>

      <Card title="실제 관리 결정" icon="📝">
        <p className="setting-help">
          평가에서 무엇을 읽었는지와 별개로, 실제로 내가 무엇을 바꾸거나
          유지했는지를 따로 남겨요. “급여 주기 유지”도 하나의 결정으로 기록할 수 있어요.
        </p>

        <div className="management-form-grid">
          <label className="field">
            <span>결정 날짜</span>
            <input
              type="date"
              value={decisionDate}
              onChange={(event) => setDecisionDate(event.target.value)}
            />
          </label>

          <label className="field">
            <span>분류</span>
            <select
              value={decisionCategory}
              onChange={(event) =>
                setDecisionCategory(
                  event.target.value as DecisionCategory,
                )
              }
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>상태</span>
            <select
              value={decisionStatus}
              onChange={(event) =>
                setDecisionStatus(
                  event.target.value as DecisionStatus,
                )
              }
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>연결 평가</span>
            <select
              value={linkedEvaluationId}
              onChange={(event) =>
                setLinkedEvaluationId(event.target.value)
              }
            >
              <option value="">연결 안 함</option>
              {sortedEvaluations.map((evaluation) => (
                <option key={evaluation.id} value={evaluation.id}>
                  {evaluation.reportStart} ~ {evaluation.reportEnd}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>결정 한 줄</span>
          <input
            value={decisionTitle}
            onChange={(event) => setDecisionTitle(event.target.value)}
            placeholder="예: 현재 2일 간격 급여를 그대로 유지"
            maxLength={120}
          />
        </label>

        <label className="field evaluation-textarea-field">
          <span>이유·메모 (선택)</span>
          <textarea
            value={decisionDetail}
            onChange={(event) => setDecisionDetail(event.target.value)}
            placeholder="예: 체중 데이터가 아직 없어서 섭취 추세를 조금 더 보기로 함."
            rows={4}
          />
        </label>

        <div className="history-form-actions">
          {decisionId && (
            <button
              type="button"
              className="secondary-action"
              onClick={resetDecisionForm}
            >
              수정 취소
            </button>
          )}
          <button
            type="button"
            className="primary-action history-save-button"
            onClick={saveDecision}
          >
            {decisionId ? '결정 수정 저장' : '관리 결정 저장'}
          </button>
        </div>
      </Card>

      <Card title="저장된 평가" icon="📚">
        {sortedEvaluations.length === 0 ? (
          <EmptyHistory
            icon="🤖"
            title="아직 저장한 평가가 없어요."
            text="첫 보고서를 평가받은 뒤 답변을 위 입력창에 붙여넣으면 여기부터 쌓입니다."
          />
        ) : (
          <div className="evaluation-list">
            {sortedEvaluations.map((evaluation) => (
              <article
                className="evaluation-history-item"
                key={evaluation.id}
              >
                <div className="evaluation-history-head">
                  <div>
                    <span>평가 기간</span>
                    <strong>
                      {evaluation.reportStart} ~ {evaluation.reportEnd}
                    </strong>
                  </div>
                  <small>
                    저장 {formatCreatedAt(evaluation.createdAt)}
                  </small>
                </div>

                <details className="evaluation-history-details">
                  <summary>
                    평가 내용 보기
                    <span>{evaluation.text.length.toLocaleString()}자</span>
                  </summary>
                  <pre>{evaluation.text}</pre>
                </details>

                <div className="history-item-actions">
                  <button
                    type="button"
                    onClick={() => editEvaluation(evaluation)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="danger-text"
                    onClick={() => {
                      if (
                        window.confirm(
                          '이 평가 기록을 삭제할까요? 연결된 관리 결정은 남아 있어요.',
                        )
                      ) {
                        onDeleteEvaluation(evaluation.id)
                      }
                    }}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card title="관리 결정 이력" icon="🌿">
        {sortedDecisions.length === 0 ? (
          <EmptyHistory
            icon="📝"
            title="아직 관리 결정이 없어요."
            text="변경뿐 아니라 ‘지금 방식 유지’도 기록해두면 나중에 왜 그렇게 관리했는지 되짚기 쉬워요."
          />
        ) : (
          <div className="decision-list">
            {sortedDecisions.map((decision) => {
              const linkedEvaluation = evaluations.find(
                (evaluation) =>
                  evaluation.id === decision.evaluationId,
              )

              return (
                <article
                  className="decision-history-item"
                  key={decision.id}
                >
                  <div className="decision-history-top">
                    <div className="decision-badges">
                      <span className="decision-category-badge">
                        {categoryLabels[decision.category]}
                      </span>
                      <span
                        className={`decision-status-badge ${decision.status}`}
                      >
                        {statusLabels[decision.status]}
                      </span>
                    </div>
                    <time>{decision.date}</time>
                  </div>

                  <strong className="decision-title">
                    {decision.title}
                  </strong>

                  {decision.detail && (
                    <p className="decision-detail">{decision.detail}</p>
                  )}

                  {linkedEvaluation && (
                    <div className="linked-evaluation">
                      <span>연결 평가</span>
                      <strong>
                        {linkedEvaluation.reportStart} ~{' '}
                        {linkedEvaluation.reportEnd}
                      </strong>
                    </div>
                  )}

                  <div className="history-item-actions">
                    <button
                      type="button"
                      onClick={() => editDecision(decision)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() => {
                        if (
                          window.confirm(
                            '이 관리 결정을 삭제할까요?',
                          )
                        ) {
                          onDeleteDecision(decision.id)
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>

      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  )
}

function SummaryBox({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="evaluation-summary-box">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function EmptyHistory({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <div className="history-empty">
      <span aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

function formatCreatedAt(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
