interface TopBarProps {
  title: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export default function TopBar({ title, action, breadcrumb }: TopBarProps) {
  return (
    <div className="h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid #2A2A38', background: '#0A0A0F' }}>
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: '#5A5A70' }}>
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span style={{ color: i === breadcrumb.length - 1 ? '#9090A8' : '#5A5A70' }}>{b.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-base font-semibold" style={{ color: '#F4F4F8' }}>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
