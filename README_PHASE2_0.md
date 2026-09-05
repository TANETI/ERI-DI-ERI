# ERI DI-ERY Phase 2.0 — Core management

이번 단계는 Cloudflare 연결 전에 로컬에서 쓸 수 있는 핵심 관리 기능을 채웁니다.

## 추가 기능

### 1. 체중 측정 일정
- 첫 체중 기록을 저장하면 해당 날짜가 자동으로 `첫 측정일`이 됨
- 기본 주기: 7일
- 설정에서 `매주`, `격주`, 또는 임의 N일 간격으로 변경
- 오늘 화면에서 다음 체중 측정일 확인
- 달력 월간 보기에서:
  - `☐⚖` 측정 예정
  - `☑⚖` 측정 완료
- 일간 보기에서도 측정 예정 여부 표시

### 2. 보고서 센터
`더보기 > 보고서`

기간 프리셋:
- 최근 7일
- 최근 14일
- 최근 30일
- 처음부터
- 직접 날짜 선택

출력:
- Markdown 복사
- ChatGPT 평가용 전체 복사
- JSON 저장

ChatGPT 평가용 출력에는:
- 분석 지침
- 기간 보고서
- 고정 평가서 양식
이 자동으로 포함됩니다.

### 3. TMI 입력 힌트
TMI 입력 placeholder도 그림일기 문체로 변경했습니다.

## 적용

ZIP 내용을 아래 경로에 그대로 덮어씁니다.

`C:\dev\ERI-DI-ERI`

새 파일:
- `src/lib/weight.ts`
- `src/lib/report.ts`

교체 파일:
- `src/App.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/pages/MorePage.tsx`
- `src/pages/RecordPage.tsx`
- `src/styles.css`

## 아직 남은 핵심 항목

- 기록 수정 / 삭제
- 사용자 정의 프리셋 / 세트 프리셋
- 급여·체중 스케줄 변경 이력
- 사진 R2 업로드 / 앨범
- 체중 그래프
- PWA / Web Push 알림
- D1 / Workers 실제 서버 저장


## 빌드 설정 수정
초기 프로토타입의 `tsconfig.node.json`에 `noEmit: true`를 추가하여
`npm run build` 시 TypeScript의 `allowImportingTsExtensions` 설정 오류가 나지 않도록 정리했습니다.
