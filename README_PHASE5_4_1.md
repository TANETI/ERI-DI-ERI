# ERI DI-ERY Phase 5.4.1 — Access + Static Assets 인증 수정

## 증상

`eri.issssm.com`에서 Cloudflare Access 로그인까지 성공했지만
앱의 `/api/v1/*` 요청은 다음 오류를 표시했습니다.

```text
Cloudflare Access or a valid development token is required.
```

## 원인

Cloudflare Workers Static Assets는 내부 assets router를 거칩니다.

Worker-level Access는 앱과 API 요청을 정상적으로 보호하지만,
Static Assets가 붙은 Worker에서는 이 내부 router가
`ctx.access`를 사용자 Worker에 전달하지 않습니다.

따라서 Phase 5.4의:

```ts
if (ctx?.access) {
  return
}
```

만으로는 실제 로그인 세션을 감지할 수 없었습니다.

## 수정

인증 우선순위:

1. `ctx.access`가 있으면 즉시 허용
2. 없으면 `CF_Authorization` cookie 또는
   `Cf-Access-Jwt-Assertion`의 Access application token을 가져옴
3. Cloudflare team domain의
   `/cdn-cgi/access/get-identity`에 token을 전달해 검증
4. 검증 성공 시 API 허용
5. 마지막으로 localhost/비상용 `API_TOKEN` Bearer fallback

TEAM_DOMAIN:

```text
https://muddy-cell-7eaa.cloudflareaccess.com
```

이 값은 비밀값이 아니며 Wrangler 일반 변수로 배포됩니다.

## 적용 후

```powershell
cd C:\dev\ERI-DI-ERI
npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
npx.cmd wrangler deploy
```

그 다음 `eri.issssm.com`을 새로고침합니다.

정상이라면 개발용 API 토큰을 비워둔 상태에서도
클라우드 데이터 실험실의 인증 오류가 사라지고 D1/R2를 읽을 수 있습니다.
