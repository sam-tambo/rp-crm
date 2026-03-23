'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Contact, Deal, Activity } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import StatusBadge from '@/components/crm/StatusBadge'
import ActivityFeed from '@/components/crm/ActivityFeed'

function InlineField({ label, value, onSave, type = 'text' }: { label: string; value: string | null; onSave: (v: string) => void; type?: string }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  function handleBlur() { setEditing(false); if (val !== (value ?? '')) onSave(val) }
  return (
    <div>
      <div className="text-xs font-medium mb-1" style={{ color: '#5A5A70' }}>{label}</div>
      {editing ? (
        <input autoFocus type={type} value={val} onChange={e => setVal(e.target.value)} onBlur={handleBlur} onKeyDown={e => { if (e.key === 'Enter') handleBlur() }}
          className="w-full px-2 py-1 text-sm rounded-md outline-none" style={{ background: '#1A1A24', border: '1px solid #6366F1', color: '#F4F4F8' }} />
      ) : (
        <div className="text-sm py-1 px-2 rounded-md cursor-text hover:bg-white/5 transition-colors min-h-[28px]" style={{ color: val ? '#F4F4F8' : '#5A5A70' }} onClick={() => setEditing(true)}>
          {val || <span style={{ color: '#5A5A70' }}>Click to edit</span>}
        </div>
      )}
    </div>
  )
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<'overview' | 'activity' | 'deals'>('overview')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [contactRes, dealsRes, activitiesRes] = await Promise.all([
      supabase.from('contacts').select('*, company:companies(id,name)').eq('id', id).single(),
      supabase.from('deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('entity_type', 'contact').eq('entity_id', id).order('created_at', { ascending: false }),
    ])
    setContact(contactRes.data)
    setDeals(dealsRes.data ?? [])
    setActivities(activitiesRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function updateField(field: string, value: string | null) {
    const { error } = await supabase.from('contacts').update({ [field]: value }).eq('id', id)
    if (error) { toast.error('Failed to update') } else {
      toast.success('Updated')
      setContact(prev => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading || !contact) return (
    <div className="flex flex-col h-full">
      <TopBar title="Loading..." breadcrumb={[{ label: 'Contacts', href: '/contacts' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-sm" style={{ color: '#5A5A70' }}>Loading...</div></div>
    </div>
  )

  const tabStyle = (t: string) => ({ padding: '8px 16px', fontSize: '13px', fontWeight: tab === t ? 500 : 400, color: tab === t ? '#F4F4F8' : '#9090A8', borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent', cursor: 'pointer' as const })

  return (
    <div className="flex flex-col h-full">
      <TopBar title={`${contact.first_name} ${contact.last_name}`} breadcrumb={[{ label: 'Contacts', href: '/contacts' }, { label: `${contact.first_name} ${contact.last_name}` }]}
        action={<button onClick={() => router.push('/contacts')} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md hover:bg-white/5" style={{ color: '#9090A8' }}><ArrowLeft size={14} /> Back</button>} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 max-w-6xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold" style={{ background: '#1A1A24', color: '#8B5CF6' }}>
                {contact.first_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: '#F4F4F8' }}>{contact.first_name} {contact.last_name}</h1>
                <p className="text-sm" style={{ color: '#9090A8' }}>{contact.job_title ?? ''}{contact.job_title && (contact as any).company ? ' at ' : ''}{(contact as any).company?.name ?? ''}</p>
              </div>
            </div>
            <div className="flex border-b mb-6" style={{ borderColor: '#2A2A38' }}>
              {(['overview', 'activity', 'deals'] as const).map(t => (
                <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                <InlineField label="Email" value={contact.email} onSave={v => updateField('email', v)} type="email" />
                <InlineField label="Phone" value={contact.phone} onSave={v => updateField('phone', v)} type="tel" />
                <InlineField label="Job Title" value={contact.job_title} onSave={v => updateField('job_title', v)} />
                <InlineField label="Department" value={contact.department} onSave={v => updateField('department', v)} />
                <InlineField label="LinkedIn URL" value={contact.linkedin_url} onSave={v => updateField('linkedin_url', v)} />
                <div className="col-span-2">
                  <div className="text-xs font-medium mb-1" style={{ color: '#5A5A70' }}>Notes</div>
                  <textarea className="w-full px-2 py-1.5 text-sm rounded-md outline-none resize-none" style={{ background: 'transparent', border: '1px solid transparent', color: '#F4F4F8' }}
                    rows={3} defaultValue={contact.notes ?? ''}
                    onFocus={e => e.target.style.borderColor = '#2A2A38'}
                    onBlur={e => { e.target.style.borderColor = 'transparent'; updateField('notes', e.target.value) }}
                    placeholder="Add notes..." />
                </div>
              </div>
            )}
            {tab === 'activity' && <ActivityFeed activities={activities} entityType="contact" entityId={id} onRefresh={fetchAll} />}
            {tab === 'deals' && (
              deals.length === 0 ? <p className="text-sm" style={{ color: '#5A5A70' }}>No deals linked</p> : (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A38' }}>
                  <table className="w-full border-collapse">
                    <thead style={{ background: '#111118' }}>
                      <tr>{['Deal', 'Value', 'Stage', 'Close Date'].map(h => <th key={h} className="text-left px-4 py-2.5" style={{ color: '#5A5A70', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2A2A38' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody style={{ background: '#0A0A0F' }}>
                      {deals.map(d => (
                        <tr key={d.id} className="cursor-pointer hover:bg-white/5" onClick={() => router.push(`/deals/${d.id}`)}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: '#F4F4F8', borderBottom: '1px solid #1A1A24' }}>{d.name}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#10B981', borderBottom: '1px solid #1A1A24' }}>{formatCurrency(d.value)}</td>
                          <td className="px-4 py-3" style={{ borderBottom: '1px solid #1A1A24' }}><StatusBadge type="deal" value={d.stage} /></td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#9090A8', borderBottom: '1px solid #1A1A24' }}>{formatDate(d.close_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
          <div className="w-72 flex-shrink-0">
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#111118', border: '1px solid #2A2A38' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5A5A70' }}>Properties</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#9090A8' }}>Status</span>
                  <select value={contact.status} onChange={e => updateField('status', e.target.value)} className="text-xs rounded px-2 py-1 outline-none" style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#F4F4F8' }}>
                    <option value="lead">Lead</option>
                    <option value="active">Active</option>
                    <option value="customer">Customer</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#9090A8' }}>Created</span>
                  <span className="text-xs" style={{ color: '#F4F4F8' }}>{formatDate(contact.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
