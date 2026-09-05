# ERI DI-ERY Phase 4.3 — 서버화 전 안정화

Phase 4.2까지의 코드를 전체 점검하고,
Cloudflare 단계 전에 안전하게 고칠 수 있는 부분만 정리한 패치입니다.

## 적용

ZIP 내용을:

`C:\dev\ERI-DI-ERI`

에 덮어씁니다.

그 다음 PowerShell에서 프로젝트 폴더로 이동해:

```powershell
.\cleanup_phase4_3.ps1
```

을 한 번 실행하세요.

실행정책 때문에 막히면 두 파일만 직접 삭제해도 됩니다.

```text
src\test-shims.d.ts
src\pages\DayDetailPage.tsx
```

`test-shims.d.ts`는 tsconfig에서도 제외해두어서,
스크립트를 당장 실행하지 못해도 실제 타입 검사에는 들어가지 않습니다.

## 주요 수정

- Asia/Seoul 날짜 경계 통일
- 날씨 0% 강수 표시 정리
- 외부 날씨 관리 문구 보수화
- 사용하지 않는 지역검색 코드 제거
- 4시간 날씨 잔여 CSS 제거
- 전체 백업 사진 누락 검증
- 앨범 이미지 지연 로딩
- IndexedDB 용량 부족 안내
- 급여량 라벨 상수 중복 제거
- 임시 테스트 shim 생산 코드에서 제외

자세한 내용은 `AUDIT_PHASE4_3.md`를 참고하세요.
