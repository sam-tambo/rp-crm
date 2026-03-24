'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Company, Contact, Deal, Activity } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Globe, ExternalLink, Building2, Users, DollarSign,
  MapPin, Tag, ChevronRight, Plus, Pencil, X, Check, Phone, Mail,
  TrendingUp, Calendar, Hash, BarChart3
} from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import ActivityFeed from '@/components/crm/ActivityFeed'
import { LinkedInIcon } from '@/components/ui/linkedin-icon'

/* ── helpers ──────────────────────────────── */
function avatarColor(name: string) {
  const palette = [
    ['#E8F5EE','#1aaa5e'],['#EEF0FF','#6366F1'],['#FFF4E6','#F97316'],
    ['#FCE8FF','#A855F7'],['#E8F0FF','#3B82F6'],['#FFF1F1','#EF4444'],
    ['#FFFBE6','#EAB308'],['#E8FFFC','#14B8A6'],
  ]
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length
  return palette[h]
}

function fmtEmp(n: number | null | undefined) {
  if (!n) return null
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`
  return n.toString()
}

function fmtRev(n: number | null | undefined) {
  if (!n) return null
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(0)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return `$${n}`
}

function fitScore(c: Company) {
  let s = 0
  const hi = ['luxury goods','apparel','retail','fashion','textiles','jewelry','consumer goods','e-commerce','cosmetics','beauty']
  if (c.industry && hi.some(k => c.industry!.toLowerCase().includes(k))) s += 30
  const e = c.employee_count ?? 0
  s += e >= 20000 ? 25 : e >= 5000 ? 22 : e >= 1000 ? 18 : e >= 500 ? 12 : e > 0 ? 5 : 0
  const r = c.annual_revenue ?? 0
  s += r >= 1e9 ? 30 : r >= 1e8 ? 22 : r >= 1e7 ? 14 : r > 0 ? 6 : 0
  if (c.linkedin_url) s += 5; if (c.website) s += 5; if (c.description) s += 5
  if (s >= 70) return { label: 'Excellent Fit', score: s, color: '#065f46', bg: '#d1fae5', dot: '#059669' }
  if (s >= 45) return { label: 'Good Fit', score: s, color: '#1aaa5e', bg: '#EEF7F2', dot: '#1aaa5e' }
  if (s >= 25) return { label: 'Fair Fit', score: s, color: '#b45309', bg: '#fef3c7', dot: '#d97706' }
  return { label: 'Low Fit', score: s, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' }
}

/* ── InlineEdit ──────────────────────────── */
function InlineEdit({ value, onSave, className = '', placeholder = 'Click to edit', multiline = false }: {
  value: string | null; onSave: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  function commit() { setEditing(false); if (val !== (value ?? '')) onSave(val) }
  if (editing) {
    const props = { autoFocus: true, value: val, onChange: (e: any) => setVal(e.target.value), onBlur: commit, onKeyDown: (e: any) => { if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) } if (!multiline && e.key === 'Enter') commit() }, style: { background: '#EEF7F2', border: '1px solid #1aaa5e', borderRadius: 6, padding: '4px 8px', outline: 'none', color: '#191D25', width: '100%', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit', resize: 'none' as const } }
    return multiline ? <textarea {...props} rows={4} className={className} /> : <input {...props} className={className} />
  }
  return (
    <span className={`cursor-text rounded hover:bg-black/5 transition-colors px-1 -mx-1 ${className}`} onClick={() => setEditing(true)} style={{ color: val ? undefined : '#9ca3af' }}>
      {val || placeholder}
    </span>
  )
}

/* ── Field row ───────────────────────────── */
function PropRow({ icon, label, value, onSave, href }: { icon: React.ReactNode; label: string; value: string | null | undefined; onSave?: (v: string) => void; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #F0F7F3' }}>
      <div className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#aac4b4' }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs mb-0.5" style={{ color: '#9abaaa' }}>{label}</div>
        {onSave ? (
          <InlineEdit value={value ?? null} onSave={onSave} placeholder="—" className="text-sm block w-full" />
        ) : href && value ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex items-center gap-1" style={{ color: '#1aaa5e' }}>
            {value} <ExternalLink size={10} />
          </a>
        ) : (
          <span className="text-sm" style={{ color: value ? '#191D25' : '#c0c0c0' }}>{value || '—'}</span>
        )}
      </div>
    </div>
  )
}

/* ── StatusBadge ─────────────────────────── */
function SBadge({ value, type }: { value: string; type: 'company' | 'contact' | 'deal' }) {
  const maps: Record<string, Record<string, [string, string]>> = {
    company: { prospect: ['#EEF0FF','#6366F1'], active: ['#EEF7F2','#1aaa5e'], partner: ['#E8F0FF','#3B82F6'], churned: ['#FFF1F1','#EF4444'] },
    contact: { lead: ['#EEF0FF','#6366F1'], active: ['#EEF7F2','#1aaa5e'], customer: ['#E8F0FF','#3B82F6'], inactive: ['#F3F4F6','#9CA3AF'] },
    deal: { prospecting: ['#F3F4F6','#6B7280'], qualification: ['#EEF0FF','#6366F1'], proposal: ['#FFF4E6','#F97316'], negotiation: ['#FFF9E6','#EAB308'], closed_won: ['#EEF7F2','#1aaa5e'], closed_lost: ['#FFF1F1','#EF4444'] },
  }
  const [bg, color] = maps[type]?.[value] ?? ['#F3F4F6','#6B7280']
  return <span style={{ background: bg, color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{value.replace('_', ' ')}</span>
}

/* ── CompanyLogo ─────────────────────────── */
function CompanyLogo({ name, logoUrl, bg, fg }: { name: string; logoUrl: string | null; bg: string; fg: string }) {
  const [err, setErr] = useState(false)
  if (logoUrl && !err) {
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
        <img src={logoUrl} alt={name} onError={() => setErr(true)} className="w-full h-full object-contain p-1.5" />
      </div>
    )
  }
  return (
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ background: bg, color: fg }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

/* ── EditModal ───────────────────────────── */
function EditModal({ company, onClose, onSave }: {
  company: Company
  onClose: () => void
  onSave: (updates: Partial<Company>) => Promise<void>
}) {
  const [form, setForm] = useState({
    name: company.name ?? '',
    domain: company.domain ?? '',
    industry: company.industry ?? '',
    employee_count: company.employee_count?.toString() ?? '',
    annual_revenue: company.annual_revenue?.toString() ?? '',
    country: company.country ?? '',
    website: company.website ?? '',
    linkedin_url: company.linkedin_url ?? '',
    logo_url: company.logo_url ?? '',
    description: company.description ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const updates: Partial<Company> = {
      name: form.name.trim(),
      domain: form.domain.trim() || null,
      industry: form.industry.trim() || null,
      employee_count: form.employee_count ? (parseInt(form.employee_count.replace(/[^0-9]/g, '')) || null) : null,
      annual_revenue: form.annual_revenue ? (parseFloat(form.annual_revenue.replace(/[^0-9.]/g, '')) || null) : null,
      country: form.country.trim() || null,
      website: form.website.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      logo_url: form.logo_url.trim() || null,
      description: form.description.trim() || null,
    }
    await onSave(updates)
    setSaving(false)
    onClose()
  }

  const fields: { key: keyof typeof form; label: string; required?: boolean }[] = [
    { key: 'name', label: 'Company Name', required: true },
    { key: 'domain', label: 'Domain' },
    { key: 'industry', label: 'Industry' },
    { key: 'country', label: 'Country' },
    { key: 'website', label: 'Website URL' },
    { key: 'linkedin_url', label: 'LinkedIn URL' },
    { key: 'logo_url', label: 'Logo URL' },
    { key: 'employee_count', label: 'Employees' },
    { key: 'annual_revenue', label: 'Annual Revenue (USD)' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-[480px] flex flex-col shadow-2xl" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8F0EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#191D25' }}>Edit Company</h2>
          <button onClick={onClose} className="p-1.5 rounded-md transition-colors hover:bg-gray-100">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {fields.map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#638070' }}>
                {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
              </label>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
                style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#638070' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors resize-none"
              style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
            />
          </div>
        </div>
        <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid #E8F0EB' }}>
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ border: '1px solid #D4E8DC', color: '#638070' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: (saving || !form.name.trim()) ? '#9ca3af' : '#1aaa5e', cursor: (saving || !form.name.trim()) ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Main page ───────────────────────────── */
export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<'overview' | 'activity' | 'contacts' | 'deals'>('overview')
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
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
      toast.success('Saved')
      setCompany(prev => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <TopBar title="…" breadcrumb={[{ label: 'Companies', href: '/companies' }, { label: '…' }]} />
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-3xl px-8">
          {[280, 200, 160].map(w => <div key={w} className="h-4 rounded animate-pulse" style={{ background: '#EEF7F2', width: w }} />)}
        </div>
      </div>
    </div>
  )

  if (!company) return (
    <div className="flex flex-col h-full">
      <TopBar title="Not found" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Building2 size={32} style={{ color: '#D4E8DC' }} />
        <p style={{ color: '#638070' }}>Company not found</p>
        <button onClick={() => router.push('/companies')} style={{ color: '#1aaa5e', fontSize: 14 }}>← Back to Companies</button>
      </div>
    </div>
  )

  const [avatarBg, avatarFg] = avatarColor(company.name)
  const fit = fitScore(company)
  const totalDealValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  const tabItems: { key: typeof tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity', count: activities.length },
    { key: 'contacts', label: 'People', count: contacts.length },
    { key: 'deals', label: 'Deals', count: deals.length },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFCFB' }}>
      <TopBar
        title={company.name}
        breadcrumb={[{ label: 'Companies', href: '/companies' }, { label: company.name }]}
        action={
          <button onClick={() => router.push('/companies')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-black/5" style={{ color: '#638070' }}>
            <ArrowLeft size={14} /> Companies
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* ── Hero header ── */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8F0EB' }}>
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-start gap-5">
              {/* Avatar / Logo */}
              <CompanyLogo name={company.name} logoUrl={company.logo_url} bg={avatarBg} fg={avatarFg} />

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold mb-1 leading-tight" style={{ color: '#191D25' }}>
                  <InlineEdit value={company.name} onSave={v => updateField('name', v)} className="block" />
                </h1>

                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {company.domain && (
                    <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                      style={{ background: '#EEF7F2', color: '#1aaa5e', border: '1px solid #D4E8DC' }}>
                      <Globe size={10} /> {company.domain}
                    </a>
                  )}
                  {company.industry && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F0F0FF', color: '#6366F1', border: '1px solid #E0E0FF' }}>
                      <Tag size={10} /> {company.industry}
                    </span>
                  )}
                  {company.country && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                      <MapPin size={10} /> {company.country}
                    </span>
                  )}
                  {company.employee_count && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                      <Users size={10} /> {fmtEmp(company.employee_count)} employees
                    </span>
                  )}
                  {/* Fit score */}
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: fit.bg, color: fit.color, border: `1px solid ${fit.dot}30` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: fit.dot, display: 'inline-block' }} />
                    {fit.label} · {fit.score}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#EEF7F2]"
                  style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#1aaa5e' }}>
                  <Pencil size={12} /> Edit
                </button>
                {company.website && (
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#EEF7F2]"
                    style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#1aaa5e' }}>
                    <Globe size={12} /> Website
                  </a>
                )}
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-blue-50"
                    style={{ background: '#F8FAFE', border: '1px solid #DBEAFE', color: '#3B82F6' }}>
                    <LinkedInIcon size={12} /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Stats row */}
            {(deals.length > 0 || contacts.length > 0) && (
              <div className="flex gap-6 mt-5 pt-5" style={{ borderTop: '1px solid #F0F7F3' }}>
                {contacts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users size={14} style={{ color: '#9abaaa' }} />
                    <span className="text-sm font-medium" style={{ color: '#191D25' }}>{contacts.length}</span>
                    <span className="text-sm" style={{ color: '#8aaa98' }}>contact{contacts.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {deals.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} style={{ color: '#9abaaa' }} />
                      <span className="text-sm font-medium" style={{ color: '#191D25' }}>{deals.length}</span>
                      <span className="text-sm" style={{ color: '#8aaa98' }}>deal{deals.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} style={{ color: '#9abaaa' }} />
                      <span className="text-sm font-medium" style={{ color: '#191D25' }}>{formatCurrency(totalDealValue)}</span>
                      <span className="text-sm" style={{ color: '#8aaa98' }}>pipeline</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8F0EB' }}>
          <div className="max-w-6xl mx-auto px-8 flex gap-0">
            {tabItems.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative"
                style={{ color: tab === key ? '#1aaa5e' : '#638070', borderBottom: tab === key ? '2px solid #1aaa5e' : '2px solid transparent', marginBottom: -1 }}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: tab === key ? '#EEF7F2' : '#F3F4F6', color: tab === key ? '#1aaa5e' : '#9CA3AF', minWidth: 18, textAlign: 'center' }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex gap-6">
            {/* Left / main */}
            <div className="flex-1 min-w-0">

              {/* Overview tab */}
              {tab === 'overview' && (
                <div className="space-y-5">
                  {/* Description */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>About</h3>
                    <InlineEdit
                      value={company.description}
                      onSave={v => updateField('description', v)}
                      placeholder="Add a description…"
                      multiline
                      className="text-sm leading-relaxed w-full block"
                    />
                  </div>

                  {/* Details grid */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8aaa98' }}>Details</h3>
                    <div className="grid grid-cols-2 gap-x-8">
                      <PropRow icon={<Globe size={14} />} label="Domain" value={company.domain} onSave={v => updateField('domain', v)} />
                      <PropRow icon={<Tag size={14} />} label="Industry" value={company.industry} onSave={v => updateField('industry', v)} />
                      <PropRow icon={<Users size={14} />} label="Employees" value={fmtEmp(company.employee_count)} onSave={v => updateField('employee_count', parseInt(v.replace(/[^0-9]/g,'')) || null)} />
                      <PropRow icon={<DollarSign size={14} />} label="Annual Revenue" value={fmtRev(company.annual_revenue)} onSave={v => updateField('annual_revenue', parseFloat(v.replace(/[^0-9.]/g,'')) || null)} />
                      <PropRow icon={<MapPin size={14} />} label="Country" value={company.country} onSave={v => updateField('country', v)} />
                      <PropRow icon={<Globe size={14} />} label="Website" value={company.website} href={company.website ?? undefined} onSave={v => updateField('website', v)} />
                      <PropRow icon={<LinkedInIcon size={14} />} label="LinkedIn" value={company.linkedin_url} href={company.linkedin_url ?? undefined} onSave={v => updateField('linkedin_url', v)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Activity tab */}
              {tab === 'activity' && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  <div className="p-5">
                    <ActivityFeed activities={activities} entityType="company" entityId={id} onRefresh={fetchAll} />
                  </div>
                </div>
              )}

              {/* Contacts/People tab */}
              {tab === 'contacts' && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  {contacts.length === 0 ? (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <Users size={28} style={{ color: '#D4E8DC' }} />
                      <p className="text-sm" style={{ color: '#8aaa98' }}>No contacts linked to this company</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead style={{ background: '#F8FBF9' }}>
                        <tr>
                          {['Name & Role', 'Seniority', 'Email', 'Location', 'Links'].map(h => (
                            <th key={h} className="text-left px-5 py-3" style={{ color: '#8aaa98', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8F0EB' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map(c => {
                          const [bg, fg] = avatarColor(`${c.first_name} ${c.last_name}`)
                          const senColors: Record<string,[string,string]> = {
                            'Vp':['#EEF0FF','#4F46E5'],'Director':['#FFF4E6','#C2410C'],
                            'Head':['#DCFCE7','#166534'],'Manager':['#F0FDF4','#15803D'],
                            'Owner':['#FEF3C7','#92400E'],'C Suite':['#FCE7F3','#9D174D'],
                          }
                          const sen = (c as any).seniority as string | null
                          const [sBg,sTx] = sen && senColors[sen] ? senColors[sen] : ['#F3F4F6','#6B7280']
                          return (
                            <tr key={c.id} className="cursor-pointer group hover:bg-[#FAFCFB]"
                              style={{ borderBottom: '1px solid #F0F7F3', transition: 'background 0.1s' }}
                              onClick={() => router.push(`/contacts/${c.id}`)}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: bg, color: fg }}>
                                    {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold group-hover:text-[#1aaa5e] transition-colors" style={{ color: '#191D25' }}>{c.first_name} {c.last_name}</div>
                                    <div className="text-xs" style={{ color: '#9abaaa' }}>{c.job_title ?? '—'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                {sen
                                  ? <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:600, background:sBg, color:sTx }}>{sen}</span>
                                  : <span style={{ color:'#D1D5DB', fontSize:12 }}>—</span>
                                }
                              </td>
                              <td className="px-5 py-3">
                                {c.email
                                  ? <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} className="text-xs hover:underline" style={{ color:'#1aaa5e' }}>{c.email}</a>
                                  : <span className="text-xs" style={{ color:'#D1D5DB' }}>—</span>
                                }
                              </td>
                              <td className="px-5 py-3">
                                {(c as any).country
                                  ? <span className="text-xs" style={{ color:'#6B7280' }}>{(c as any).city ? `${(c as any).city}, ` : ''}{(c as any).country}</span>
                                  : <span className="text-xs" style={{ color:'#D1D5DB' }}>—</span>
                                }
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {c.email && <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Email"><Mail size={13} style={{ color:'#6B7280' }}/></a>}
                                  {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="p-1 rounded hover:bg-blue-50 transition-colors" title="LinkedIn"><LinkedInIcon size={13} style={{ color:'#0A66C2' }}/></a>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Deals tab */}
              {tab === 'deals' && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  {deals.length === 0 ? (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <TrendingUp size={28} style={{ color: '#D4E8DC' }} />
                      <p className="text-sm" style={{ color: '#8aaa98' }}>No deals linked to this company</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead style={{ background: '#F8FBF9' }}>
                        <tr>
                          {['Deal', 'Value', 'Stage', 'Probability', 'Close Date'].map(h => (
                            <th key={h} className="text-left px-5 py-3" style={{ color: '#8aaa98', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8F0EB' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deals.map(d => (
                          <tr key={d.id} className="cursor-pointer hover:bg-[#FAFCFB] group" style={{ borderBottom: '1px solid #F0F7F3' }}
                            onClick={() => router.push(`/deals/${d.id}`)}>
                            <td className="px-5 py-3 text-sm font-medium group-hover:text-[#1aaa5e] transition-colors" style={{ color: '#191D25' }}>{d.name}</td>
                            <td className="px-5 py-3 text-sm font-medium" style={{ color: '#1aaa5e' }}>{formatCurrency(d.value)}</td>
                            <td className="px-5 py-3"><SBadge value={d.stage} type="deal" /></td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                                  <div className="h-full rounded-full" style={{ width: `${d.probability ?? 0}%`, background: d.probability >= 70 ? '#1aaa5e' : d.probability >= 40 ? '#F59E0B' : '#EF4444' }} />
                                </div>
                                <span className="text-xs" style={{ color: '#638070' }}>{d.probability ?? 0}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: '#638070' }}>{formatDate(d.close_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="w-64 flex-shrink-0 space-y-4">
              {/* Status */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Status</h3>
                <select
                  value={company.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
                  style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="partner">Partner</option>
                  <option value="churned">Churned</option>
                </select>
              </div>

              {/* Fit score */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>ICP Fit Score</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: fit.color }}>{fit.label}</span>
                  <span className="text-lg font-bold" style={{ color: fit.color }}>{fit.score}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0F7F3' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(fit.score, 100)}%`, background: fit.dot }} />
                </div>
                <p className="text-xs mt-2" style={{ color: '#9abaaa' }}>Based on industry, size & data completeness</p>
              </div>

              {/* Record info */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Record Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#8aaa98' }}>Created</span>
                    <span className="text-xs" style={{ color: '#191D25' }}>{formatDate(company.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#8aaa98' }}>Updated</span>
                    <span className="text-xs" style={{ color: '#191D25' }}>{formatDate(company.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              {(company.website || company.linkedin_url) && (
                <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Links</h3>
                  <div className="space-y-2">
                    {company.website && (
                      <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity" style={{ color: '#1aaa5e' }}>
                        <Globe size={12} /> {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    {company.linkedin_url && (
                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity" style={{ color: '#3B82F6' }}>
                        <LinkedInIcon size={12} /> View on LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditModal
          company={company}
          onClose={() => setEditOpen(false)}
          onSave={async (updates) => {
            const { error } = await supabase.from('companies').update(updates).eq('id', id)
            if (error) { toast.error('Failed to save changes') }
            else { toast.success('Company updated'); setCompany(prev => prev ? { ...prev, ...updates } : prev) }
          }}
        />
      )}
    </div>
  )
}
