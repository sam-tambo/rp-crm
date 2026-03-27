'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/lib/workspace-context'
import { toast } from 'sonner'
import { Company, Contact } from '@/lib/types'

interface Props {
  type: 'company' | 'contact' | 'deal'
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function QuickCreateModal({ type, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const supabase = createClient()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({})
      if (type === 'contact' || type === 'deal') {
        supabase.from('companies').select('id,name').order('name').then(({ data }) => setCompanies(data ?? []))
      }
      if (type === 'deal') {
        supabase.from('contacts').select('id,first_name,last_name').order('first_name').then(({ data }) => setContacts(data ?? []))
      }
    }
  }, [open, type])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) { toast.error('No workspace found'); return }
    setLoading(true)
    let error: any = null

    if (type === 'company') {
      ;({ error } = await supabase.from('companies').insert({
        name: form.name,
        domain: form.domain || null,
        industry: form.industry || null,
        status: form.status || 'prospect',
        workspace_id: workspaceId,
      }))
    } else if (type === 'contact') {
      ;({ error } = await supabase.from('contacts').insert({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        job_title: form.job_title || null,
        company_id: form.company_id || null,
        status: 'lead',
        workspace_id: workspaceId,
      }))
    } else {
      ;({ error } = await supabase.from('deals').insert({
        name: form.name,
        value: form.value ? parseFloat(form.value) : 0,
        stage: form.stage || 'prospecting',
        company_id: form.company_id || null,
        contact_id: form.contact_id || null,
        close_date: form.close_date || null,
        workspace_id: workspaceId,
      }))
    }

    if (error) {
      toast.error(`Failed to create ${type}: ${error.message}`)
    } else {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created`)
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-md outline-none"
  const inputStyle = { background: '#F0FDF4', border: '1px solid #E4E4EB', color: '#111118' }
  const labelStyle = { color: '#6B7280' }
  const titles = { company: 'New Company', contact: 'New Contact', deal: 'New Deal' }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />}
      <div
        className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col transform transition-transform duration-300"
        style={{
          background: '#F9F9FB',
          borderLeft: '1px solid #E4E4EB',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E4E4EB' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#111118' }}>{titles[type]}</h2>
          <button onClick={onClose} className="p-1 rounded-md transition-colors hover:bg-white/5">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {type === 'company' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Name *</label>
                <input className={inputClass} style={inputStyle} required value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Domain</label>
                <input className={inputClass} style={inputStyle} value={form.domain ?? ''} onChange={e => set('domain', e.target.value)} placeholder="acme.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Industry</label>
                <input className={inputClass} style={inputStyle} value={form.industry ?? ''} onChange={e => set('industry', e.target.value)} placeholder="Technology" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Status</label>
                <select className={inputClass} style={inputStyle} value={form.status ?? 'prospect'} onChange={e => set('status', e.target.value)}>
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="partner">Partner</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
            </>
          )}

          {type === 'contact' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={labelStyle}>First Name *</label>
                  <input className={inputClass} style={inputStyle} required value={form.first_name ?? ''} onChange={e => set('first_name', e.target.value)} placeholder="João" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Last Name *</label>
                  <input className={inputClass} style={inputStyle} required value={form.last_name ?? ''} onChange={e => set('last_name', e.target.value)} placeholder="Silva" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Email</label>
                <input type="email" className={inputClass} style={inputStyle} value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="joao@company.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Job Title</label>
                <input className={inputClass} style={inputStyle} value={form.job_title ?? ''} onChange={e => set('job_title', e.target.value)} placeholder="CEO" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Company</label>
                <select className={inputClass} style={inputStyle} value={form.company_id ?? ''} onChange={e => set('company_id', e.target.value)}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          {type === 'deal' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Deal Name *</label>
                <input className={inputClass} style={inputStyle} required value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Acme Enterprise Deal" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Value (€)</label>
                <input type="number" className={inputClass} style={inputStyle} value={form.value ?? ''} onChange={e => set('value', e.target.value)} placeholder="10000" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Stage</label>
                <select className={inputClass} style={inputStyle} value={form.stage ?? 'prospecting'} onChange={e => set('stage', e.target.value)}>
                  <option value="prospecting">Prospecting</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Company</label>
                <select className={inputClass} style={inputStyle} value={form.company_id ?? ''} onChange={e => set('company_id', e.target.value)}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Contact</label>
                <select className={inputClass} style={inputStyle} value={form.contact_id ?? ''} onChange={e => set('contact_id', e.target.value)}>
                  <option value="">Select contact</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Close Date</label>
                <input type="date" className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} value={form.close_date ?? ''} onChange={e => set('close_date', e.target.value)} />
              </div>
            </>
          )}
        </form>

        <div className="px-6 py-4" style={{ borderTop: '1px solid #E4E4EB' }}>
          <button
            type="submit"
            disabled={loading || !workspaceId}
            onClick={handleSubmit as any}
            className="w-full py-2.5 rounded-md text-sm font-medium transition-all"
            style={{ background: '#059669', color: 'white', opacity: (loading || !workspaceId) ? 0.7 : 1 }}
          >
            {loading ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </div>
      </div>
    </>
  )
}
