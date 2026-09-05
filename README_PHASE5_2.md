# ERI DI-ERY Phase 5.2 — CloudflareRepository + Local → D1

## PowerShell 창은 꺼도 됩니다

Phase 5.1 테스트에 사용한 PowerShell 창은 모두 종료해도 됩니다.

- `wrangler dev` 종료 → 로컬 Worker 프로세스만 종료
- 로컬 D1 상태 → 프로젝트의 `.wrangler/state`에 유지
- migration 적용 상태 → 유지
- `.dev.vars` → 파일로 유지
- remote D1 → Cloudflare에 그대로 유지

다시 테스트할 때 `npx.cmd wrangler dev`를 켜면 됩니다.

## 이번 단계의 저장 구조

### Local mode

```text
structured data → localStorage
photos          → IndexedDB
```

### Cloud mode

```text
structured data → Worker → D1
photos          → IndexedDB
```

사진은 Phase 5.3에서 R2로 이동합니다.

## 새 기능

`더보기 → 설정 → 클라우드 데이터 실험실`

여기서:

1. Worker API 주소 설정
2. 개발용 API 토큰 입력
3. 연결 확인
4. 현재 로컬 구조화 기록을 D1에 최초 업로드
5. Local / Cloud 모드 전환

을 할 수 있습니다.

## 개발용 API 토큰

토큰은 `sessionStorage`에만 저장합니다.

- reload에서는 유지
- 현재 탭을 닫으면 제거
- localStorage에는 저장하지 않음
- source code에는 하드코딩하지 않음

실제 배포에서는 이 방식 대신 Cloudflare Access 인증으로 교체할 예정입니다.

## Local → D1 업로드

`로컬 기록 → D1`은 현재 localStorage 구조화 기록을 snapshot으로 읽어
`PUT /api/v1/snapshot`으로 보냅니다.

D1의 구조화 기록 전체가 교체되기 때문에 확인창을 표시합니다.
사진은 업로드하지 않습니다.

## Cloud mode

Cloud mode를 누르기 전에 protected snapshot을 한 번 읽어
인증과 D1 접근을 검증합니다.

성공 후 reload하면:

- 앱 시작 데이터 → D1
- 급여/체중/TMI/배변/설정/평가/관리결정 저장 → D1
- 사진 → 여전히 로컬 IndexedDB

가 됩니다.

## Local mode 복귀

언제든 Local mode로 돌아갈 수 있습니다.

단, Phase 5.2는 양방향 동기화가 아니라 **저장소 선택** 방식입니다.
Cloud mode에서 바뀐 D1 데이터는 기존 localStorage로 자동 복사되지 않습니다.

## 로컬 테스트

터미널 A:

```powershell
npx.cmd wrangler dev
```

터미널 B:

```powershell
npm.cmd run dev
```

브라우저에서 기본 Vite 주소 `http://localhost:5173`을 열고
클라우드 데이터 실험실에서:

- API 주소: `http://localhost:8787`
- 개발용 토큰: `.dev.vars`의 API_TOKEN

을 입력합니다.

권장 순서:

1. 연결 확인
2. 전체 백업 하나 생성
3. 로컬 기록 → D1
4. 다시 연결 확인
5. Cloud mode 전환
6. 기록 하나를 시험 저장
7. 새로고침 후 유지 여부 확인

## 이번 패치의 Worker 수정

Cloud mode의 fetch는 향후 Cloudflare Access cookie까지 사용할 수 있도록
`credentials: include`를 사용합니다.

따라서 Worker CORS에:

```text
Access-Control-Allow-Credentials: true
```

를 추가했습니다.

## 적용

ZIP 내용을 `C:\dev\ERI-DI-ERI`에 덮어쓴 뒤:

```powershell
npm.cmd run build
npx.cmd tsc -p .\worker\tsconfig.json
```

을 실행하세요.
