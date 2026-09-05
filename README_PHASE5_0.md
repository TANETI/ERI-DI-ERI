# ERI DI-ERY Phase 5.0 — Repository 추상화

Cloudflare D1/R2 연결 전에 저장 계층을 UI에서 분리합니다.

## 핵심 변화

이전:
`React → localStorage / IndexedDB`

현재:
`React → AppRepository → LocalRepository → localStorage / IndexedDB`

App, PhotoImage, backup.ts는 이제 저장 구현을 직접 import하지 않습니다.

## 기존 데이터 유지

저장 키와 IndexedDB 이름은 그대로입니다.
따라서 기존 기록과 사진은 그대로 이어서 읽습니다.

데이터 migration은 없습니다.

## 앱 시작

Repository가 구조화 기록과 사진 메타데이터를 읽는 동안
짧은 로딩 화면을 보여줍니다.

로컬에서는 거의 즉시 지나가지만,
향후 서버 저장소에서도 같은 흐름을 사용합니다.

## 저장 실패

Repository 쓰기가 실패하면 상단에 작은 경고 배너를 표시합니다.

현재 로컬에서는 드문 상황이지만
향후 네트워크 오류 UI의 기반입니다.

## 새 파일

- `src/data/repository.ts`
- `src/data/localRepository.ts`
- `src/data/index.ts`
- `src/lib/defaultSettings.ts`
- `ARCHITECTURE_PHASE5_0.md`

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

그 다음:

```powershell
npm.cmd run build
```

로 실제 프로젝트 build를 확인하세요.
