# ERI DI-ERY Phase 5.5.1 — Mobile / Desktop PWA 분리

UI와 설치 앱을 두 가지로 나눕니다.

## 주소

```text
https://eri.issssm.com/mobile
https://eri.issssm.com/desktop
```

루트 `https://eri.issssm.com/`로 접속하면 기기 화면/포인터 특성을 보고
처음 한 번 적합한 주소로 자동 정리합니다.

## 휴대폰 앱

- 기존 하단 5버튼 내비게이션 유지
- 최대 폭 820px
- 터치 중심
- Manifest id: `/mobile`
- Start URL: `/mobile`
- 앱 이름: `ERI DI-ERY Mobile`
- 별도 휴대폰 배지 아이콘

## 컴퓨터 앱

- 고정 좌측 사이드바
- 최대 작업 폭 1220px
- 넓은 카드/설정 레이아웃
- 마우스 중심 내비게이션
- Manifest id: `/desktop`
- Start URL: `/desktop`
- 앱 이름: `ERI DI-ERY Desktop`
- 별도 모니터 배지 아이콘

## 데이터

두 앱은 저장소를 분리하지 않습니다.

```text
Mobile  ─┐
         ├→ 같은 Worker → 같은 D1 + 같은 R2
Desktop ─┘
```

휴대폰에서 급여 기록을 추가하면 컴퓨터 앱에도 그대로 보입니다.

## 앱 설치

`더보기 → 설정 → 앱 버전 · 설치`

에서 현재 앱 버전을 확인하고 휴대폰/컴퓨터 버전을 명시적으로 전환할 수 있습니다.

각 주소에서 설치하면 브라우저는 서로 다른 PWA id를 보기 때문에
Mobile과 Desktop을 각각 설치할 수 있습니다.

## 보안

기존 Phase 5.5 정책을 그대로 유지합니다.

- API 응답 캐시 안 함
- navigation HTML 캐시 안 함
- 정적 Vite asset + manifest/icon만 캐시
- Cloudflare Access가 계속 진입점

## 적용/검증

```powershell
cd C:\dev\ERI-DI-ERI

npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
npx.cmd wrangler deploy
```

배포 뒤:

1. PC에서 `https://eri.issssm.com/desktop`
2. 휴대폰에서 `https://eri.issssm.com/mobile`
3. 각각 `더보기 → 설정 → 앱 버전 · 설치`
4. 각 앱을 별도로 설치
5. 한쪽에서 기록 1건 추가 후 다른 쪽에서 같은 기록 확인

## 다음 단계

이후 Desktop은 표/사이드 패널 중심으로 더 확장하고,
Mobile은 10~20초 기록 흐름을 더 짧게 다듬어도 데이터 계층은 건드릴 필요가 없습니다.
