# ERI DI-ERY Phase 3.2 — 기상청 구래동 동네예보

날씨 데이터의 기본 공급자를 Open-Meteo에서
**기상청 단기예보(구 동네예보)** 방향으로 전환합니다.

## 위치

개인용 앱 기본 위치:

- 경기도 김포시 구래동
- 기상청 격자 X 54 / Y 128

화면에도 광역 `김포시` 대신
`경기도 김포시 구래동`으로 표시합니다.

기상청 동네예보 자체의 공간 해상도는 5km 격자이므로,
행정동 이름은 구래동으로 정확하게 표시하되 같은 격자 안의 인근 위치는
같은 예보값을 공유할 수 있습니다.

## 데이터

사용 API:

`기상청_단기예보 조회서비스`

로컬 요청 경로:

`/api/weather/kma`

Vite 개발 서버가 아래 기상청 API로 프록시합니다.

`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`

브라우저에는 공공데이터 API 키를 직접 전달하지 않습니다.

## API 키 설정

1. 공공데이터포털 회원가입/로그인
2. `기상청_단기예보 조회서비스` 활용신청
3. 프로젝트 루트에서 `.env.example`을 참고하여 `.env.local` 생성
4. 일반 인증키 중 `Decoding` 값을 입력

예:

```env
KMA_SERVICE_KEY=여기에_일반인증키_Decoding
```

5. `npm run dev` 재시작

`.env.local`은 Git에 올리지 마세요.

## 카드에 표시하는 값

선택 날짜의 동네예보에서:

- 기온 TMP
- 습도 REH
- 하늘상태 SKY
- 강수형태 PTY
- 강수확률 POP
- 시간당 강수 PCP

를 취합합니다.

홈에는:
- 기온 범위
- 습도 범위
- 하늘 상태
- 강수 정보
- 사육 관리 확인 알림

을 보여줍니다.

## 관리 알림

외부 지역 날씨는 사육장 내부 실측값이 아닙니다.

따라서 앱은:

- `에어컨을 반드시 켜세요`

가 아니라

- `오늘은 냉방 여부를 확인해요`

처럼 행동을 확정하지 않고 **확인 신호**만 제공합니다.

습도/강수확률이 높은 날도 같은 원칙으로
분무량을 바로 자동 결정하지 않고
사육장 내부가 얼마나 마르는지 확인하도록 안내합니다.

## 과거 날짜

현재 연결한 기상청 단기예보 API는
과거 날씨 보관용 API가 아닙니다.

그래서 달력에서 지난 날짜를 열었을 때는
과거 Open-Meteo 값을 섞지 않고
`현재 기상청 단기예보 범위 밖`이라고 표시합니다.

향후 필요하면 별도의 기상청 관측/과거자료 API로
역사 날씨를 연결할 수 있습니다.

## Cloudflare 배포 때

현재 `/api/weather/kma` 계약을 그대로 유지하고:

`Browser → Cloudflare Worker → KMA API`

구조로 바꿉니다.

KMA_SERVICE_KEY는 Cloudflare Worker Secret으로 옮길 예정입니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 그대로 덮어씁니다.

추가:
- `.env.example`
- `src/lib/kmaWeather.ts`

교체:
- `vite.config.ts`
- `src/types/index.ts`
- `src/lib/storage.ts`
- `src/lib/weather.ts`
- `src/components/WeatherContextCard.tsx`
- `src/pages/MorePage.tsx`
- `src/styles.css`

그리고 Phase 3.1.1에서 수정한 초기 급여량
`소량 → 보통 → 보통`도 이 패치의 기준 상태에 포함했습니다.
