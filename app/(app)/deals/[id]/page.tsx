'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Deal, Activity } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import StatusBadge from '@/components/crm/StatusBadge'
import ActivityFeed from '@/components/crm/ActivityFeed'

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<'overview' | 'activity'>('overview')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [dealRes, activitiesRes] = await Promise.all([
      supabase.from('deals').select('*, company:companies(id,name), contact:contacts(id,first_name,last_name)').eq('id', id).single(),
      supabase.from('activities').select('*').eq('entity_type', 'deal').eq('entity_id', id).order('created_at', { ascending: false }),
    ])
    setDeal(dealRes.data)
    setActivities(activitiesRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function updateField(field: string, value: any) {
    const { error } = await supabase.from('deals').update({ [field]: value }).eq('id', id)
    if (error) { toast.error('Failed to update') } else {
      toast.success('Updated')
      setDeal(prev => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading || !deal) return (
    <div className="flex flex-col h-full">
      <TopBar title="Loading..." breadcrumb={[{ label: 'Deals', href: '/deals' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-sm" style={{ color: '#8aaa98' }}>Loading...</div></div>
    </div>
  )

  const tabStyle = (t: string) => ({ padding: '8px 16px', fontSize: '13px', fontWeight: tab === t ? 500 : 400, color: tab === t ? '#191D25' : '#638070', borderBottom: tab === t ? '2px solid #1aaa5e' : '2px solid transparent', cursor: 'pointer' as const })

  return (
    <div className="flex flex-col h-full">
      <TopBar title={deal.name} breadcrumb={[{ label: 'Deals', href: '/deals' }, { label: deal.name }]}
        action={<button onClick={() => router.push('/deals')} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md hover:bg-white/5" style={{ color: '#638070' }}><ArrowLeft size={14} /> Back</button>} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 max-w-6xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: '#191D25' }}>{deal.name}</h1>
                <p className="text-xl font-bold mt-1" style={{ color: '#10B981' }}>{formatCurrency(deal.value)}</p>
              </div>
            </div>
            <div className="flex border-b mb-6" style={{ borderColor: '#D4E8DC' }}>
              {(['overview', 'activity'] as const).map(t => (
                <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            {tab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Value (€)</div>
                    <input type="number" defaultValue={deal.value} className="w-full px-2 py-1 text-sm rounded-md outline-none"
                      style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
                      onFocus={e => e.target.style.borderColor = '#1aaa5e'}
                      onBlur={e => { e.target.style.borderColor = '#D4E8DC'; updateField('value', parseFloat(e.target.value) || 0) }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Stage</div>
                    <select value={deal.stage} onChange={e => updateField('stage', e.target.value)} className="w-full px-2 py-1 text-sm rounded-md outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}>
                      {['prospecting','qualification','proposal','negotiation','closed_won','closed_lost'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#8aaa98' }}>Probability: <span style={{ color: '#1aaa5e' }}>{deal.probability}%</span></div>
                    <input type="range" min="0" max="100" value={deal.probability}
                      onChange={e => setDeal(prev => prev ? { ...prev, probability: parseInt(e.target.value) } : prev)}
                      onMouseUp={e => updateField('probability', parseInt((e.target as HTMLInputElement).value))}
                      className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Close Date</div>
                    <input type="date" defaultValue={deal.close_date ?? ''} className="w-full px-2 py-1 text-sm rounded-md outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25', colorScheme: 'dark' }}
                      onBlur={e => updateField('close_date', e.target.value || null)} />
                  </div>
                </div>
                {(deal as any).company && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Company</div>
                    <button onClick={() => router.push(`/companies/${deal.company_id}`)} className="text-sm hover:underline" style={{ color: '#1aaa5e' }}>{(deal as any).company.name}</button>
                  </div>
                )}
                {(deal as any).contact && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Contact</div>
                    <button onClick={() => router.push(`/contacts/${deal.contact_id}`)} className="text-sm hover:underline" style={{ color: '#1aaa5e' }}>{(deal as any).contact.first_name} {(deal as any).contact.last_name}</button>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: '#8aaa98' }}>Description</div>
                  <textarea rows={3} defaultValue={deal.description ?? ''} className="w-full px-2 py-1.5 text-sm rounded-md outline-none resize-none"
                    style={{ background: 'transparent', border: '1px solid transparent', color: '#191D25' }}
                    onFocus={e => e.target.style.borderColor = '#D4E8DC'}
                    onBlur={e => { e.target.style.borderColor = 'transparent'; updateField('description', e.target.value) }}
                    placeholder="Add a description..." />
                </div>
              </div>
            )}
            {tab === 'activity' && <ActivityFeed activities={activities} entityType="deal" entityId={id} onRefresh={fetchAll} />}
          </div>
          <div className="w-72 flex-shrink-0">
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8aaa98' }}>Properties</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#638070' }}>Stage</span>
                  <StatusBadge type="deal" value={deal.stage} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#638070' }}>Probability</span>
                  <span className="text-xs" style={{ color: '#1aaa5e' }}>{deal.probability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#638070' }}>Created</span>
                  <span className="text-xs" style={{ color: '#191D25' }}>{formatDate(deal.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#638070' }}>Updated</span>
                  <span className="text-xs" style={{ color: '#191D25' }}>{formatDate(deal.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
