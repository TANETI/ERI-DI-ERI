# ERI DI-ERY Phase 5.5.2 — 저장소 용어 쉽게 풀기

사용자 화면에서 Cloudflare 내부 제품명을 전면에 내세우지 않도록 정리합니다.

## 화면에서 쓰는 말

| 쉬운 표현 | 내부 기술 이름 |
| --- | --- |
| 온라인 기록 보관함 | Cloudflare D1 |
| 온라인 사진 보관함 | Cloudflare R2 |
| 온라인 서버 | Cloudflare Worker |
| 로그인 보호 | Cloudflare Access |
| 개발용 연결 암호 | API token |
| 이 기기 기록/사진 | localStorage / IndexedDB |

기술 이름은 `온라인 저장소 관리` 카드 안의 작은 도움말에만 남깁니다.

## 변경 예

```text
로컬 기록 → D1
```

→

```text
이 기기 기록 → 온라인 보관함
```

```text
R2 사진 확인
```

→

```text
온라인 사진 확인
```

앱 상단의 저장소 상태도:

```text
기록: 온라인 보관함 · 사진: 온라인 보관함
```

처럼 표시합니다.

## 기능 변화

없습니다.

D1/R2/Worker/Access의 실제 구조와 API는 그대로 유지하고,
사용자에게 보이는 문구만 이해하기 쉽게 바꿉니다.

## 적용

```powershell
cd C:\dev\ERI-DI-ERI
npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
npx.cmd wrangler deploy
```
