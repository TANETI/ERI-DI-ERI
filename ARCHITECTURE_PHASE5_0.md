# ERI DI-ERY Phase 5.0 — Repository Architecture

## Before

```text
React pages / App
  ├─ localStorage store
  └─ IndexedDB photoStore
```

UI 코드가 저장 기술을 직접 알고 있었습니다.

## After

```text
React UI
    ↓
AppRepository
    ↓
LocalRepository
    ├─ localStorage store
    └─ IndexedDB photoStore
```

UI가 아는 것은 이제 `AppRepository`뿐입니다.

직접 localStorage / IndexedDB를 아는 경계는
`src/data/localRepository.ts`로 모였습니다.

## Promise contract

Repository 메서드는 Promise 기반입니다.

현재 LocalRepository는 거의 즉시 완료되지만,
D1/R2는 네트워크 저장이므로 같은 함수 형태를 그대로 쓸 수 있습니다.

## Serialized writes

App.tsx의 구조화 기록 쓰기는 직렬 Promise 큐를 통과합니다.

빠르게 연속 입력해도 향후 원격 API 요청 완료 순서가
사용자 입력 순서와 뒤집히는 위험을 줄이기 위한 기반입니다.

## Existing data

localStorage key와 IndexedDB database/store 이름은 바꾸지 않았습니다.

따라서 Phase 4.x까지의 로컬 데이터는 migration 없이 그대로 읽습니다.

## Next

```text
AppRepository
  ├─ LocalRepository
  └─ CloudflareRepository
       ├─ Worker API
       ├─ D1
       └─ R2
```

다음 단계에서는 Cloudflare 구현체를 추가하되,
완성되기 전까지 LocalRepository를 기본값으로 유지합니다.
