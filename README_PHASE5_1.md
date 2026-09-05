# ERI DI-ERY Phase 5.1 — Cloudflare Worker + D1 골격

Phase 5.0 Repository 구조 위에 실제 서버 쪽 기반을 추가합니다.

중요:
**이번 단계에서 프론트엔드는 아직 LocalRepository를 사용합니다.**
즉 패치를 적용해도 현재 에리 기록의 저장 방식은 바뀌지 않습니다.

## 만들어진 것

```text
React
  ↓
AppRepository
  ↓
LocalRepository        ← 아직 기본

Cloudflare 쪽 신규:
Worker API
  ↓
D1
```

## 신규 파일

```text
wrangler.jsonc
.dev.vars.example

worker/
├─ API.md
├─ tsconfig.json
├─ smoke-test.ps1
├─ migrations/
│  └─ 0001_initial.sql
└─ src/
   ├─ index.ts
   ├─ db.ts
   ├─ http.ts
   ├─ types.ts
   └─ runtime.d.ts
```

## D1 스키마

정규화된 테이블로 분리했습니다.

- app_settings
- feeding_schedule_periods
- weight_schedule_periods
- feeding_logs
- weight_logs
- tmi_logs
- preset_selections
- environment_logs
- defecation_logs
- evaluation_logs
- management_decisions
- photo_meta
- app_meta

사진 원본용 R2는 아직 연결하지 않았습니다.

## 안전장치

`GET /api/health`만 공개되어 있습니다.

`/api/v1/*`는 `API_TOKEN`이 없으면 아예 503,
틀리면 401로 막습니다.

이 토큰은 Phase 5.1의 Worker 단독 테스트용입니다.
**브라우저 JS에 API_TOKEN을 넣지 마세요.**

Phase 5.2에서 Cloudflare Access를 인증 경계로 잡은 후
CloudflareRepository를 연결할 예정입니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

현재 Vite 앱은 Worker 코드를 build 대상으로 삼지 않으므로
기존 앱 build는 그대로 확인할 수 있습니다.

```powershell
npm.cmd run build
```

## 1. Worker 코드 타입 확인

프로젝트 루트에서:

```powershell
npx.cmd tsc -p .\worker\tsconfig.json
```

## 2. Cloudflare 로그인

처음 한 번:

```powershell
npx.cmd wrangler login
```

## 3. D1 생성

```powershell
npx.cmd wrangler d1 create eri-di-ery
```

명령 결과에 나오는 `database_id`를 복사해서:

```text
wrangler.jsonc
```

의 현재 값:

```text
00000000-0000-0000-0000-000000000000
```

과 교체합니다.

## 4. 로컬 secret

```powershell
Copy-Item .\.dev.vars.example .\.dev.vars
```

그 다음 `.dev.vars`의:

```text
API_TOKEN=change-me-before-testing
```

를 임의의 긴 값으로 바꿉니다.

예를 들어 PowerShell에서:

```powershell
[guid]::NewGuid().ToString("N")
```

으로 값을 하나 만들 수 있습니다.

## 5. 로컬 D1 migration

```powershell
npx.cmd wrangler d1 migrations apply eri-di-ery --local
```

Cloudflare 공식 로컬 D1은 `.wrangler/state` 아래에 저장되며
일반 `wrangler dev` 재시작 후에도 유지됩니다.

## 6. Worker 로컬 실행

터미널 하나에서:

```powershell
npx.cmd wrangler dev
```

기본적으로 `http://localhost:8787`에서 실행됩니다.

## 7. Smoke test

다른 PowerShell에서,
`.dev.vars`에 넣은 토큰과 같은 값으로:

```powershell
.\worker\smoke-test.ps1 `
  -Token "여기에_토큰"
```

정상이면:

- `/api/health`
- `/api/v1/snapshot`

둘 다 응답합니다.

## Remote migration / deploy

**로컬 테스트가 통과한 뒤에만** 진행합니다.

remote secret:

```powershell
npx.cmd wrangler secret put API_TOKEN
```

production origin도 배포 전에:

```json
"ALLOWED_ORIGIN": "https://eri.issssm.com"
```

으로 바꿉니다.

그 뒤:

```powershell
npx.cmd wrangler d1 migrations apply eri-di-ery --remote
npx.cmd wrangler deploy
```

이번 단계에서는 실제 배포까지 서두를 필요 없습니다.
먼저 로컬 Worker + D1이 정상인지 확인하는 게 목표입니다.
