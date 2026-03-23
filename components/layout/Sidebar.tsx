'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Users, BarChart2, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/deals', icon: BarChart2, label: 'Deals' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Signed out')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-50" style={{ background: '#0D0D14', borderRight: '1px solid #2A2A38' }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid #2A2A38' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#6366F1' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 6V10L8 14L2 10V6L8 2Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <span className="font-semibold text-sm" style={{ color: '#F4F4F8' }}>RP CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative"
              style={{
                color: active ? '#F4F4F8' : '#9090A8',
                background: active ? '#1A1A24' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#1A1A24' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#6366F1' }} />
              )}
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid #2A2A38' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
          style={{ color: '#9090A8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1A1A24'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
          style={{ color: '#9090A8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1A1A24'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
