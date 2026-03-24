'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, Users, BarChart2, Settings, LogOut, Globe, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/deals', icon: TrendingUp, label: 'Deals' },
  { href: '/insights', icon: Globe, label: 'Market Insights' },
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
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-50" style={{ background: '#111118', borderRight: '1px solid #1E1E2A' }}>
      {/* Workspace header */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1E1E2A' }}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#1C1C28' }}>
          <img
            src="https://www.pocargil.pt/wp-content/uploads/2019/11/cropped-pocargil-favicon-32x32.png"
            alt="Pocargil"
            className="w-full h-full object-contain"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
              el.parentElement!.innerHTML = '<span style="color:#888;font-size:11px;font-weight:700;letter-spacing:0.05em">P</span>'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-none mb-0.5 truncate" style={{ color: '#F4F4F8' }}>Pocargil</div>
          <div className="text-xs truncate" style={{ color: '#4A4A60' }}>CRM workspace</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-1 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#3A3A50' }}>Workspace</span>
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative group"
              style={{
                color: active ? '#F4F4F8' : '#6868848',
                background: active ? '#1C1C28' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#181822' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full" style={{ width: 3, height: 18, background: '#059669' }} />
              )}
              <Icon size={15} style={{ color: active ? '#059669' : '#4A4A60', flexShrink: 0 }} />
              <span style={{ color: active ? '#F4F4F8' : '#7878a0' }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-2.5" style={{ borderTop: '1px solid #1E1E2A' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all"
          style={{ color: '#7878a0' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#181822'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <Settings size={15} style={{ color: '#4A4A60' }} />
          <span>Settings</span>
        </Link>
        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-md" style={{ background: '#181822' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ background: '#059669', color: '#fff' }}>
            F
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: '#A0A0BC' }}>filipe@pocargil.pt</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 rounded transition-all hover:bg-white/10"
          >
            <LogOut size={13} style={{ color: '#4A4A60' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
