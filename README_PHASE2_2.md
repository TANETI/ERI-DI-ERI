# ERI DI-ERY Phase 2.2 — 지역 날씨 기반 관리 체크

## 바뀐 방향

수동으로 사육장 온도/습도를 매일 입력하는 기능을 UI와 보고서에서 제거합니다.

대신 사용자가 설정한 우리 집 지역의 **실외 날씨**를 불러와:

- 더운 날 → 냉방/사육장 위치 확인
- 매우 습하거나 비 오는 날 → 분무 전 내부 상태 확인, 필요 시 분무량을 보수적으로
- 매우 건조한 날 → 사육장 건조 속도 확인
- 추운 날 → 창가/외벽 쪽 급랭 확인

같은 **관리 체크 알림**을 보여줍니다.

실외 날씨는 사육장 내부와 같지 않기 때문에 앱 문구도
“에어컨을 반드시 켜라”가 아니라 “냉방 여부를 확인하자” 식으로 작성합니다.

## 데이터 소스

Open-Meteo
- Forecast API: 오늘/미래
- Historical Weather API: 과거 날짜
- Geocoding API: 지역 검색

## 설정 방법

더보기 → 설정 → 지역 날씨

1. 지역 이름 검색
2. 검색 결과에서 우리 집 지역 선택
3. 설정 저장
4. 필요하면 브라우저 알림 허용

## 알림

현재 로컬 버전:
- 앱을 열었을 때 오늘 지역 날씨 확인
- 중요한 날씨 신호가 있으면 브라우저 알림 권한이 있는 경우 하루 한 번 알림

향후 Cloudflare 배포 단계:
- Worker Cron Trigger가 아침에 자동으로 날씨 확인
- Web Push로 앱을 열지 않아도 알림

## 제거된 UI

- 수동 온도 입력
- 수동 습도 입력
- 달력의 환경 기록 아이콘
- 보고서의 온도/습도 평균

기존 localStorage의 옛 수동 온습도 데이터는 실수로 잃지 않도록 삭제하지 않고 남겨두되,
화면과 보고서에서는 더 이상 사용하지 않습니다.

## 새 UI

- 홈의 지역 날씨 카드
- 달력 일간 보기의 선택 날짜 지역 날씨 카드
- 과거 날짜를 열면 해당 날짜의 과거 지역 날씨
- 지역 검색 설정
- 날씨 기반 관리 체크 안내

## 적용

ZIP 내용을 `C:\dev\ERI-DI-ERI`에 그대로 덮어씁니다.

새 파일:
- `src/lib/weather.ts`
- `src/components/WeatherContextCard.tsx`

교체 파일:
- `src/types/index.ts`
- `src/lib/storage.ts`
- `src/lib/report.ts`
- `src/App.tsx`
- `src/pages/RecordPage.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/pages/MorePage.tsx`
- `src/styles.css`
