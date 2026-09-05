type Tab =
  | 'today'
  | 'calendar'
  | 'record'
  | 'album'
  | 'more'

type Props = {
  current: Tab
  onChange: (tab: Tab) => void
}

const items: Array<{
  key: Tab
  icon: string
  label: string
  hint: string
}> = [
  {
    key: 'today',
    icon: '⌂',
    label: '오늘',
    hint: '오늘의 상태',
  },
  {
    key: 'calendar',
    icon: '▦',
    label: '달력',
    hint: '기록 모아보기',
  },
  {
    key: 'record',
    icon: '+',
    label: '기록 추가',
    hint: '오늘 바로 적기',
  },
  {
    key: 'album',
    icon: '▣',
    label: '앨범',
    hint: '에리 사진',
  },
  {
    key: 'more',
    icon: '⋯',
    label: '더보기',
    hint: '통계 · 설정',
  },
]

export default function DesktopNav({
  current,
  onChange,
}: Props) {
  return (
    <aside
      className="desktop-nav"
      aria-label="컴퓨터 앱 주요 메뉴"
    >
      <div className="desktop-brand">
        <img
          src="/icons/icon-desktop-192.png"
          alt=""
          aria-hidden="true"
        />

        <div>
          <span>ERI DI-ERY</span>
          <strong>Desktop</strong>
        </div>
      </div>

      <nav className="desktop-nav-list">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={
              current === item.key
                ? 'desktop-nav-item active'
                : 'desktop-nav-item'
            }
            onClick={() =>
              onChange(item.key)
            }
            aria-current={
              current === item.key
                ? 'page'
                : undefined
            }
          >
            <span
              className="desktop-nav-icon"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <span className="desktop-nav-copy">
              <strong>
                {item.label}
              </strong>
              <small>
                {item.hint}
              </small>
            </span>
          </button>
        ))}
      </nav>

      <div className="desktop-nav-foot">
        <span>🦎</span>
        <p>
          에리 기록은 휴대폰 앱과
          같은 온라인 기록/사진 보관함을 사용해요.
        </p>
      </div>
    </aside>
  )
}
