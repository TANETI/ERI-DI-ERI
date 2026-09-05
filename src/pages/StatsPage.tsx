import { useMemo, useState } from 'react'
import Card from '../components/Card'
import {
  addDays,
  parseISODate,
  todayISO,
  toISODate,
} from '../lib/date'
import {
  feedingAmountLabels,
  formatMl,
} from '../lib/feedingAmount'
import type { FeedingLog, WeightLog } from '../types'

type FeedingMetric = 'qualitative' | 'ml'
type RangeMode = '30' | '90' | 'all'

type Props = {
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
}

type TrendPoint = {
  date: string
  value: number
  label: string
}

type TrendSummary = {
  count: number
  average: number | null
  min: number | null
  max: number | null
  latest: number | null
  deltaFromPrevious: number | null
}

function cutoffDate(days: number) {
  return toISODate(
    addDays(
      parseISODate(todayISO()),
      -(days - 1),
    ),
  )
}

function filterByRange<T extends { date: string }>(
  values: T[],
  range: RangeMode,
): T[] {
  if (range === 'all') return values

  const cutoff = cutoffDate(Number(range))
  return values.filter((value) => value.date >= cutoff)
}

function summarize(points: TrendPoint[]): TrendSummary {
  if (!points.length) {
    return {
      count: 0,
      average: null,
      min: null,
      max: null,
      latest: null,
      deltaFromPrevious: null,
    }
  }

  const values = points.map((point) => point.value)
  const latest = values[values.length - 1]
  const previous =
    values.length >= 2 ? values[values.length - 2] : null

  return {
    count: values.length,
    average:
      values.reduce((sum, value) => sum + value, 0) /
      values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    latest,
    deltaFromPrevious:
      previous === null ? null : latest - previous,
  }
}

function qualitativeText(value: number) {
  const index = Math.max(
    0,
    Math.min(5, Math.round(value)),
  )
  return feedingAmountLabels[index]
}

function rangeLabel(range: RangeMode) {
  if (range === '30') return '최근 30일'
  if (range === '90') return '최근 90일'
  return '전체 기록'
}

function changeText(
  delta: number | null,
  unit: 'step' | 'ml' | 'g',
) {
  if (delta === null) return '비교할 이전 기록 없음'

  if (Math.abs(delta) < 0.0001) {
    return '직전 기록과 같음'
  }

  const sign = delta > 0 ? '+' : ''

  if (unit === 'step') {
    return `직전 대비 ${sign}${delta.toFixed(0)}단계`
  }

  if (unit === 'ml') {
    return `직전 대비 ${sign}${formatMl(delta)} mL`
  }

  return `직전 대비 ${sign}${delta.toFixed(2)} g`
}

export default function StatsPage({
  feedingLogs,
  weightLogs,
}: Props) {
  const [feedingMetric, setFeedingMetric] =
    useState<FeedingMetric>('qualitative')
  const [range, setRange] = useState<RangeMode>('30')

  const qualitativeCount = useMemo(
    () =>
      filterByRange(feedingLogs, range).filter(
        (log) => log.amount !== null,
      ).length,
    [feedingLogs, range],
  )

  const mlCount = useMemo(
    () =>
      filterByRange(feedingLogs, range).filter(
        (log) =>
          typeof log.amountMl === 'number' &&
          Number.isFinite(log.amountMl),
      ).length,
    [feedingLogs, range],
  )

  const feedingPoints = useMemo<TrendPoint[]>(() => {
    const sorted = filterByRange(
      [...feedingLogs].sort((a, b) =>
        `${a.date}${a.time ?? ''}`.localeCompare(
          `${b.date}${b.time ?? ''}`,
        ),
      ),
      range,
    )

    if (feedingMetric === 'qualitative') {
      return sorted.flatMap((log) =>
        log.amount === null
          ? []
          : [
              {
                date: log.date,
                value: Number(log.amount),
                label: feedingAmountLabels[log.amount],
              },
            ],
      )
    }

    return sorted.flatMap((log) =>
      typeof log.amountMl === 'number' &&
      Number.isFinite(log.amountMl)
        ? [
            {
              date: log.date,
              value: log.amountMl,
              label: `${formatMl(log.amountMl)} mL`,
            },
          ]
        : [],
    )
  }, [feedingLogs, feedingMetric, range])

  const weightPoints = useMemo<TrendPoint[]>(
    () =>
      filterByRange(
        [...weightLogs].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        range,
      ).map((log) => ({
        date: log.date,
        value: log.weight,
        label: `${log.weight.toFixed(1)} g`,
      })),
    [weightLogs, range],
  )

  const feedingSummary = summarize(feedingPoints)
  const weightSummary = summarize(weightPoints)

  const feedingAverageText =
    feedingSummary.average === null
      ? '—'
      : feedingMetric === 'qualitative'
        ? `${qualitativeText(feedingSummary.average)}권 · ${feedingSummary.average.toFixed(2)}/5`
        : `${formatMl(feedingSummary.average)} mL`

  const feedingRangeText =
    feedingSummary.min === null ||
    feedingSummary.max === null
      ? '—'
      : feedingMetric === 'qualitative'
        ? `${qualitativeText(feedingSummary.min)} ~ ${qualitativeText(feedingSummary.max)}`
        : `${formatMl(feedingSummary.min)} ~ ${formatMl(feedingSummary.max)} mL`

  return (
    <div className="stats-page">
      <section className="stats-page-head">
        <div>
          <span>성장 기록</span>
          <strong>{rangeLabel(range)}</strong>
        </div>

        <RangeToggle
          range={range}
          onChange={setRange}
        />
      </section>

      <Card title="급여량 추세" icon="🍚">
        <div className="stats-card-topline">
          <div
            className="feeding-metric-toggle"
            role="group"
            aria-label="급여량 추세 단위"
          >
            <button
              type="button"
              className={
                feedingMetric === 'qualitative'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFeedingMetric('qualitative')
              }
            >
              체감 단계
              <small>{qualitativeCount}</small>
            </button>

            <button
              type="button"
              className={
                feedingMetric === 'ml'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFeedingMetric('ml')
              }
            >
              mL
              <small>{mlCount}</small>
            </button>
          </div>

          <span className="stats-context">
            {rangeLabel(range)}
          </span>
        </div>

        <p className="stats-help">
          평소에는 ‘소량/보통/많이’ 추세를 보고,
          실제 양을 재기 시작하면 같은 자리에서 mL로 바꿔 볼 수 있어요.
        </p>

        {feedingPoints.length ? (
          <>
            <div className="stats-feature">
              <div>
                <span>최근 급여</span>
                <strong>
                  {feedingSummary.latest === null
                    ? '—'
                    : feedingMetric === 'qualitative'
                      ? qualitativeText(feedingSummary.latest)
                      : `${formatMl(feedingSummary.latest)} mL`}
                </strong>
              </div>

              <div className="stats-feature-meta">
                <span>
                  평균 <strong>{feedingAverageText}</strong>
                </span>
                <span>
                  {changeText(
                    feedingSummary.deltaFromPrevious,
                    feedingMetric === 'qualitative'
                      ? 'step'
                      : 'ml',
                  )}
                </span>
              </div>
            </div>

            <TrendChart
              points={feedingPoints}
              minY={0}
              maxY={
                feedingMetric === 'qualitative'
                  ? 5
                  : undefined
              }
              unit={
                feedingMetric === 'qualitative'
                  ? '단계'
                  : 'mL'
              }
              referenceValue={
                feedingMetric === 'qualitative'
                  ? 3
                  : undefined
              }
              referenceLabel={
                feedingMetric === 'qualitative'
                  ? '보통'
                  : undefined
              }
            />

            <div className="stats-summary-grid stats-summary-grid-three">
              <StatBox
                label="기록"
                value={`${feedingSummary.count}회`}
              />
              <StatBox
                label="평균"
                value={feedingAverageText}
              />
              <StatBox
                label="범위"
                value={feedingRangeText}
              />
            </div>
          </>
        ) : (
          <div className="stats-empty">
            <span aria-hidden="true">
              {feedingMetric === 'qualitative'
                ? '🍚'
                : '🥄'}
            </span>
            <strong>
              {feedingMetric === 'qualitative'
                ? '이 기간에는 체감 단계 기록이 없어요.'
                : '아직 mL 기록이 없어요.'}
            </strong>
            <p>
              {feedingMetric === 'qualitative'
                ? '급여 기록을 남기면 소량·보통·많이의 흐름이 여기에 표시됩니다.'
                : '나중에 실제 급여량을 재기 시작하면 같은 그래프로 mL 추세를 볼 수 있어요.'}
            </p>
          </div>
        )}
      </Card>

      <Card title="체중 성장" icon="⚖️">
        {weightPoints.length ? (
          <>
            <div className="stats-feature">
              <div>
                <span>최근 체중</span>
                <strong>
                  {weightSummary.latest === null
                    ? '—'
                    : `${weightSummary.latest.toFixed(1)} g`}
                </strong>
              </div>

              <div className="stats-feature-meta">
                <span>
                  평균{' '}
                  <strong>
                    {weightSummary.average === null
                      ? '—'
                      : `${weightSummary.average.toFixed(2)} g`}
                  </strong>
                </span>
                <span>
                  {changeText(
                    weightSummary.deltaFromPrevious,
                    'g',
                  )}
                </span>
              </div>
            </div>

            <TrendChart
              points={weightPoints}
              unit="g"
            />

            <div className="stats-summary-grid stats-summary-grid-three">
              <StatBox
                label="측정"
                value={`${weightSummary.count}회`}
              />
              <StatBox
                label="최저"
                value={
                  weightSummary.min === null
                    ? '—'
                    : `${weightSummary.min.toFixed(1)} g`
                }
              />
              <StatBox
                label="최고"
                value={
                  weightSummary.max === null
                    ? '—'
                    : `${weightSummary.max.toFixed(1)} g`
                }
              />
            </div>
          </>
        ) : (
          <div className="stats-empty">
            <span aria-hidden="true">⚖️</span>
            <strong>아직 첫 체중 기록이 없어요.</strong>
            <p>
              첫 측정에 성공하면 이 카드에서 에리의 성장선을
              바로 확인할 수 있어요.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

function RangeToggle({
  range,
  onChange,
}: {
  range: RangeMode
  onChange: (range: RangeMode) => void
}) {
  return (
    <div
      className="stats-range-toggle"
      role="group"
      aria-label="통계 기간"
    >
      {(
        [
          ['30', '30일'],
          ['90', '90일'],
          ['all', '전체'],
        ] as const
      ).map(([value, label]) => (
        <button
          type="button"
          key={value}
          className={
            range === value ? 'active' : ''
          }
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function StatBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="stats-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TrendChart({
  points,
  minY,
  maxY,
  unit,
  referenceValue,
  referenceLabel,
}: {
  points: TrendPoint[]
  minY?: number
  maxY?: number
  unit: string
  referenceValue?: number
  referenceLabel?: string
}) {
  const width = 620
  const height = 224
  const left = 42
  const right = 18
  const top = 18
  const bottom = 38
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const values = points.map(
    (point) => point.value,
  )
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)

  const yMin =
    minY ??
    (rawMin === rawMax
      ? Math.max(0, rawMin * 0.9)
      : Math.max(
          0,
          rawMin -
            (rawMax - rawMin) * 0.12,
        ))

  const yMax =
    maxY ??
    (rawMin === rawMax
      ? rawMax === 0
        ? 1
        : rawMax * 1.1
      : rawMax +
        (rawMax - rawMin) * 0.12)

  const dates = points.map((point) =>
    new Date(
      `${point.date}T00:00:00`,
    ).getTime(),
  )
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)

  const xFor = (time: number) => {
    if (
      points.length === 1 ||
      minDate === maxDate
    ) {
      return left + chartWidth / 2
    }

    return (
      left +
      ((time - minDate) /
        (maxDate - minDate)) *
        chartWidth
    )
  }

  const yFor = (value: number) => {
    if (yMax === yMin) {
      return top + chartHeight / 2
    }

    return (
      top +
      ((yMax - value) /
        (yMax - yMin)) *
        chartHeight
    )
  }

  const coords = points.map(
    (point, index) => ({
      ...point,
      x: xFor(dates[index]),
      y: yFor(point.value),
    }),
  )

  const path = coords
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]

  const referenceY =
    referenceValue !== undefined &&
    referenceValue >= yMin &&
    referenceValue <= yMax
      ? yFor(referenceValue)
      : null

  return (
    <div className="trend-chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${unit} 추세 그래프`}
      >
        {[0, 0.5, 1].map((ratio) => {
          const y =
            top + chartHeight * ratio
          const value =
            yMax -
            (yMax - yMin) * ratio

          return (
            <g key={ratio}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                className="trend-grid-line"
              />
              <text
                x={left - 7}
                y={y + 4}
                className="trend-axis-label"
                textAnchor="end"
              >
                {unit === '단계'
                  ? value.toFixed(0)
                  : value.toFixed(2)}
              </text>
            </g>
          )
        })}

        {referenceY !== null && (
          <g>
            <line
              x1={left}
              x2={width - right}
              y1={referenceY}
              y2={referenceY}
              className="trend-reference-line"
            />
            {referenceLabel && (
              <text
                x={width - right}
                y={referenceY - 6}
                className="trend-reference-label"
                textAnchor="end"
              >
                {referenceLabel}
              </text>
            )}
          </g>
        )}

        {coords.length > 1 && (
          <path
            d={path}
            fill="none"
            className="trend-line"
          />
        )}

        {coords.map(
          (point, index) => (
            <g
              key={`${point.date}-${point.value}-${index}`}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="trend-dot"
              />
              <title>
                {point.date} · {point.label}
              </title>
            </g>
          ),
        )}

        <text
          x={left}
          y={height - 11}
          className="trend-date-label"
          textAnchor="start"
        >
          {shortDate(first.date)}
        </text>

        <text
          x={width - right}
          y={height - 11}
          className="trend-date-label"
          textAnchor="end"
        >
          {shortDate(last.date)}
        </text>
      </svg>
    </div>
  )
}

function shortDate(date: string) {
  const [, month, day] =
    date.split('-')
  return `${Number(month)}/${Number(day)}`
}
