'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import StatusBadge from '@/components/crm/StatusBadge'
import QuickCreateModal from '@/components/crm/QuickCreateModal'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    setCompanies(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.domain ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const thStyle = { color: '#8aaa98', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '10px 16px', borderBottom: '1px solid #D4E8DC', whiteSpace: 'nowrap' as const }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #EEF7F2', fontSize: '13px', color: '#191D25' }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Companies"
        breadcrumb={[{ label: 'Companies' }]}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium"
            style={{ background: '#1aaa5e', color: 'white' }}
          >
            <Plus size={14} /> New Company
          </button>
        }
      />

      <div className="flex-1 p-6">
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8aaa98' }} />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md outline-none"
              style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
              placeholder="Search companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs" style={{ color: '#8aaa98' }}>{filtered.length} companies</span>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
          <table className="w-full border-collapse">
            <thead style={{ background: '#F8FBF9' }}>
              <tr>
                <th style={thStyle} className="text-left">Name</th>
                <th style={thStyle} className="text-left">Domain</th>
                <th style={thStyle} className="text-left">Industry</th>
                <th style={thStyle} className="text-left">Employees</th>
                <th style={thStyle} className="text-left">Status</th>
                <th style={thStyle} className="text-left">Created</th>
              </tr>
            </thead>
            <tbody style={{ background: '#FFFFFF' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={tdStyle}>
                        <div className="h-4 rounded animate-pulse" style={{ background: '#EEF7F2', width: j === 0 ? '120px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Building2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#638070' }} />
                    <p className="text-sm" style={{ color: '#8aaa98' }}>No companies yet</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-3 px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: '#1aaa5e', color: 'white' }}
                    >
                      Add your first company
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(company => (
                  <tr
                    key={company.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => router.push(`/companies/${company.id}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FBF9'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ background: '#EEF7F2', color: '#1aaa5e' }}>
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{company.domain ?? '—'}</td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{company.industry ?? '—'}</td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{company.employee_count ?? '—'}</td>
                    <td style={tdStyle}><StatusBadge type="company" value={company.status} /></td>
                    <td style={{ ...tdStyle, color: '#8aaa98' }}>{formatDate(company.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuickCreateModal type="company" open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchCompanies} />
    </div>
  )
}
