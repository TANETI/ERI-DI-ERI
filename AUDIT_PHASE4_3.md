# ERI DI-ERY 코드 점검 — Phase 4.3

검토 기준: Phase 4.2까지 적용된 전체 소스.

## 전체 판단

기능 흐름은 잘 이어져 있습니다.

- 일정 이력
- 급여 / 체중 / 배변 / TMI
- 통계
- 날씨
- 사진
- 평가 / 관리 결정
- 백업 / 복원

이 서로 큰 충돌 없이 연결돼 있습니다.

다만 Cloudflare D1/R2로 넘어가기 전에
로컬 프로토타입에서 쌓인 기술 부채를 한 번 정리할 필요가 있었습니다.

## 이번에 바로 수정한 것

### 1. 한국 날짜 경계 통일

일부 코드에서 `new Date().toISOString().slice(0, 10)`을 써서
한국 시간 00:00~08:59 사이에 날짜가 전날 UTC 기준으로 잡힐 수 있었습니다.

영향 가능 영역:
- 날씨 오늘/과거 판정
- 날씨 알림
- 통계 30/90일 시작점

`todayISO()` / `currentKoreaHour()`를 공통 함수로 만들고
Asia/Seoul 기준으로 통일했습니다.

### 2. test-shims.d.ts

이 파일은 이전 점검 과정에서 사용한 임시 타입 shim입니다.

실제 React 타입이 있는 정상 프로젝트에는 필요 없고,
오히려 JSX 이벤트 타입 추론을 흐릴 수 있습니다.

tsconfig에서 제외했고,
cleanup 스크립트로 삭제할 수 있게 했습니다.

### 3. 사용하지 않는 DayDetailPage

현재 라우팅/화면에서 아무 곳에서도 import하지 않는 과거 페이지입니다.
cleanup 스크립트에서 제거 대상으로 넣었습니다.

### 4. 날씨 코드

구래동 고정 이후 사용하지 않는 Open-Meteo 지역검색 함수를 제거했습니다.

또 외부 날씨만으로
`분무량을 줄이는 편이 좋다`고 말하던 문구를 완화했습니다.

이제:
- 외부 날씨 = 확인 신호
- 실제 결정 = 사육장 내부 습도/건조 속도 우선

원칙으로 다시 맞췄습니다.

### 5. 2시간 다이얼

4시간 카드용 옛 CSS가 남아 있었습니다.
실제 DOM에서는 더 이상 쓰지 않으므로 삭제했습니다.

강수확률이 0%인 모든 칸에 `☔ 0%`가 붙는 것도 제거했습니다.

### 6. 전체 백업 안정성

기존에는 사진 메타데이터는 있는데 Blob이 없으면
그 사진을 조용히 건너뛴 채 "전체 백업"을 만들 수 있었습니다.

그러면 나중에 복원 시 실패합니다.

이제 사진 원본 하나라도 읽지 못하면
전체 백업 생성 자체를 중단하고 사용자에게 알려줍니다.

### 7. 사진 메모리 사용

기존 `PhotoImage`는 앨범에 사진 100장이 있으면
화면 아래쪽 사진까지 IndexedDB에서 Blob을 전부 읽을 수 있었습니다.

IntersectionObserver를 추가해
화면 근처에 오는 사진만 Blob을 읽도록 바꿨습니다.

### 8. 사진 저장공간 부족

IndexedDB quota 초과 오류에
사용자가 이해할 수 있는 안내 메시지를 추가했습니다.

## 아직 남겨둔 구조적 과제

다음 서버 단계 전에 가장 중요한 건 데이터 접근 계층입니다.

현재:

React Page
→ App.tsx
→ localStorage / IndexedDB

형태입니다.

D1/R2를 바로 붙이면 App.tsx의 CRUD 대부분을 비동기 서버 코드로
다시 손봐야 합니다.

다음 단계에서는 먼저:

React
→ repository/service interface
→ LocalRepository

구조로 한 번 감싼 뒤,

React
→ repository/service interface
→ CloudflareRepository

를 추가하는 편이 안전합니다.

즉 다음 단계는 **바로 D1 테이블을 만들기보다
Repository 추상화 → D1/R2 구현** 순서를 권장합니다.

## 파일 크기 부채

현재 큰 파일:

- RecordManager.tsx 약 800줄
- backup.ts 약 700줄
- StatsPage.tsx 약 700줄
- MorePage.tsx 약 700줄
- RecordPage.tsx 약 670줄
- styles.css 약 3,000줄

지금 당장 기능 오류는 아니지만,
서버화 이후 더 커지기 전에 점진적으로 분리해야 합니다.

추천 순서:

1. data repository
2. MorePage → Stats / Evaluation / Report / Settings 섹션 분리
3. RecordManager edit forms 분리
4. styles.css 기능별 CSS 파일 분리

## 빌드 점검 메모

이 작업 환경에는 프로젝트 node_modules가 없고
npm install도 네트워크 타임아웃으로 완료되지 않아
실제 Vite production build는 여기서 끝까지 재현하지 못했습니다.

다만 TypeScript 파서는 전체 앱 소스를 읽었고,
임시 shim 환경에서 `noImplicitAny`만 끈 구조 검사는 통과했습니다.

기존에 보이던 다수의 이벤트 매개변수 any 경고는
`src/test-shims.d.ts`의 catch-all JSX 선언이 원인이므로
실제 프로젝트에서는 이 shim을 제거하는 것이 맞습니다.

다음 서버화 전에 사용자 PC에서 한 번:

```powershell
npm install
npm run build
```

를 통과시키는 것을 기준점으로 잡는 게 좋습니다.
