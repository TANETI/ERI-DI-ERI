import { useMemo, useState } from 'react'
import Card from '../components/Card'
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
  const date = new Date()
  date.setDate(date.getDate() - (days - 1))
  return date.toISOString().slice(0, 10)
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

export default function StatsPage({
  feedingLogs,
  weightLogs,
}: Props) {
  const [feedingMetric, setFeedingMetric] =
    useState<FeedingMetric>('qualitative')
  const [range, setRange] = useState<RangeMode>('30')

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

  const feedingFormatter =
    feedingMetric === 'qualitative'
      ? (value: number) => `${value.toFixed(2)} / 5`
      : (value: number) => `${formatMl(value)} mL`

  return (
    <>
      <Card title="급여량 추세" icon="🍚">
        <div className="stats-toolbar">
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
            </button>
            <button
              type="button"
              className={
                feedingMetric === 'ml' ? 'active' : ''
              }
              onClick={() => setFeedingMetric('ml')}
            >
              mL
            </button>
          </div>

          <RangeToggle
            range={range}
            onChange={setRange}
          />
        </div>

        <p className="stats-help">
          기본은 ‘보통/많이’ 같은 체감 단계예요.
          mL로 기록한 급여가 생기면 같은 방식으로 mL
          추세도 계산됩니다.
        </p>

        {feedingPoints.length ? (
          <>
            <TrendChart
              points={feedingPoints}
              minY={
                feedingMetric === 'qualitative'
                  ? 0
                  : 0
              }
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
            />

            <div className="stats-summary-grid">
              <StatBox
                label="기록 수"
                value={`${feedingSummary.count}회`}
              />
              <StatBox
                label="평균"
                value={
                  feedingSummary.average === null
                    ? '—'
                    : feedingFormatter(
                        feedingSummary.average,
                      )
                }
              />
              <StatBox
                label="최근"
                value={
                  feedingSummary.latest === null
                    ? '—'
                    : feedingMetric === 'qualitative'
                      ? `${qualitativeText(feedingSummary.latest)} · ${feedingSummary.latest}/5`
                      : `${formatMl(feedingSummary.latest)} mL`
                }
              />
              <StatBox
                label="직전 대비"
                value={
                  feedingSummary.deltaFromPrevious === null
                    ? '—'
                    : `${feedingSummary.deltaFromPrevious >= 0 ? '+' : ''}${
                        feedingMetric === 'qualitative'
                          ? feedingSummary.deltaFromPrevious.toFixed(0)
                          : formatMl(
                              feedingSummary.deltaFromPrevious,
                            )
                      }${feedingMetric === 'ml' ? ' mL' : ''}`
                }
              />
            </div>
          </>
        ) : (
          <div className="stats-empty">
            {feedingMetric === 'qualitative'
              ? '선택한 기간에 체감 단계 급여 기록이 없어요.'
              : '아직 mL로 기록한 급여가 없어요. 나중에 실제 양을 재기 시작하면 여기에 같은 방식으로 추세가 생깁니다.'}
          </div>
        )}
      </Card>

      <Card title="체중 성장" icon="⚖️">
        <div className="stats-toolbar stats-toolbar-right">
          <RangeToggle
            range={range}
            onChange={setRange}
          />
        </div>

        {weightPoints.length ? (
          <>
            <TrendChart
              points={weightPoints}
              unit="g"
            />

            <div className="stats-summary-grid">
              <StatBox
                label="측정 수"
                value={`${weightSummary.count}회`}
              />
              <StatBox
                label="평균"
                value={
                  weightSummary.average === null
                    ? '—'
                    : `${weightSummary.average.toFixed(2)} g`
                }
              />
              <StatBox
                label="최근"
                value={
                  weightSummary.latest === null
                    ? '—'
                    : `${weightSummary.latest.toFixed(1)} g`
                }
              />
              <StatBox
                label="직전 대비"
                value={
                  weightSummary.deltaFromPrevious === null
                    ? '—'
                    : `${weightSummary.deltaFromPrevious >= 0 ? '+' : ''}${weightSummary.deltaFromPrevious.toFixed(2)} g`
                }
              />
            </div>
          </>
        ) : (
          <div className="stats-empty">
            아직 체중 기록이 없어요. 첫 측정에 성공하면
            성장 그래프가 여기서 시작됩니다.
          </div>
        )}
      </Card>
    </>
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
          className={range === value ? 'active' : ''}
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
}: {
  points: TrendPoint[]
  minY?: number
  maxY?: number
  unit: string
}) {
  const width = 620
  const height = 230
  const left = 42
  const right = 18
  const top = 20
  const bottom = 40
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const values = points.map((point) => point.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)

  const yMin =
    minY ??
    (rawMin === rawMax
      ? Math.max(0, rawMin * 0.9)
      : Math.max(0, rawMin - (rawMax - rawMin) * 0.12))

  const yMax =
    maxY ??
    (rawMin === rawMax
      ? rawMax === 0
        ? 1
        : rawMax * 1.1
      : rawMax + (rawMax - rawMin) * 0.12)

  const dates = points.map((point) =>
    new Date(`${point.date}T00:00:00`).getTime(),
  )
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)

  const xFor = (time: number, index: number) => {
    if (points.length === 1 || minDate === maxDate) {
      return left + chartWidth / 2
    }

    return (
      left +
      ((time - minDate) / (maxDate - minDate)) *
        chartWidth
    )
  }

  const yFor = (value: number) => {
    if (yMax === yMin) return top + chartHeight / 2

    return (
      top +
      ((yMax - value) / (yMax - yMin)) *
        chartHeight
    )
  }

  const coords = points.map((point, index) => ({
    ...point,
    x: xFor(dates[index], index),
    y: yFor(point.value),
  }))

  const path = coords
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <div className="trend-chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${unit} 추세 그래프`}
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = top + chartHeight * ratio
          const value =
            yMax - (yMax - yMin) * ratio

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
                  ? value.toFixed(1)
                  : value.toFixed(2)}
              </text>
            </g>
          )
        })}

        {coords.length > 1 && (
          <path
            d={path}
            fill="none"
            className="trend-line"
          />
        )}

        {coords.map((point, index) => (
          <g key={`${point.date}-${point.value}-${index}`}>
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
        ))}

        <text
          x={left}
          y={height - 12}
          className="trend-date-label"
          textAnchor="start"
        >
          {shortDate(first.date)}
        </text>

        <text
          x={width - right}
          y={height - 12}
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
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}
