import type { FeedingLog } from '../types'

export const feedingAmountLabels = [
  '안 먹음',
  '맛만 봄',
  '소량',
  '보통',
  '많이',
  '거의 다 먹음',
] as const

export function feedingAmountText(log: FeedingLog): string {
  const parts: string[] = []

  if (log.amount !== null) {
    parts.push(feedingAmountLabels[log.amount])
  }

  if (
    typeof log.amountMl === 'number' &&
    Number.isFinite(log.amountMl)
  ) {
    parts.push(`${formatMl(log.amountMl)} mL`)
  }

  return parts.length ? parts.join(' · ') : '섭취량 미기록'
}

export function formatMl(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)))
}
