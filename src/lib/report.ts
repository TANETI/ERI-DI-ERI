import { addDays, diffDays, isScheduledDay, parseISODate, toISODate } from './date'
import { getMatchedFeedingLog } from './feeding'
import type {
  AppSettings,
  DefecationLog,
  EnvironmentLog,
  FeedingLog,
  PresetSelection,
  TmiLog,
  WeightLog,
} from '../types'

export type ReportSource = {
  settings: AppSettings
  feedingLogs: FeedingLog[]
  weightLogs: WeightLog[]
  tmiLogs: TmiLog[]
  presetSelections: PresetSelection[]
  environmentLogs: EnvironmentLog[]
  defecationLogs: DefecationLog[]
}

export type ReportResult = {
  markdown: string
  chatgptPackage: string
  json: Record<string, unknown>
}

const amountLabels = ['안 먹음', '맛만 봄', '소량', '보통', '많이', '거의 다 먹음']

function inRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate
}

function datesBetween(startDate: string, endDate: string): string[] {
  const result: string[] = []
  let cursor = parseISODate(startDate)
  const end = parseISODate(endDate)

  while (cursor.getTime() <= end.getTime()) {
    result.push(toISODate(cursor))
    cursor = addDays(cursor, 1)
  }

  return result
}

function avg(values: number[]) {
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function minMax(values: number[]) {
  if (!values.length) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}

function countBy<T>(values: T[], getKey: (value: T) => string) {
  const map = new Map<string, number>()
  values.forEach((value) => {
    const key = getKey(value)
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function fixed(value: number, digits = 2) {
  return Number(value.toFixed(digits))
}

function formatFeeding(log: FeedingLog) {
  const amount = log.amount === null ? '섭취량 미기록' : amountLabels[log.amount]
  return `${log.date}${log.time ? ` ${log.time}` : ''} · ${log.food} · ${amount}${log.memo ? ` · ${log.memo}` : ''}`
}

function reportInstruction() {
  return `아래 자료는 크레스티드 게코 ‘에리’의 사육 관찰 기록이다.

제공된 기록에 근거하여 급여 주기, 실제 섭취량, 체중 변화, 배변, 행동 및 사육환경의 장기 추세를 평가하라.

개별 날짜의 특이행동이나 단일 측정치를 과도하게 해석하지 말고 전체 기간의 패턴을 우선하라.

관찰된 사실과 추론을 명확하게 구분하라.

데이터가 충분하지 않은 경우 추측하지 말고 ‘판단하기에 자료가 부족함’이라고 표시하라.

질병을 확정 진단하지 말 것. 수의학적 평가가 필요한 위험 신호가 있다면 어떤 기록을 근거로 판단했는지 명확하게 설명하라.

급여량이나 급여 주기 변경을 제안할 경우 현재 체중 변화와 실제 섭취 패턴을 함께 고려하라.

급격한 변경보다 보수적인 조정을 우선하라.

TMI와 행동 기록도 참고하되 정상적인 크레스티드 게코 행동을 병적 행동으로 과잉 해석하지 말 것.

현재 보고서는 로컬 프로토타입의 현행 스케줄 설정을 기준으로 예정일을 계산한다. 과거 급여 정책 변경 이력이 아직 연결되지 않았다면 그 한계를 고려하라.`
}

function answerTemplate() {
  return `# 🦎 에리 사육 기록 평가서

## A. 전체 평가
전반 상태: [안정적 / 관찰 필요 / 관리 조정 고려 / 진료 고려]
자료 신뢰도: [높음 / 보통 / 낮음]
전체 요약:

## B. 급여 주기
현재 급여 주기:
평가: [유지 / 간격 증가 고려 / 간격 감소 고려 / 판단 보류]
근거:
권장 변경이 있다면:
판단 신뢰도:

## C. 급여량과 섭취
평가: [현재 적절 / 증가 고려 / 감소 고려 / 판단 보류]
섭취 경향:
관찰 사항:
권장안:
판단 신뢰도:

## D. 체중과 성장
시작 체중:
종료 체중:
총 변화:
변화율:
주당 평균 변화:
추세: [증가 / 유지 / 감소 / 변동 큼]
평가:
판단 신뢰도:

## E. 배변
빈도:
형태:
급여와의 관련성:
특이사항:

## F. 환경
온도:
습도:
측정 빈도:
장기간 경향:
조정 필요 여부:

## G. 행동 및 TMI
반복적으로 나타난 행동:
새로 나타난 행동:
정상 행동 범위로 보이는 것:
추가로 관찰할 가치가 있는 것:

## H. 주의가 필요한 변화
현재 특별히 주의할 항목: [없음 / 있음]
있다면:
1.
2.
3.

## I. 다음 기간 관리 계획
급여:
체중 측정:
환경:
추가로 관찰하면 좋은 항목:
다음 평가 권장 시점:`
}

export function buildReport(
  startDate: string,
  endDate: string,
  source: ReportSource,
): ReportResult {
  const {
    settings,
    feedingLogs,
    weightLogs,
    tmiLogs,
    presetSelections,
    environmentLogs,
    defecationLogs,
  } = source

  if (startDate > endDate) {
    throw new Error('시작일은 종료일보다 늦을 수 없습니다.')
  }

  const rangeDates = datesBetween(startDate, endDate)

  const scheduledFeedDates = rangeDates.filter((date) =>
    isScheduledDay(date, settings.feedingStartDate, settings.feedingIntervalDays),
  )
  const matchedFeedings = scheduledFeedDates
    .map((date) => ({ date, log: getMatchedFeedingLog(date, feedingLogs, settings) }))
  const completedScheduledFeedings = matchedFeedings.filter((item) => item.log)

  const feedLogsInRange = feedingLogs
    .filter((log) => inRange(log.date, startDate, endDate))
    .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))

  const amountCounts = countBy(
    feedLogsInRange.filter((log) => log.amount !== null),
    (log) => amountLabels[log.amount!],
  )

  const recordedAmounts: number[] = feedLogsInRange.flatMap((log) =>
    log.amount === null ? [] : [Number(log.amount)],
  )

  const weights = weightLogs
    .filter((log) => inRange(log.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date))

  const weightStart = weights[0]
  const weightEnd = weights[weights.length - 1]
  const weightDelta =
    weightStart && weightEnd ? weightEnd.weight - weightStart.weight : null
  const weightPercent =
    weightStart && weightEnd && weightStart.weight > 0
      ? (weightDelta! / weightStart.weight) * 100
      : null

  let weeklyWeightChange: number | null = null
  if (weightStart && weightEnd && weightStart.date !== weightEnd.date) {
    const days = diffDays(weightStart.date, weightEnd.date)
    if (days > 0) weeklyWeightChange = (weightDelta! / days) * 7
  }

  const environments = environmentLogs.filter((log) =>
    inRange(log.date, startDate, endDate),
  )
  const temperatures = environments
    .map((log) => log.temperature)
    .filter((value): value is number => value !== undefined)
  const humidities = environments
    .map((log) => log.humidity)
    .filter((value): value is number => value !== undefined)

  const tempRange = minMax(temperatures)
  const humidityRange = minMax(humidities)

  const poops = defecationLogs.filter((log) =>
    inRange(log.date, startDate, endDate),
  )
  const poopCounts = countBy(poops, (log) => log.status ?? '미분류')

  const presets = presetSelections.filter((log) =>
    inRange(log.date, startDate, endDate),
  )
  const presetCounts = countBy(presets, (log) => log.label)

  const tmis = tmiLogs
    .filter((log) => inRange(log.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date))

  const observedEnvDays = new Set(environments.map((log) => log.date)).size
  const totalDays = rangeDates.length

  const lines: string[] = []
  lines.push('# ERI DI-ERY 관찰 보고서')
  lines.push('')
  lines.push(`- 대상: 에리`)
  lines.push(`- 종: Crested Gecko (*Correlophus ciliatus*)`)
  lines.push(`- 기간: ${startDate} ~ ${endDate}`)
  lines.push(`- 입양일: ${settings.adoptionDate}`)
  lines.push(`- 기간 길이: ${totalDays}일`)
  lines.push('')

  lines.push('## 1. 급여')
  lines.push('')
  lines.push(`- 현재 설정 기준: ${settings.feedingIntervalDays}일마다 / 기본 ${settings.feedingTime}`)
  lines.push(`- 다음 날 새벽 인정 마감: ${String(settings.feedingGraceUntilHour).padStart(2, '0')}:00`)
  lines.push(`- 예정 회차: ${scheduledFeedDates.length}회`)
  lines.push(`- 완료 회차: ${completedScheduledFeedings.length}회`)
  lines.push(`- 미완료 회차: ${scheduledFeedDates.length - completedScheduledFeedings.length}회`)
  lines.push(`- 기간 내 실제 급여 기록: ${feedLogsInRange.length}건`)
  lines.push(
    `- 평균 섭취 점수: ${
      recordedAmounts.length ? `${fixed(avg(recordedAmounts)!, 2)} / 5` : '자료 부족'
    }`,
  )

  if (amountCounts.length) {
    lines.push('- 섭취량 분포:')
    amountCounts.forEach(([label, count]) => lines.push(`  - ${label}: ${count}회`))
  }

  if (matchedFeedings.length) {
    lines.push('- 회차별 기록:')
    matchedFeedings.forEach(({ date, log }) => {
      lines.push(
        `  - ${date}: ${
          log
            ? `완료 → ${log.date}${log.time ? ` ${log.time}` : ''}, ${log.food}, ${log.amount === null ? '섭취량 미기록' : amountLabels[log.amount]}`
            : '미완료'
        }`,
      )
    })
  }

  lines.push('')
  lines.push('## 2. 체중')
  lines.push('')
  if (!weights.length) {
    lines.push('- 기간 내 체중 기록 없음')
  } else {
    lines.push(`- 측정 횟수: ${weights.length}회`)
    lines.push(`- 시작 체중: ${weightStart!.weight} g (${weightStart!.date})`)
    lines.push(`- 종료 체중: ${weightEnd!.weight} g (${weightEnd!.date})`)
    lines.push(`- 총 변화: ${weightDelta! >= 0 ? '+' : ''}${fixed(weightDelta!, 2)} g`)
    lines.push(
      `- 변화율: ${
        weightPercent === null ? '계산 불가' : `${weightPercent >= 0 ? '+' : ''}${fixed(weightPercent, 2)}%`
      }`,
    )
    lines.push(
      `- 주당 평균 변화: ${
        weeklyWeightChange === null
          ? '자료 부족'
          : `${weeklyWeightChange >= 0 ? '+' : ''}${fixed(weeklyWeightChange, 3)} g/주`
      }`,
    )
    lines.push('- 전체 측정값:')
    weights.forEach((log) => lines.push(`  - ${log.date}: ${log.weight} g${log.memo ? ` · ${log.memo}` : ''}`))
  }

  lines.push('')
  lines.push('## 3. 배변')
  lines.push('')
  lines.push(`- 기록 횟수: ${poops.length}회`)
  poopCounts.forEach(([status, count]) => lines.push(`  - ${status}: ${count}회`))
  poops
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((log) => {
      lines.push(`  - ${log.date}: ${log.status ?? '미분류'}${log.memo ? ` · ${log.memo}` : ''}`)
    })

  lines.push('')
  lines.push('## 4. 환경')
  lines.push('')
  lines.push(`- 환경 기록: ${environments.length}건 / ${observedEnvDays}일`)
  if (temperatures.length) {
    lines.push(
      `- 온도: 평균 ${fixed(avg(temperatures)!, 1)}℃ / 범위 ${tempRange!.min}~${tempRange!.max}℃`,
    )
  } else {
    lines.push('- 온도: 기록 없음')
  }
  if (humidities.length) {
    lines.push(
      `- 습도: 평균 ${fixed(avg(humidities)!, 1)}% / 범위 ${humidityRange!.min}~${humidityRange!.max}%`,
    )
  } else {
    lines.push('- 습도: 기록 없음')
  }
  if (observedEnvDays < Math.max(1, Math.ceil(totalDays * 0.5))) {
    lines.push(
      `- 자료 제한: 환경 기록이 ${totalDays}일 중 ${observedEnvDays}일만 있어 전체 기간의 일중 환경 변화를 대표하지 않을 수 있음.`,
    )
  }

  lines.push('')
  lines.push('## 5. 행동 프리셋')
  lines.push('')
  if (!presetCounts.length) {
    lines.push('- 기록 없음')
  } else {
    presetCounts.forEach(([label, count]) => lines.push(`- ${label}: ${count}회`))
  }

  lines.push('')
  lines.push('## 6. TMI / 생활일기')
  lines.push('')
  if (!tmis.length) {
    lines.push('- 기록 없음')
  } else {
    tmis.forEach((log) => lines.push(`- ${log.date}: ${log.text}`))
  }

  lines.push('')
  lines.push('## 7. 날짜별 상세 기록')
  lines.push('')

  rangeDates.forEach((date) => {
    const feeds = feedLogsInRange.filter((log) => log.date === date)
    const dayWeights = weights.filter((log) => log.date === date)
    const dayPoops = poops.filter((log) => log.date === date)
    const dayEnv = environments.filter((log) => log.date === date)
    const dayPresets = presets.filter((log) => log.date === date)
    const dayTmis = tmis.filter((log) => log.date === date)
    const scheduled = isScheduledDay(date, settings.feedingStartDate, settings.feedingIntervalDays)

    const hasAny =
      feeds.length ||
      dayWeights.length ||
      dayPoops.length ||
      dayEnv.length ||
      dayPresets.length ||
      dayTmis.length ||
      scheduled

    if (!hasAny) return

    lines.push(`### ${date}`)
    if (scheduled) {
      const matched = getMatchedFeedingLog(date, feedingLogs, settings)
      lines.push(
        `- 급여 회차: ${
          matched
            ? `완료 (${matched.date}${matched.time ? ` ${matched.time}` : ''})`
            : '예정 / 실제 완료 기록 없음'
        }`,
      )
    }
    feeds.forEach((log) => lines.push(`- 실제 급여: ${formatFeeding(log)}`))
    dayWeights.forEach((log) => lines.push(`- 체중: ${log.weight} g${log.memo ? ` · ${log.memo}` : ''}`))
    dayPoops.forEach((log) => lines.push(`- 배변: ${log.status ?? '미분류'}${log.memo ? ` · ${log.memo}` : ''}`))
    dayEnv.forEach((log) => {
      lines.push(
        `- 환경: ${log.temperature !== undefined ? `${log.temperature}℃` : '온도 미기록'} / ${
          log.humidity !== undefined ? `${log.humidity}%` : '습도 미기록'
        }${log.memo ? ` · ${log.memo}` : ''}`,
      )
    })
    if (dayPresets.length) {
      lines.push(`- 관찰 프리셋: ${dayPresets.map((log) => log.label).join(', ')}`)
    }
    dayTmis.forEach((log) => lines.push(`- TMI: ${log.text}`))
    lines.push('')
  })

  const markdown = lines.join('\n')
  const instruction = reportInstruction()
  const template = answerTemplate()

  const chatgptPackage = `${instruction}

---

${markdown}

---

아래 양식에 맞춰 답변하라.

${template}`

  const json = {
    generatedAt: new Date().toISOString(),
    range: { startDate, endDate },
    pet: {
      name: '에리',
      species: 'Crested Gecko',
      scientificName: 'Correlophus ciliatus',
      adoptionDate: settings.adoptionDate,
    },
    currentSettings: settings,
    summary: {
      scheduledFeedingCount: scheduledFeedDates.length,
      completedScheduledFeedingCount: completedScheduledFeedings.length,
      actualFeedingLogCount: feedLogsInRange.length,
      weightLogCount: weights.length,
      defecationLogCount: poops.length,
      environmentLogCount: environments.length,
      tmiCount: tmis.length,
      presetCount: presets.length,
    },
    feedingLogs: feedLogsInRange,
    weightLogs: weights,
    defecationLogs: poops,
    environmentLogs: environments,
    presetSelections: presets,
    tmiLogs: tmis,
  }

  return { markdown, chatgptPackage, json }
}
