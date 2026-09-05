# ERI DI-ERY Worker API v1

Phase 5.1에서는 프론트엔드가 아직 이 API를 사용하지 않습니다.
로컬 저장소는 그대로 기본이며, Worker + D1의 서버 기반만 만듭니다.

## Public

### GET /api/health

D1 migration 적용 여부와 API 상태를 확인합니다.

## Protected

`/api/v1/*`는 현재:

```http
Authorization: Bearer <API_TOKEN>
```

이 필요합니다.

API_TOKEN이 Worker에 설정되지 않은 상태에서는
보호 API가 503으로 닫힙니다.

이 토큰을 브라우저 앱에 넣는 것은 금지합니다.
Phase 5.2에서 브라우저 연결 전에 Cloudflare Access 인증 경계를 따로 구성할 예정입니다.

## Structured data

- GET `/api/v1/snapshot`
- PUT `/api/v1/snapshot`
- PUT `/api/v1/settings`
- PUT `/api/v1/feeding`
- PUT `/api/v1/weight`
- PUT `/api/v1/tmi`
- PUT `/api/v1/presets`
- PUT `/api/v1/defecation`
- PUT `/api/v1/evaluations`
- PUT `/api/v1/decisions`

각 collection PUT은 해당 collection 전체를 한 번에 교체합니다.

Phase 5.0 Repository가 현재도 배열 단위 저장 메서드를 사용하므로,
CloudflareRepository를 붙일 때 UI 의미를 바꾸지 않고 연결하기 위한 형태입니다.

D1의 `batch()`를 사용해 collection 단위 DELETE + INSERT를 묶습니다.

## Photo metadata

- GET `/api/v1/photos/meta`
- PUT `/api/v1/photos/meta`

사진 원본은 아직 지원하지 않습니다.

Phase 5.3에서:

- R2 object upload
- object download
- delete
- photo_meta.object_key 연결

을 추가합니다.

## Full snapshot

`PUT /api/v1/snapshot`은 백업 복원이나 최초 로컬→클라우드 업로드에 사용할 기반입니다.

사진 메타/원본은 snapshot에 포함하지 않습니다.
