import Link from 'next/link'

interface TopBarProps {
  title: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export default function TopBar({ title, action, breadcrumb }: TopBarProps) {
  return (
    <div className="h-12 flex items-center justify-between px-6" style={{ borderBottom: '1px solid #EBEBF0', background: '#FFFFFF' }}>
      <div className="flex items-center gap-2 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B0B0C8' }}>
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: '#D0D0E0' }}>/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-gray-600 transition-colors" style={{ color: i === breadcrumb.length - 1 ? '#6B7280' : '#B0B0C8' }}>
                    {b.label}
                  </Link>
                ) : (
                  <span style={{ color: i === breadcrumb.length - 1 ? '#374151' : '#B0B0C8', fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>
                    {b.label}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        {!breadcrumb && (
          <h1 className="text-sm font-semibold" style={{ color: '#111118' }}>{title}</h1>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
