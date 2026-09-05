import type {
  DefecationLog,
  EnvironmentLog,
  FeedingLog,
  PresetSelection,
  TmiLog,
} from '../types'

/**
 * 2026-08-30 ~ 2026-09-05 사이 대화에서 사용자가 직접 말한 내용 중
 * 날짜를 자신 있게 연결할 수 있는 것만 초기 기록으로 넣는다.
 *
 * TMI 문체는 딱딱한 관찰 기록이 아니라,
 * 짧은 그림일기처럼 자연스럽고 귀엽게 남긴다.
 */
export const seedFeedingLogs: FeedingLog[] = [
  {
    id: 'seed-feed-2026-09-01-0200',
    date: '2026-09-01',
    time: '02:00',
    food: 'G-REP Insect',
    amount: null,
    memo: '8/31 급여 예정분을 자정을 넘겨 실제로 9/1 새벽 2시에 급여. 실제 섭취량은 당시 별도 기록하지 않음.',
  },
  {
    id: 'seed-feed-2026-09-03-0300',
    date: '2026-09-03',
    time: '03:00',
    food: 'G-REP Insect',
    amount: null,
    memo: '9/2 급여 예정분을 자정을 넘겨 실제로 9/3 새벽 3시에 급여. 실제 섭취량은 당시 별도 기록하지 않음.',
  },
  {
    id: 'seed-feed-2026-09-04-2300',
    date: '2026-09-04',
    time: '23:00',
    food: 'G-REP Insect',
    amount: null,
    memo: '9/4 밤 11시에 실제 급여. 실제 섭취량은 당시 별도 기록하지 않음.',
  },
]

export const seedTmiLogs: TmiLog[] = [
  {
    id: 'seed-tmi-2026-08-30-arrival',
    date: '2026-08-30',
    text: '오늘은 에리를 처음 집에 데려왔다. 분양사분이 내 손에 한 번 올려주셨다. 아직은 내가 직접 만져보지는 못했지만, 드디어 우리 집에 왔다니 신기하고 귀여웠다.',
  },
  {
    id: 'seed-tmi-2026-08-30-light',
    date: '2026-08-30',
    text: '오늘은 에리 집을 창가 쪽 높은 선반에 두었다. 불은 꺼두고 간접 자연광만 들어오게 했다. 직사광선은 조심해야겠다.',
  },
  {
    id: 'seed-tmi-2026-09-02-observe',
    date: '2026-09-02',
    text: '오늘은 에리가 은신처 건너편으로 나와서 눈을 똘망똘망 뜨고 세상을 구경했다. 가만히 주변을 보는 모습이 참 귀여웠다.',
  },
  {
    id: 'seed-tmi-2026-09-04-humidity',
    date: '2026-09-04',
    text: '오늘은 습도가 너무 높아서 에어컨 제습을 틀었다. 습도가 내려가는 동안 에리가 옆으로 조금 움직였다. 별일 아닌데도 자꾸 보게 된다.',
  },
  {
    id: 'seed-tmi-2026-09-05-weigh',
    date: '2026-09-05',
    text: '오늘은 에리 몸무게를 재보려고 사육장 입구에 원통형 이동통을 놓아두었다. 에리가 스스로 들어가주길 기다렸는데 결국 안 들어갔다. 조금 아쉬웠다.',
  },
  {
    id: 'seed-tmi-2026-09-05-touch',
    date: '2026-09-05',
    text: '오늘은 긴 실리콘 숟가락으로 에리를 이동통 쪽으로 살짝 유도해보았다. 그런데 실수로 코를 톡 건드려버렸다. 에리는 은신처 뒤로 쏙 들어갔다가 나중에 다시 천장으로 올라왔다. 조금 미안했다.',
  },
  {
    id: 'seed-tmi-2026-09-05-ceiling',
    date: '2026-09-05',
    text: '오늘은 에리가 천장에 붙어서 같은 자세로 아주 오래 있었다. 멀미도 안 나는지 신기했다. 참 귀여웠다.',
  },
  {
    id: 'seed-tmi-2026-09-05-water',
    date: '2026-09-05',
    text: '오늘은 에리가 물그릇 가장자리에 앞발을 걸치고 앉아 있었다. 작은 욕조 앞에 앉아 있는 것 같아서 웃겼다. 참 귀여웠다.',
  },
]

export const seedEnvironmentLogs: EnvironmentLog[] = [
  {
    id: 'seed-env-2026-09-02-1',
    date: '2026-09-02',
    temperature: 25.1,
    humidity: 67,
    memo: '당시 사용자가 직접 측정해 기록한 값.',
  },
  {
    id: 'seed-env-2026-09-04-90',
    date: '2026-09-04',
    humidity: 90,
    memo: '제습 시작 전 높은 습도.',
  },
  {
    id: 'seed-env-2026-09-04-88',
    date: '2026-09-04',
    humidity: 88,
    memo: '제습 중.',
  },
  {
    id: 'seed-env-2026-09-04-77',
    date: '2026-09-04',
    humidity: 77,
    memo: '제습 중.',
  },
  {
    id: 'seed-env-2026-09-04-74',
    date: '2026-09-04',
    humidity: 74,
    memo: '제습 후 내려간 값.',
  },
]

export const seedDefecationLogs: DefecationLog[] = [
  {
    id: 'seed-poop-2026-09-04-1',
    date: '2026-09-04',
    status: '미분류',
    memo: '작고 냄새는 거의 없었음. 검은 부분 약 80%, 하얀 요산 부분 약 20%. 검은 부분은 약간 말랑했고 하얀 부분은 작은 모래 같은 느낌으로 관찰됨.',
  },
]

export const seedPresetSelections: PresetSelection[] = [
  {
    id: 'seed-preset-2026-09-02-observe',
    date: '2026-09-02',
    group: 'activity',
    label: '주변 관찰',
  },
  {
    id: 'seed-preset-2026-09-05-ceiling',
    date: '2026-09-05',
    group: 'location',
    label: '천장',
  },
  {
    id: 'seed-preset-2026-09-05-water',
    date: '2026-09-05',
    group: 'location',
    label: '물그릇 주변',
  },
]
