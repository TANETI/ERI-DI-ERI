# ERI DI-ERY Phase 4.2 — 전체 백업 / 복원

D1/R2 서버화 전에 로컬 데이터를 안전하게 꺼내둘 수 있도록
백업과 복원 기능을 추가합니다.

## 위치

`더보기 → 설정 → 백업 · 복원`

## 1. 전체 백업

`전체 백업` 버튼은 하나의 TAR 파일을 만듭니다.

포함:
- manifest.json
- data.json
- CSV 전체
- 사진 원본 전체

예:
`ERI_DI_ERY_full_backup_2026-09-05_1530.tar`

### data.json
구조화 기록:
- 설정
- 급여
- 체중
- TMI
- 빠른 체크
- 배변
- 이전 환경기록
- ChatGPT 평가
- 실제 관리 결정

사진:
- 사진 메타데이터
- 사진 원본은 `photos/` 폴더에 별도 저장

## 2. 기록 JSON

사진 원본을 제외한 구조화 기록만 JSON으로 저장합니다.

용도:
- Git 등 텍스트 백업
- 기록 구조 확인
- 사진 없이 빠른 백업

복원할 때:
- 구조화 기록은 JSON 내용으로 교체
- 현재 브라우저 사진은 건드리지 않음

## 3. CSV 묶음

CSV 여러 개를 TAR로 묶어 저장합니다.

포함:
- settings.csv
- feeding.csv
- weight.csv
- tmi.csv
- presets.csv
- defecation.csv
- evaluations.csv
- decisions.csv
- legacy-environment.csv

엑셀/스프레드시트에서 별도 분석할 때 사용하기 좋습니다.

CSV 내 배열/객체 값은 JSON 문자열로 한 셀에 들어갈 수 있습니다.

## 4. 전체 복원

전체 TAR 백업을 선택하면:

1. 백업 형식 확인
2. 모든 사진 파일 확인
3. IndexedDB 사진을 백업 사진으로 교체
4. 구조화 기록을 백업 기록으로 교체
5. 앱 새로고침

을 수행합니다.

사진 하나라도 백업에서 누락되어 있으면 복원을 중단합니다.

## 5. JSON 복원

기록 JSON을 선택하면:
- 구조화 기록만 교체
- 현재 사진은 유지
- 앱 새로고침

## TAR을 쓴 이유

현재 프로젝트에 별도 ZIP 라이브러리를 추가하지 않기 위해
브라우저에서 직접 만들고 읽기 쉬운 표준 TAR 포맷을 사용합니다.

압축은 하지 않지만:
- 사진 원본 손실 없음
- 별도 npm dependency 없음
- 나중에 서버로 이전하기 쉬움

이라는 장점이 있습니다.

Windows에서도 7-Zip, WinRAR 등으로 내용을 열 수 있고
최근 환경에서는 기본 압축 도구에서도 TAR을 다루기 쉽습니다.

## 사진 주의

Phase 4.0~현재 사진은 IndexedDB 로컬 저장입니다.

따라서:
- 브라우저 사이트 데이터 삭제
- 브라우저 프로필 초기화
- 다른 PC에서 접속

시 자동으로 따라오지 않습니다.

R2 이전 전에는 정기적으로 `전체 백업`을 받아두는 것을 권장합니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

새 파일:
- `src/lib/backup.ts`

교체:
- `src/types/index.ts`
- `src/lib/storage.ts`
- `src/lib/photoDb.ts`
- `src/pages/MorePage.tsx`
- `src/styles.css`
