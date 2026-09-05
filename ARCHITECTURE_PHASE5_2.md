# ERI DI-ERY Phase 5.2 Architecture

```text
                    AppRepository
                         │
                  local / cloud
             ┌───────────┴───────────┐
             │                       │
      LocalRepository       CloudflareRepository
             │                       │
      ┌──────┴──────┐                │ structured
      │             │                ▼
 localStorage   IndexedDB          Worker
                                      │
                                      ▼
                                      D1

Cloud mode photo methods
      │
      └──────────────→ LocalRepository → IndexedDB
```

Phase 5.3에서는 CloudflareRepository의 photo methods를 R2 API로 교체합니다.
