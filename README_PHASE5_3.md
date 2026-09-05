# ERI DI-ERY Phase 5.3 — Cloudflare R2 사진 저장

구조화 기록 D1 연결에 이어 사진 원본을 R2로 저장할 수 있게 합니다.

## 현재 wrangler.jsonc

사용자가 이미 생성한 설정이 정확합니다.

```json
"r2_buckets": [
  {
    "bucket_name": "eri-di-ery-photos",
    "binding": "PHOTOS"
  }
]
```

이번 패치는 `wrangler.jsonc`를 덮어쓰지 않습니다.

## 안전한 전환 방식

패치 직후에도 사진 저장소 기본값은 **LOCAL**입니다.

즉 CLOUD 구조화 기록을 쓰고 있어도 기존 IndexedDB 사진이 그대로 보입니다.

설정 → 클라우드 데이터 실험실에서:

1. `R2 사진 확인`
2. `로컬 사진 → R2`
3. 업로드 장수 확인
4. `R2 사진`

순서로 전환합니다.

R2로 복사해도 IndexedDB 사진은 자동 삭제하지 않습니다.

## 저장 구조

R2 전환 전:

```text
records → D1
photos  → IndexedDB
```

R2 전환 후:

```text
records    → Worker → D1
photo meta → Worker → D1
photo blob → Worker → R2
```

## Worker API

- POST `/api/v1/photos`
- GET `/api/v1/photos/meta`
- GET `/api/v1/photos/:id/content`
- PUT `/api/v1/photos/:id/meta`
- DELETE `/api/v1/photos/:id`

사진은 `photos/<photo-id>` object key를 사용합니다.

## 백업 / 복원

`appRepository`가 R2 사진 모드일 때:
- 전체 백업은 R2 원본을 읽어 TAR에 포함
- 전체 복원은 사진을 R2로 다시 업로드

합니다.

LOCAL 사진 모드일 때는 기존 IndexedDB를 사용합니다.

## 적용 후 검증

프로젝트 루트:

```powershell
npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
```

## 로컬 실행

PowerShell A:

```powershell
npx.cmd wrangler dev
```

PowerShell B:

```powershell
npm.cmd run dev
```

브라우저:
`http://localhost:5173`

설정 → 클라우드 데이터 실험실.

## 중요한 점

Wrangler에서 R2를 만들 때 local dev를 remote resource에 연결하지 않았으므로,
현재 `wrangler dev` 테스트의 R2는 로컬 emulation입니다.

실제 원격 `eri-di-ery-photos` 버킷은 아직 건드리지 않습니다.

Phase 5.3 로컬 CRUD가 통과한 뒤 원격 migration/deploy를 진행하면 됩니다.
