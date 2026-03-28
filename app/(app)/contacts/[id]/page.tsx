'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Contact, Deal, Activity } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, ExternalLink, Building2, Users, DollarSign,
  Mail, Phone, Briefcase, Tag, TrendingUp, BarChart3, Globe, MapPin
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

/* ── InlineEdit ──────────────────────────── */
function InlineEdit({ value, onSave, className = '', placeholder = 'Click to edit', multiline = false }: {
  value: string | null; onSave: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  useEffect(() => { if (!editing) setVal(value ?? '') }, [value, editing])
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

/* ── PropRow ─────────────────────────────── */
function PropRow({ icon, label, value, onSave, href, type = 'text' }: {
  icon: React.ReactNode; label: string; value: string | null | undefined; onSave?: (v: string) => void; href?: string; type?: string
}) {
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
function SBadge({ value, type }: { value: string; type: 'contact' | 'deal' }) {
  const maps: Record<string, Record<string, [string, string]>> = {
    contact: { lead: ['#EEF0FF','#6366F1'], active: ['#EEF7F2','#1aaa5e'], customer: ['#E8F0FF','#3B82F6'], inactive: ['#F3F4F6','#9CA3AF'] },
    deal: { prospecting: ['#F3F4F6','#6B7280'], qualification: ['#EEF0FF','#6366F1'], proposal: ['#FFF4E6','#F97316'], negotiation: ['#FFF9E6','#EAB308'], closed_won: ['#EEF7F2','#1aaa5e'], closed_lost: ['#FFF1F1','#EF4444'] },
  }
  const [bg, color] = maps[type]?.[value] ?? ['#F3F4F6','#6B7280']
  return <span style={{ background: bg, color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{value.replace('_', ' ')}</span>
}

/* ── Main page ───────────────────────────── */
export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<'overview' | 'activity' | 'deals' | 'outreach'>('overview')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [contactRes, dealsRes, activitiesRes] = await Promise.all([
      supabase.from('contacts').select('*, company:companies(id,name,domain)').eq('id', id).single(),
      supabase.from('deals').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('entity_type', 'contact').eq('entity_id', id).order('created_at', { ascending: false }),
    ])
    setContact(contactRes.data)
    setDeals(dealsRes.data ?? [])
    setActivities(activitiesRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime: keep activity feed live as teammates add notes or update the record
  useEffect(() => {
    const channel = supabase
      .channel(`contact_${id}_realtime`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `entity_id=eq.${id}` }, () => { fetchAll() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts', filter: `id=eq.${id}` }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, fetchAll])

  async function updateField(field: string, value: string | null) {
    const { error } = await supabase.from('contacts').update({ [field]: value }).eq('id', id)
    if (error) { toast.error('Failed to update') } else {
      toast.success('Saved')
      setContact(prev => prev ? { ...prev, [field]: value } : prev)
    }
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <TopBar title="…" breadcrumb={[{ label: 'Contacts', href: '/contacts' }, { label: '…' }]} />
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-3xl px-8">
          {[280, 200, 160].map(w => <div key={w} className="h-4 rounded animate-pulse" style={{ background: '#EEF7F2', width: w }} />)}
        </div>
      </div>
    </div>
  )

  if (!contact) return (
    <div className="flex flex-col h-full">
      <TopBar title="Not found" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Users size={32} style={{ color: '#D4E8DC' }} />
        <p style={{ color: '#638070' }}>Contact not found</p>
        <button onClick={() => router.push('/contacts')} style={{ color: '#1aaa5e', fontSize: 14 }}>← Back to Contacts</button>
      </div>
    </div>
  )

  const fullName = `${contact.first_name} ${contact.last_name}`
  const [avatarBg, avatarFg] = avatarColor(fullName)
  const company = (contact as any).company
  const totalDealValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  const tabItems: { key: typeof tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity', count: activities.length },
    { key: 'deals', label: 'Deals', count: deals.length },
    { key: 'outreach', label: 'Outreach' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFCFB' }}>
      <TopBar
        title={fullName}
        breadcrumb={[{ label: 'Contacts', href: '/contacts' }, { label: fullName }]}
        action={
          <button onClick={() => router.push('/contacts')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-black/5" style={{ color: '#638070' }}>
            <ArrowLeft size={14} /> Contacts
          </button>
        }
      />

      {/* ── Hero header ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8F0EB' }}>
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: avatarBg, color: avatarFg }}>
              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold mb-1 leading-tight" style={{ color: '#191D25' }}>
                <InlineEdit value={contact.first_name} onSave={v => updateField('first_name', v)} className="inline" />
                {' '}
                <InlineEdit value={contact.last_name} onSave={v => updateField('last_name', v)} className="inline" />
              </h1>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {contact.job_title && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F0F0FF', color: '#6366F1', border: '1px solid #E0E0FF' }}>
                    <Briefcase size={10} /> {contact.job_title}
                  </span>
                )}
                {contact.department && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                    <Tag size={10} /> {contact.department}
                  </span>
                )}
                {company && (
                  <button onClick={() => router.push(`/companies/${company.id}`)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                    style={{ background: '#EEF7F2', color: '#1aaa5e', border: '1px solid #D4E8DC' }}>
                    <Building2 size={10} /> {company.name}
                  </button>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity" style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                    <Mail size={10} /> {contact.email}
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#EEF7F2]"
                  style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#1aaa5e' }}>
                  <Mail size={12} /> Email
                </a>
              )}
              {contact.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-blue-50"
                  style={{ background: '#F8FAFE', border: '1px solid #DBEAFE', color: '#3B82F6' }}>
                  <LinkedInIcon size={12} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Stats row */}
          {deals.length > 0 && (
            <div className="flex gap-6 mt-5 pt-5" style={{ borderTop: '1px solid #F0F7F3' }}>
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
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8F0EB' }}>
        <div className="max-w-6xl mx-auto px-8 flex">
          {tabItems.map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: tab === key ? '#1aaa5e' : '#638070', borderBottom: tab === key ? '2px solid #1aaa5e' : '2px solid transparent', marginBottom: -1 }}>
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex gap-6">
            {/* Left / main */}
            <div className="flex-1 min-w-0">

              {tab === 'overview' && (
                <div className="space-y-5">
                  {/* Notes */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Notes</h3>
                    <InlineEdit
                      value={contact.notes}
                      onSave={v => updateField('notes', v)}
                      placeholder="Add notes about this contact…"
                      multiline
                      className="text-sm leading-relaxed w-full block"
                    />
                  </div>

                  {/* Contact info */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8aaa98' }}>Contact Details</h3>
                    <div className="grid grid-cols-2 gap-x-8">
                      <PropRow icon={<Mail size={14} />} label="Email" value={contact.email} onSave={v => updateField('email', v)} href={contact.email ? `mailto:${contact.email}` : undefined} />
                      <PropRow icon={<Phone size={14} />} label="Phone" value={contact.phone} onSave={v => updateField('phone', v)} />
                      <PropRow icon={<Briefcase size={14} />} label="Job Title" value={contact.job_title} onSave={v => updateField('job_title', v)} />
                      <PropRow icon={<Tag size={14} />} label="Department" value={contact.department} onSave={v => updateField('department', v)} />
                      <PropRow icon={<LinkedInIcon size={14} />} label="LinkedIn" value={contact.linkedin_url} href={contact.linkedin_url ?? undefined} onSave={v => updateField('linkedin_url', v)} />
                      {company && (
                        <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #F0F7F3' }}>
                          <div className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#aac4b4' }}><Building2 size={14} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs mb-0.5" style={{ color: '#9abaaa' }}>Company</div>
                            <button onClick={() => router.push(`/companies/${company.id}`)} className="text-sm hover:underline flex items-center gap-1" style={{ color: '#1aaa5e' }}>
                              {company.name}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'activity' && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  <div className="p-5">
                    <ActivityFeed activities={activities} entityType="contact" entityId={id} onRefresh={fetchAll} />
                  </div>
                </div>
              )}

              {tab === 'outreach' && (
                <div className="space-y-5">
                  {/* Outreach persona + channel */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Outreach Profile</h3>
                    <div className="grid grid-cols-2 gap-x-8">
                      <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #F0F7F3' }}>
                        <div className="flex-1">
                          <div className="text-xs mb-1" style={{ color: '#9abaaa' }}>Persona</div>
                          <select value={contact.outreach_persona ?? ''} onChange={e => updateField('outreach_persona', e.target.value)}
                            className="text-sm w-full rounded-md px-2 py-1 outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}>
                            <option value="">— Select —</option>
                            <option>Sourcing Director</option>
                            <option>Head of Supply Chain</option>
                            <option>Procurement VP</option>
                            <option>Sustainability Manager</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid #F0F7F3' }}>
                        <div className="flex-1">
                          <div className="text-xs mb-1" style={{ color: '#9abaaa' }}>Preferred Channel</div>
                          <select value={contact.preferred_contact_channel ?? ''} onChange={e => updateField('preferred_contact_channel', e.target.value)}
                            className="text-sm w-full rounded-md px-2 py-1 outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}>
                            <option value="">— Select —</option>
                            <option>LinkedIn</option>
                            <option>Email</option>
                            <option>Phone</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs mb-1" style={{ color: '#9abaaa' }}>Outreach Notes (personalisation hook)</div>
                      <InlineEdit value={contact.outreach_notes} onSave={v => updateField('outreach_notes', v)}
                        placeholder="What's unique about this person / company that you'll reference in the DM?"
                        multiline className="text-sm leading-relaxed w-full block" />
                    </div>
                  </div>

                  {/* Touch sequence tracker */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8aaa98' }}>3-Touch Sequence</h3>
                    <div className="space-y-3">
                      {[
                        { num: 1, field: 'touch_1_sent_at' as const, label: 'Touch 1 — LinkedIn DM', desc: 'Specific observation + genuine question. Under 50 words. No pitch.' },
                        { num: 2, field: 'touch_2_sent_at' as const, label: 'Touch 2 — Email (Day 4)', desc: 'Follow up. Offer the scorecard link.' },
                        { num: 3, field: 'touch_3_sent_at' as const, label: 'Touch 3 — LinkedIn DM (Day 9)', desc: 'Last note. Mention the pilot programme + production slot.' },
                      ].map(({ num, field, label, desc }) => {
                        const sent = contact[field]
                        const sentDate = sent ? new Date(sent) : null
                        return (
                          <div key={num} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: sent ? '#EEF7F2' : '#F8FBF9', border: '1px solid ' + (sent ? '#D4E8DC' : '#EAECF0') }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                              style={{ background: sent ? '#1aaa5e' : '#E5E7EB', color: sent ? 'white' : '#9CA3AF' }}>{num}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium" style={{ color: '#191D25' }}>{label}</div>
                              <div className="text-xs mt-0.5" style={{ color: '#8aaa98' }}>{desc}</div>
                              {sentDate && (
                                <div className="text-xs mt-1" style={{ color: '#1aaa5e' }}>
                                  Sent {sentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                            {!sent && (
                              <button onClick={() => updateField(field, new Date().toISOString())}
                                className="flex-shrink-0 text-xs px-2.5 py-1 rounded-md font-medium transition-colors hover:bg-[#EEF7F2]"
                                style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#1aaa5e' }}>
                                Mark Sent
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Status + Reply */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #F0F7F3' }}>
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#9abaaa' }}>Touch Status</div>
                        <select value={contact.touch_status ?? 'Not started'} onChange={e => updateField('touch_status', e.target.value)}
                          className="text-sm w-full rounded-md px-2 py-1 outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}>
                          <option>Not started</option>
                          <option>Touch 1 sent</option>
                          <option>Touch 2 sent</option>
                          <option>Touch 3 sent</option>
                          <option>Replied</option>
                          <option>Unresponsive</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#9abaaa' }}>Reply Sentiment</div>
                        <select value={contact.reply_sentiment ?? ''} onChange={e => updateField('reply_sentiment', e.target.value)}
                          className="text-sm w-full rounded-md px-2 py-1 outline-none" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}>
                          <option value="">— No reply yet —</option>
                          <option>Positive</option>
                          <option>Neutral</option>
                          <option>Not now</option>
                          <option>No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Scorecard */}
                  <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Nearshore Readiness Scorecard</h3>
                    {contact.scorecard_submitted ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ background: (contact.scorecard_score ?? 0) <= 4 ? '#FFF1F1' : (contact.scorecard_score ?? 0) <= 6 ? '#FFFBE6' : '#EEF7F2', color: (contact.scorecard_score ?? 0) <= 4 ? '#EF4444' : (contact.scorecard_score ?? 0) <= 6 ? '#F59E0B' : '#1aaa5e' }}>
                          {contact.scorecard_score ?? '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: '#191D25' }}>Score: {contact.scorecard_score ?? '?'} / 10</div>
                          <div className="text-xs" style={{ color: '#8aaa98' }}>
                            {contact.scorecard_submitted_at ? `Submitted ${new Date(contact.scorecard_submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Submitted'}
                          </div>
                          <div className="text-xs mt-1" style={{ color: (contact.scorecard_score ?? 0) <= 4 ? '#EF4444' : '#1aaa5e' }}>
                            {(contact.scorecard_score ?? 0) <= 4 ? '⚡ Priority — high compliance gap' : (contact.scorecard_score ?? 0) <= 6 ? '⚠ Moderate gap' : '✓ Well prepared'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-sm" style={{ color: '#8aaa98' }}>Not submitted yet</div>
                        <button onClick={() => {
                          const score = window.prompt('Enter scorecard score (0-10):')
                          if (score === null) return
                          const n = parseInt(score)
                          if (!isNaN(n) && n >= 0 && n <= 10) {
                            updateField('scorecard_submitted', 'true')
                            updateField('scorecard_score', score)
                            updateField('scorecard_submitted_at', new Date().toISOString())
                          }
                        }} className="text-xs px-2.5 py-1 rounded-md font-medium"
                          style={{ background: '#EEF7F2', border: '1px solid #D4E8DC', color: '#1aaa5e' }}>
                          Log Score
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'deals' && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                  {deals.length === 0 ? (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <TrendingUp size={28} style={{ color: '#D4E8DC' }} />
                      <p className="text-sm" style={{ color: '#8aaa98' }}>No deals linked to this contact</p>
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
                  value={contact.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
                  style={{ background: '#F8FBF9', border: '1px solid #D4E8DC', color: '#191D25' }}
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Company card */}
              {company && (
                <div className="rounded-xl p-4 cursor-pointer hover:border-[#1aaa5e] transition-colors" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}
                  onClick={() => router.push(`/companies/${company.id}`)}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Company</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: '#EEF7F2', color: '#1aaa5e' }}>
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#191D25' }}>{company.name}</div>
                      {company.domain && <div className="text-xs" style={{ color: '#8aaa98' }}>{company.domain}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Record info */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E8F0EB' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8aaa98' }}>Record Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#8aaa98' }}>Created</span>
                    <span className="text-xs" style={{ color: '#191D25' }}>{formatDate(contact.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
