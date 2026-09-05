# ERI DI-ERY Phase 4.0 — 로컬 사진 앨범

다음 큰 단계로 사진 기록을 실제로 활성화합니다.

## 저장 방식

Cloudflare R2를 붙이기 전까지 사진 원본은 브라우저의 IndexedDB에 저장합니다.

- localStorage에 사진 base64를 넣지 않음
- 여러 장 저장 가능
- 새로고침 후에도 유지
- 날짜/메모/대표 사진 같은 메타데이터를 사진 원본과 분리
- 이후 R2 마이그레이션하기 쉬운 구조

주의:
브라우저 데이터 삭제 / 사이트 데이터 초기화를 하면 로컬 사진도 지워집니다.
Cloudflare R2 연결 전에는 중요한 사진의 유일한 보관처로 사용하지 마세요.

## 앨범

`앨범` 탭에서:

- 날짜 선택
- 여러 장 한번에 추가
- 사진별 메모
- 날짜별 대표 사진 지정
- 사진 삭제
- 전체 / 대표 사진 필터

가 가능합니다.

한 날짜의 첫 번째 사진은 자동으로 그 날짜의 대표 사진이 됩니다.

대표 사진을 삭제하면 같은 날짜의 다른 사진 중 하나를 자동으로 대표로 올립니다.

## 오늘 화면

오늘 사진이 있으면 기존 placeholder 대신:

- 대표 사진
- 오늘 사진 장수
- 사진 메모

가 표시됩니다.

사진을 누르면 앨범 탭으로 이동합니다.

오늘 사진이 없으면 placeholder 자체를 눌러 앨범으로 갈 수 있습니다.

## 달력

월간 달력에는 사진이 있는 날짜에:

- `📷`
- 여러 장이면 `📷2`, `📷3` ...

가 표시됩니다.

일간 기록에도 해당 날짜 사진 장수와 대표 사진 여부가 표시됩니다.

## 다음 서버 단계

Phase 4.0의 데이터 구조를 그대로 살려서:

Browser IndexedDB
→ Cloudflare Worker
→ R2 사진 원본
→ D1 사진 메타데이터

로 옮길 예정입니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

새 파일:
- `src/lib/photoDb.ts`
- `src/components/PhotoImage.tsx`

교체:
- `src/types/index.ts`
- `src/App.tsx`
- `src/pages/AlbumPage.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/styles.css`
