type Tab = 'today' | 'calendar' | 'record' | 'album' | 'more'

type Props = {
  current: Tab
  onChange: (tab: Tab) => void
}

export default function BottomNav({ current, onChange }: Props) {
  const items: Array<{ key: Tab; icon: string; label: string }> = [
    { key: 'today', icon: '⌂', label: '오늘' },
    { key: 'calendar', icon: '▦', label: '달력' },
    { key: 'record', icon: '+', label: '기록' },
    { key: 'album', icon: '▣', label: '앨범' },
    { key: 'more', icon: '⋯', label: '더보기' },
  ]

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((item) => (
        <button
          key={item.key}
          className={current === item.key ? 'nav-item active' : 'nav-item'}
          onClick={() => onChange(item.key)}
          aria-current={current === item.key ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
