'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Company, Contact, Deal, Activity } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import StatusBadge from '@/components/crm/StatusBadge'
import ActivityFeed from '@/components/crm/ActivityFeed'

function InlineField({ label, value, onSave, type = 'text' }: {
  label: string; value: string | null; onSave: (v: string) => void; type?: string
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')

  function handleBlur() {
    setEditing(false)
    if (val !== (value ?? '')) onSave(val)
  }

  return (
    <div>
      <div className="text-xs font-medium mb-1" style={{ color: '#5A5A70' }}>{label}</div>
      {editing ? (
        <input
          autoFocus
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === 'Enter') handleBlur() }}
          className="w-full px-2 py-1 text-sm rounded-md outline-none"
          style={{ background: '#1A1A24', border: '1px solid #6366F1', color: '#F4F4F8' }}
        />
      ) : (
        <div
          className="text-sm py-1 px-2 rounded-md cursor-text hover:bg-white/5 transition-colors min-h-[28px]"
          style={{ color: val ? '#F4F4F8' : '#5A5A70' }}
          onClick={() => setEditing(true)}
        >
          {val || <span style={{ color: '#5A5A70' }}>Click to edit</span>}
        </div>
      )}
    </div>
  )
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<'overview' | 'activity' | 'contacts' | 'deals'>('overview')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [companyRes, contactsRes, dealsRes, activitiesRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('company_id', id).order('first_name'),
      supabase.from('deals').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('entity_type', 'company').eq('entity_id', id).order('created_at', { ascending: false }),
    ])
    setCompany(companyRes.data)
    setContacts(contactsRes.data ?? [])
    setDeals(dealsRes.data ?? [])
    setActivities(activitiesRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function updateField(field: string, value: string | number | null) {
    const { error } = await supabase.from('companies').update({ [field]: value }).eq('id', id)
    if (error) { toast.error('Failed to update') } else {
      toast.success('Updated')
      setCompany(prev => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Loading..." breadcrumb={[{ label: 'Companies', href: '/companies' }, { label: '...' }]} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-pulse text-sm" style={{ color: '#5A5A70' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Not found" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-3">
          <p style={{ color: '#9090A8' }}>Company not found</p>
          <button onClick={() => router.push('/companies')} className="text-sm" style={{ color: '#6366F1' }}>Back to Companies</button>
        </div>
      </div>
    )
  }

  const tabStyle = (t: string) => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: tab === t ? 500 : 400,
    color: tab === t ? '#F4F4F8' : '#9090A8',
    borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent',
    cursor: 'pointer' as const,
    transition: 'all 0.15s',
  })

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={company.name}
        breadcrumb={[{ label: 'Companies', href: '/companies' }, { label: company.name }]}
        action={
          <button onClick={() => router.push('/companies')} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md hover:bg-white/5 transition-colors" style={{ color: '#9090A8' }}>
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 max-w-6xl">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h1 className="text-2xl font-semibold mb-4" style={{ color: '#F4F4F8' }}>{company.name}</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6" style={{ borderColor: '#2A2A38' }}>
              {(['overview', 'activity', 'contacts', 'deals'] as const).map(t => (
                <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                <InlineField label="Domain" value={company.domain} onSave={v => updateField('domain', v)} />
                <InlineField label="Industry" value={company.industry} onSave={v => updateField('industry', v)} />
                <InlineField label="Employees" value={company.employee_count?.toString() ?? null} onSave={v => updateField('employee_count', parseInt(v) || null)} type="number" />
                <InlineField label="Annual Revenue (€)" value={company.annual_revenue?.toString() ?? null} onSave={v => updateField('annual_revenue', parseFloat(v) || null)} type="number" />
                <InlineField label="Website" value={company.website} onSave={v => updateField('website', v)} />
                <InlineField label="LinkedIn URL" value={company.linkedin_url} onSave={v => updateField('linkedin_url', v)} />
                <div className="col-span-2">
                  <div className="text-xs font-medium mb-1" style={{ color: '#5A5A70' }}>Description</div>
                  <textarea
                    className="w-full px-2 py-1.5 text-sm rounded-md outline-none resize-none"
                    style={{ background: 'transparent', border: '1px solid transparent', color: '#F4F4F8' }}
                    rows={3}
                    defaultValue={company.description ?? ''}
                    onFocus={e => e.target.style.borderColor = '#2A2A38'}
                    onBlur={e => { e.target.style.borderColor = 'transparent'; updateField('description', e.target.value) }}
                    placeholder="Add a description..."
                  />
                </div>
              </div>
            )}

            {tab === 'activity' && (
              <ActivityFeed activities={activities} entityType="company" entityId={id} onRefresh={fetchAll} />
            )}

            {tab === 'contacts' && (
              <div>
                {contacts.length === 0 ? (
                  <p className="text-sm" style={{ color: '#5A5A70' }}>No contacts linked</p>
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A38' }}>
                    <table className="w-full border-collapse">
                      <thead style={{ background: '#111118' }}>
                        <tr>
                          {['Name', 'Email', 'Job Title', 'Status'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5" style={{ color: '#5A5A70', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2A2A38' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody style={{ background: '#0A0A0F' }}>
                        {contacts.map(c => (
                          <tr key={c.id} className="cursor-pointer hover:bg-white/5" onClick={() => router.push(`/contacts/${c.id}`)}>
                            <td className="px-4 py-3 text-sm" style={{ color: '#F4F4F8', borderBottom: '1px solid #1A1A24' }}>{c.first_name} {c.last_name}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#9090A8', borderBottom: '1px solid #1A1A24' }}>{c.email ?? '—'}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#9090A8', borderBottom: '1px solid #1A1A24' }}>{c.job_title ?? '—'}</td>
                            <td className="px-4 py-3" style={{ borderBottom: '1px solid #1A1A24' }}><StatusBadge type="contact" value={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'deals' && (
              <div>
                {deals.length === 0 ? (
                  <p className="text-sm" style={{ color: '#5A5A70' }}>No deals linked</p>
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A38' }}>
                    <table className="w-full border-collapse">
                      <thead style={{ background: '#111118' }}>
                        <tr>
                          {['Deal', 'Value', 'Stage', 'Close Date'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5" style={{ color: '#5A5A70', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2A2A38' }}>{h}</th>
                          ))}
                        </tr>
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
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="w-72 flex-shrink-0 space-y-4">
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#111118', border: '1px solid #2A2A38' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5A5A70' }}>Properties</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#9090A8' }}>Status</span>
                  <select
                    value={company.status}
                    onChange={e => updateField('status', e.target.value)}
                    className="text-xs rounded px-2 py-1 outline-none"
                    style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#F4F4F8' }}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="partner">Partner</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#9090A8' }}>Created</span>
                  <span className="text-xs" style={{ color: '#F4F4F8' }}>{formatDate(company.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: '#9090A8' }}>Updated</span>
                  <span className="text-xs" style={{ color: '#F4F4F8' }}>{formatDate(company.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
