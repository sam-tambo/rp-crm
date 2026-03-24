'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List, TrendingUp, DollarSign, Target, CheckCircle, XCircle, ChevronDown, ChevronUp, X, ExternalLink, Building2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Deal, DealStage } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import KanbanBoard from '@/components/crm/KanbanBoard'
import QuickCreateModal from '@/components/crm/QuickCreateModal'

/* ── constants ─────────────────────────────────────── */
const STAGES: { key: DealStage; label: string; bg: string; color: string }[] = [
  { key: 'prospecting',   label: 'Prospecting',   bg: '#F3F4F6', color: '#6B7280' },
  { key: 'qualification', label: 'Qualification', bg: '#EEF0FF', color: '#6366F1' },
  { key: 'proposal',      label: 'Proposal',      bg: '#FFF4E6', color: '#F97316' },
  { key: 'negotiation',   label: 'Negotiation',   bg: '#FFF9E6', color: '#EAB308' },
  { key: 'closed_won',    label: 'Closed Won',    bg: '#EEF7F2', color: '#1aaa5e' },
  { key: 'closed_lost',   label: 'Closed Lost',   bg: '#FFF1F1', color: '#EF4444' },
]

/* ── StageBadge ───────────────────────────────────── */
function StageBadge({ stage }: { stage: DealStage }) {
  const s = STAGES.find(x => x.key === stage)
  if (!s) return <span style={{ color: '#6B7280', fontSize: 12 }}>{stage}</span>
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

/* ── FilterSection ────────────────────────────────── */
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid #E8F0EB' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{ color: '#8aaa98' }} onClick={() => setOpen(!open)}>
        {title}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="px-4 pb-3 space-y-1.5">{children}</div>}
    </div>
  )
}

/* ── FCheck ───────────────────────────────────────── */
function FCheck({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-0.5 group">
      <div className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: checked ? '#1aaa5e' : 'transparent', borderColor: checked ? '#1aaa5e' : '#D4E8DC' }}>
        {checked && <div className="w-2 h-2 rounded-sm bg-white" />}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-xs group-hover:text-[#191D25] transition-colors" style={{ color: color ?? '#638070' }}>{label}</span>
    </label>
  )
}

/* ── Main page ────────────────────────────────────── */
export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStage, setDefaultStage] = useState<DealStage>('prospecting')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sortCol, setSortCol] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<{ stages: string[]; minProb: number; maxProb: number }>({ stages: [], minProb: 0, maxProb: 100 })
  const router = useRouter()
  const supabase = createClient()

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deals')
      .select('*, company:companies(id,name), contact:contacts(id,first_name,last_name)')
      .order('created_at', { ascending: false })
    setDeals(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  function openModal(stage: DealStage = 'prospecting') {
    setDefaultStage(stage)
    setModalOpen(true)
  }

  function toggleStage(stage: string) {
    setFilters(f => ({ ...f, stages: f.stages.includes(stage) ? f.stages.filter(s => s !== stage) : [...f.stages, stage] }))
  }

  function clearFilters() {
    setFilters({ stages: [], minProb: 0, maxProb: 100 })
  }

  const activeFilterCount = filters.stages.length + (filters.minProb > 0 ? 1 : 0) + (filters.maxProb < 100 ? 1 : 0)

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (filters.stages.length > 0 && !filters.stages.includes(d.stage)) return false
      const prob = d.probability ?? 0
      if (prob < filters.minProb || prob > filters.maxProb) return false
      return true
    }).sort((a, b) => {
      let av: any, bv: any
      if (sortCol === 'name') { av = a.name; bv = b.name }
      else if (sortCol === 'value') { av = a.value ?? 0; bv = b.value ?? 0 }
      else if (sortCol === 'probability') { av = a.probability ?? 0; bv = b.probability ?? 0 }
      else if (sortCol === 'close_date') { av = a.close_date ?? ''; bv = b.close_date ?? '' }
      else { av = a.created_at; bv = b.created_at }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [deals, filters, sortCol, sortDir])

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  /* pipeline stats */
  const activeDeals = deals.filter(d => d.stage !== 'closed_lost')
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.value ?? 0), 0)
  const wonDeals = deals.filter(d => d.stage === 'closed_won')
  const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0)
  const avgProb = activeDeals.length > 0 ? Math.round(activeDeals.reduce((s, d) => s + (d.probability ?? 0), 0) / activeDeals.length) : 0

  const SortIcon = ({ col }: { col: string }) => sortCol === col
    ? <span style={{ color: '#1aaa5e' }}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    : <span style={{ color: '#D4E8DC' }}> ↕</span>

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFCFB' }}>
      <TopBar
        title="Deals"
        breadcrumb={[{ label: 'Deals' }]}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
              <button onClick={() => setView('kanban')} className="p-2 transition-colors"
                style={{ background: view === 'kanban' ? '#EEF7F2' : 'transparent', color: view === 'kanban' ? '#191D25' : '#638070' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')} className="p-2 transition-colors"
                style={{ background: view === 'list' ? '#EEF7F2' : 'transparent', color: view === 'list' ? '#191D25' : '#638070', borderLeft: '1px solid #D4E8DC' }}>
                <List size={14} />
              </button>
            </div>
            <button onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: '#1aaa5e', color: 'white' }}>
              <Plus size={14} /> New Deal
            </button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="px-6 py-3 flex items-center gap-6" style={{ background: '#FFFFFF', borderBottom: '1px solid #E8F0EB' }}>
        <div className="flex items-center gap-2">
          <DollarSign size={14} style={{ color: '#9abaaa' }} />
          <span className="text-sm font-semibold" style={{ color: '#191D25' }}>{formatCurrency(totalPipeline)}</span>
          <span className="text-xs" style={{ color: '#8aaa98' }}>total pipeline</span>
        </div>
        <div className="w-px h-4" style={{ background: '#E8F0EB' }} />
        <div className="flex items-center gap-2">
          <CheckCircle size={14} style={{ color: '#1aaa5e' }} />
          <span className="text-sm font-semibold" style={{ color: '#191D25' }}>{formatCurrency(wonValue)}</span>
          <span className="text-xs" style={{ color: '#8aaa98' }}>closed won ({wonDeals.length})</span>
        </div>
        <div className="w-px h-4" style={{ background: '#E8F0EB' }} />
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: '#9abaaa' }} />
          <span className="text-sm font-semibold" style={{ color: '#191D25' }}>{avgProb}%</span>
          <span className="text-xs" style={{ color: '#8aaa98' }}>avg probability</span>
        </div>
        <div className="w-px h-4" style={{ background: '#E8F0EB' }} />
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: '#9abaaa' }} />
          <span className="text-sm font-semibold" style={{ color: '#191D25' }}>{deals.length}</span>
          <span className="text-xs" style={{ color: '#8aaa98' }}>total deals</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar — list view only */}
        {view === 'list' && sidebarOpen && (
          <div className="w-52 flex-shrink-0 overflow-y-auto" style={{ background: '#FFFFFF', borderRight: '1px solid #E8F0EB' }}>
            {/* Filter header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E8F0EB' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8aaa98' }}>
                Filters {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-white" style={{ background: '#1aaa5e', fontSize: 10 }}>{activeFilterCount}</span>}
              </span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs" style={{ color: '#EF4444' }}>Clear</button>
              )}
            </div>

            <FilterSection title="Stage">
              {STAGES.map(s => (
                <FCheck key={s.key} label={s.label} checked={filters.stages.includes(s.key)} onChange={() => toggleStage(s.key)} color={s.color} />
              ))}
            </FilterSection>

            <FilterSection title="Probability" defaultOpen={false}>
              <div className="text-xs mb-1" style={{ color: '#8aaa98' }}>{filters.minProb}% – {filters.maxProb}%</div>
              <input type="range" min={0} max={100} step={10} value={filters.minProb} onChange={e => setFilters(f => ({ ...f, minProb: +e.target.value }))}
                className="w-full" style={{ accentColor: '#1aaa5e' }} />
              <input type="range" min={0} max={100} step={10} value={filters.maxProb} onChange={e => setFilters(f => ({ ...f, maxProb: +e.target.value }))}
                className="w-full" style={{ accentColor: '#1aaa5e' }} />
            </FilterSection>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-3 w-full max-w-lg">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#EEF7F2' }} />)}
              </div>
            </div>
          ) : view === 'kanban' ? (
            <KanbanBoard deals={deals} onAddDeal={openModal} onRefresh={fetchDeals} />
          ) : (
            <>
              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.stages.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: '#EEF7F2', color: '#1aaa5e', border: '1px solid #D4E8DC' }}>
                      {STAGES.find(x => x.key === s)?.label ?? s}
                      <button onClick={() => toggleStage(s)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8F0EB' }}>
                <table className="w-full border-collapse">
                  <thead style={{ background: '#F8FBF9' }}>
                    <tr>
                      {[
                        { col: 'name', label: 'Deal' },
                        { col: 'company', label: 'Company' },
                        { col: 'contact', label: 'Contact' },
                        { col: 'value', label: 'Value' },
                        { col: 'stage', label: 'Stage' },
                        { col: 'probability', label: 'Probability' },
                        { col: 'close_date', label: 'Close Date' },
                      ].map(({ col, label }) => (
                        <th key={col}
                          className="text-left px-4 py-3 cursor-pointer select-none hover:bg-[#EEF7F2] transition-colors"
                          style={{ color: '#8aaa98', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8F0EB' }}
                          onClick={() => ['name','value','probability','close_date'].includes(col) && handleSort(col)}>
                          {label}<SortIcon col={col} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ background: '#FFFFFF' }}>
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <TrendingUp size={28} style={{ color: '#D4E8DC', margin: '0 auto 8px' }} />
                          <p className="text-sm" style={{ color: '#8aaa98' }}>No deals found</p>
                        </td>
                      </tr>
                    ) : filteredDeals.map(deal => (
                      <tr key={deal.id}
                        className="cursor-pointer group hover:bg-[#FAFCFB] transition-colors"
                        style={{ borderBottom: '1px solid #F0F7F3' }}
                        onClick={() => router.push(`/deals/${deal.id}`)}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium group-hover:text-[#1aaa5e] transition-colors" style={{ color: '#191D25' }}>{deal.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          {(deal as any).company ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md" style={{ background: '#EEF7F2', color: '#1aaa5e', width: 'fit-content' }}>
                              <Building2 size={10} /> {(deal as any).company.name}
                            </span>
                          ) : <span className="text-sm" style={{ color: '#9abaaa' }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#638070' }}>
                          {(deal as any).contact ? `${(deal as any).contact.first_name} ${(deal as any).contact.last_name}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1aaa5e' }}>{formatCurrency(deal.value)}</td>
                        <td className="px-4 py-3"><StageBadge stage={deal.stage as DealStage} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#E5E7EB' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${deal.probability ?? 0}%`, background: (deal.probability ?? 0) >= 70 ? '#1aaa5e' : (deal.probability ?? 0) >= 40 ? '#F59E0B' : '#EF4444' }} />
                            </div>
                            <span className="text-xs" style={{ color: '#638070' }}>{deal.probability ?? 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#638070' }}>{formatDate(deal.close_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDeals.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#8aaa98' }}>{filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}{activeFilterCount > 0 ? ' (filtered)' : ''}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuickCreateModal type="deal" open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchDeals} />
    </div>
  )
}
