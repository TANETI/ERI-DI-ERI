# ERI DI-ERY Phase 5.4 — Worker App + Cloudflare Access 준비

이번 단계에서 프론트엔드와 API를 하나의 Cloudflare Worker 서비스에 합칩니다.

## 구조

```text
eri.issssm.com
       |
Cloudflare Access
       |
eri-di-ery-api Worker
   |          |
Static       /api/*
Assets        |
(dist)        +-- D1
              +-- R2
```

React/Vite 빌드 결과물 `dist/`도 같은 Worker가 정적 자산으로 제공합니다.

## wrangler static assets

```json
"assets": {
  "directory": "./dist",
  "binding": "ASSETS",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

- `/assets/*`, `/`, SPA 화면: Static Assets
- `/api/*`: Worker 코드 우선
- React client route는 SPA fallback으로 index.html 처리

## 인증

API 인증 우선순위:

1. Worker-level Cloudflare Access로 인증되어 `ctx.access`가 존재하면 허용
2. 그렇지 않으면 기존 Bearer `API_TOKEN`을 개발/비상 테스트용 fallback으로 사용

따라서 실제 `eri.issssm.com`에서는 브라우저에 API_TOKEN을 넣지 않습니다.

## 프로덕션 기본 저장소

`eri.issssm.com`에서 처음 접속한 브라우저는 별도 localStorage 설정이 없어도:

- 구조화 기록: CLOUD / D1
- 사진: R2
- API 주소: 현재 origin (`https://eri.issssm.com`)

을 기본값으로 사용합니다.

localhost는 기존대로:

- LOCAL
- IndexedDB
- `http://localhost:8787`

이 기본값입니다.

## 적용 후

```powershell
cd C:\dev\ERI-DI-ERI
npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
npx.cmd wrangler deploy
```

배포 후 workers.dev 주소에서 앱 정적 파일이 열리는지 확인합니다.

그 다음 Cloudflare Dashboard에서 이 Worker 자체를 Access로 보호합니다.

## Access 설정 권장

Cloudflare Dashboard:

Workers & Pages
→ eri-di-ery-api
→ Access
→ Protect this Worker behind Access

Production + Preview 보호를 선택하고,
Allow 정책에는 본인이 로그인할 이메일 하나만 허용합니다.

Worker-level Access는 이 Worker에 연결된 workers.dev,
Custom Domain, preview를 함께 보호하므로
나중에 `eri.issssm.com`을 붙여도 같은 정책이 따라갑니다.

## Custom Domain

Access가 정상 작동한 뒤:

Workers & Pages
→ eri-di-ery-api
→ Settings
→ Domains & Routes
→ Add
→ Custom Domain
→ `eri.issssm.com`

을 추가합니다.

해당 hostname에 기존 CNAME이 있으면 Custom Domain 추가 전에
충돌하는 DNS 레코드를 정리해야 합니다.

## API_TOKEN

Access 전환이 완료되어도 당장은 Worker secret API_TOKEN을 삭제하지 않습니다.
로컬/비상 검증 fallback으로 남겨둡니다.

브라우저에는 넣지 않습니다.
