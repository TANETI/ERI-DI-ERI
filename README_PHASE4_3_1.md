# ERI DI-ERY Phase 4.3.1 — 실제 npm build 오류 수정

사용자 PC의 `npm.cmd run build`에서 확인된 11개 오류를 기준으로 수정한 패치입니다.

## 원인 1 — 버려진 KMA 코드가 남아 있었음

기상청 API 전환을 보류하고 Open-Meteo로 돌아왔지만:

`src/lib/kmaWeather.ts`

파일 자체는 과거 패치에서 남아 있었습니다.

실행 코드에서는 import되지 않지만 TypeScript는 `src` 아래 파일을 전부 검사하기 때문에
현재 `WeatherSnapshot` / `AppSettings` 타입과 맞지 않는 KMA 파일에서 9개 오류가 발생했습니다.

이번 패치:
- `tsconfig.app.json`에서 해당 파일을 제외
- cleanup 스크립트로 실제 파일도 삭제

## 원인 2 — BlobPart / Uint8Array 타입 변화

TypeScript 5.9 DOM 타입에서는 TAR에서 읽은
`Uint8Array<ArrayBufferLike>`를 그대로 `new Blob([bytes])`에 넣을 수 없습니다.

사진 복원 전에 실제 `ArrayBuffer`로 복사한 뒤 Blob을 만들도록 수정했습니다.

## 원인 3 — MorePage 초기 Phase 4.3 파일

처음 배포한 4.3 ZIP에는 `setRecentDays()`의 날짜 정리 일부가 반영되기 전 버전이 들어갔습니다.

이번 패치는 MorePage를 최종 Asia/Seoul 날짜 헬퍼 버전으로 다시 덮어씁니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

그 다음 cleanup은 PowerShell에서 굳이 `.ps1` 파일을 더블클릭하지 말고
아래 한 줄로 실행할 수 있습니다.

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\cleanup_phase4_3_1.ps1
```

하지만 이번 패치의 tsconfig가 `kmaWeather.ts`를 이미 제외하므로,
cleanup 스크립트를 실행하지 않아도 build 자체는 막히지 않아야 합니다.

그 다음:

```powershell
npm.cmd run build
```

을 실행하세요.
