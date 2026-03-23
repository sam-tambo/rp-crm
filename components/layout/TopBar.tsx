interface TopBarProps {
  title: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export default function TopBar({ title, action, breadcrumb }: TopBarProps) {
  return (
    <div className="h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid #D4E8DC', background: '#FFFFFF' }}>
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: '#8aaa98' }}>
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span style={{ color: i === breadcrumb.length - 1 ? '#638070' : '#8aaa98' }}>{b.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-base font-semibold" style={{ color: '#191D25' }}>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
