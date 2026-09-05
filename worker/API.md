# ERI DI-ERY Worker API v1 — Phase 5.3

## Public

### GET /api/health

Worker / D1 schema 상태를 확인합니다.

## Authentication

`/api/v1/*`는 현재 개발 단계 Bearer API_TOKEN을 요구합니다.

실제 브라우저 배포에서는 이 토큰을 번들에 넣지 않고
Cloudflare Access 인증으로 교체합니다.

## Structured data / D1

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

## Photos / D1 + R2

### GET `/api/v1/photos/meta`

D1의 사진 메타데이터 목록.

### POST `/api/v1/photos`

`multipart/form-data`

- `meta`: PhotoMeta JSON 문자열
- `file`: 이미지 원본

Worker가:
1. `photos/<photo-id>` key로 R2에 원본 저장
2. D1 `photo_meta.object_key`와 연결

합니다.

최대 파일 크기: 30 MiB.

### GET `/api/v1/photos/:id/content`

D1 object_key를 조회해 R2 원본을 스트리밍합니다.

### PUT `/api/v1/photos/:id/meta`

캡션 / 대표사진 여부 등 메타데이터만 변경합니다.
R2 원본 object_key는 유지됩니다.

### DELETE `/api/v1/photos/:id`

R2 object와 D1 photo_meta row를 함께 삭제합니다.

## Safety

로컬→R2 전체 복사는 클라이언트가 각 사진을 먼저 업로드하고,
모든 incoming 사진 업로드가 성공한 뒤 기존 R2의 불필요한 사진을 삭제합니다.

따라서 새 복사 작업을 시작하자마자 기존 R2 세트를 먼저 비우지 않습니다.
