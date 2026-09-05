# ERI DI-ERY Phase 5.5 — PWA 설치형 앱

`eri.issssm.com`을 휴대폰/PC 홈 화면에 설치할 수 있는 PWA로 만듭니다.

## 추가

- Web App Manifest
- 192 / 512 아이콘
- Maskable 512 아이콘
- Apple Touch Icon
- SVG favicon
- Service Worker
- 설정 → `앱 설치` 카드
- Chrome/Edge 설치 프롬프트
- iPhone/iPad Safari 설치 안내

## 보안 방향

Cloudflare Access를 우회하는 캐시를 만들지 않습니다.

Service Worker는:

- `/api/*`를 캐시하지 않음
- HTML navigation을 캐시하지 않음
- Vite의 해시된 `/assets/*`와 PWA 아이콘/manifest만 캐시

합니다.

따라서 Access 세션이 끝났는데 예전 index.html을 Service Worker가
오프라인으로 대신 보여주는 구조를 피합니다.

## 적용

ZIP 내용을 프로젝트 루트에 덮어쓴 뒤:

```powershell
cd C:\dev\ERI-DI-ERI

npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
npx.cmd wrangler deploy
```

## 확인

배포 후 `https://eri.issssm.com`을 새로고침하고:

`더보기 → 설정 → 앱 설치`

에서 확인합니다.

Chrome / Edge:
- `이 기기에 설치` 버튼 또는 주소창 설치 아이콘

iPhone / iPad:
- Safari → 공유 → 홈 화면에 추가

설치 후 아이콘으로 실행했을 때 주소창 없는 standalone 창으로 열리면 성공입니다.

## 다음 단계

Phase 5.6에서는 Web Push 구독 저장과 실제 일정 알림을 붙일 수 있습니다.
