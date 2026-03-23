'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Deal, DealStage } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import StatusBadge from '@/components/crm/StatusBadge'
import KanbanBoard from '@/components/crm/KanbanBoard'
import QuickCreateModal from '@/components/crm/QuickCreateModal'

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStage, setDefaultStage] = useState<DealStage>('prospecting')
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

  const thStyle = { color: '#8aaa98', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '10px 16px', borderBottom: '1px solid #D4E8DC' }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #EEF7F2', fontSize: '13px', color: '#191D25' }
  const totalValue = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + (d.value ?? 0), 0)

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Deals"
        breadcrumb={[{ label: 'Deals' }]}
        action={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
              <button onClick={() => setView('kanban')} className="p-2 transition-colors" style={{ background: view === 'kanban' ? '#EEF7F2' : 'transparent', color: view === 'kanban' ? '#191D25' : '#638070' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')} className="p-2 transition-colors" style={{ background: view === 'list' ? '#EEF7F2' : 'transparent', color: view === 'list' ? '#191D25' : '#638070', borderLeft: '1px solid #D4E8DC' }}>
                <List size={14} />
              </button>
            </div>
            <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium" style={{ background: '#1aaa5e', color: 'white' }}>
              <Plus size={14} /> New Deal
            </button>
          </div>
        }
      />

      <div className="px-6 py-2 flex items-center gap-4" style={{ borderBottom: '1px solid #D4E8DC' }}>
        <span className="text-xs" style={{ color: '#8aaa98' }}>{deals.length} deals</span>
        <span className="text-xs" style={{ color: '#8aaa98' }}>Pipeline: <span style={{ color: '#10B981' }}>{formatCurrency(totalValue)}</span></span>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-sm" style={{ color: '#8aaa98' }}>Loading deals...</div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard deals={deals} onAddDeal={openModal} onRefresh={fetchDeals} />
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D4E8DC' }}>
            <table className="w-full border-collapse">
              <thead style={{ background: '#F8FBF9' }}>
                <tr>
                  {['Deal', 'Company', 'Contact', 'Value', 'Stage', 'Probability', 'Close Date'].map(h => (
                    <th key={h} style={thStyle} className="text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: '#FFFFFF' }}>
                {deals.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-sm" style={{ color: '#8aaa98' }}>No deals yet</td></tr>
                ) : deals.map(deal => (
                  <tr key={deal.id} className="cursor-pointer" onClick={() => router.push(`/deals/${deal.id}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FBF9'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={tdStyle}><span className="font-medium">{deal.name}</span></td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{(deal as any).company?.name ?? '—'}</td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{(deal as any).contact ? `${(deal as any).contact.first_name} ${(deal as any).contact.last_name}` : '—'}</td>
                    <td style={{ ...tdStyle, color: '#10B981', fontWeight: 500 }}>{formatCurrency(deal.value)}</td>
                    <td style={tdStyle}><StatusBadge type="deal" value={deal.stage} /></td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{deal.probability}%</td>
                    <td style={{ ...tdStyle, color: '#638070' }}>{formatDate(deal.close_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickCreateModal type="deal" open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchDeals} />
    </div>
  )
}
