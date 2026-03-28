'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Contact, ProductionSlot } from '@/lib/types'
import { toast } from 'sonner'
import { Linkedin, Mail, ExternalLink, CheckCircle2, Clock, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

/* ── Types ── */
interface OutreachContact extends Contact {
  company?: { id: string; name: string; domain: string | null; composite_priority_score: number | null; asia_dependency_pct: number | null; csrd_obligation: string | null; avg_order_size_units: string | null }
}

/* ── Helpers ── */
function daysSince(ts: string | null): number {
  if (!ts) return 999
  return Math.floor((Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24))
}

function touchDue(contact: OutreachContact): 'touch2' | 'touch3' | null {
  if (contact.touch_status === 'Touch 1 sent' && contact.touch_1_sent_at && daysSince(contact.touch_1_sent_at) >= 4 && !contact.touch_2_sent_at) return 'touch2'
  if (contact.touch_status === 'Touch 2 sent' && contact.touch_2_sent_at && daysSince(contact.touch_2_sent_at) >= 5 && !contact.touch_3_sent_at) return 'touch3'
  return null
}

/* ── Slot Status Bar ── */
function SlotBar({ slots }: { slots: ProductionSlot[] }) {
  const q2 = slots.filter(s => s.quarter === 'Q2-2026')
  const available = q2.filter(s => s.status === 'available').length
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5 text-xs"
      style={{ background: '#F8FAFF', border: '1px solid #E0E7FF' }}>
      <span className="font-semibold uppercase tracking-wider" style={{ color: '#6366F1', fontSize: 10 }}>Q2 Production Slots</span>
      <div className="flex gap-2">
        {q2.map(slot => (
          <div key={slot.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: slot.status === 'available' ? '#ECFDF5' : '#FFF1F1', border: '1px solid ' + (slot.status === 'available' ? '#6EE7B7' : '#FCA5A5') }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: slot.status === 'available' ? '#10B981' : '#EF4444' }} />
            <span style={{ color: slot.status === 'available' ? '#065f46' : '#991B1B', fontWeight: 600 }}>
              {slot.slot_code.replace('Q2-2026-', 'Slot ')} · {slot.status === 'available' ? 'OPEN' : 'TAKEN'}
            </span>
          </div>
        ))}
      </div>
      <span className="ml-auto" style={{ color: '#9CA3AF' }}>
        {available === 0 ? '⚡ Both Q2 slots filled — booking Q3' : available + ' slot' + (available !== 1 ? 's' : '') + ' available this quarter'}
      </span>
    </div>
  )
}

/* ── Send Today Card ── */
function SendCard({ contact, onMarkSent, onOpenLinkedIn }: {
  contact: OutreachContact
  onMarkSent: (id: string) => void
  onOpenLinkedIn: (url: string) => void
}) {
  const [notes, setNotes] = useState(contact.outreach_notes ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const score = contact.company?.composite_priority_score ?? 0
  const csrd = contact.company?.csrd_obligation
  const asia = contact.company?.asia_dependency_pct

  async function saveNotes() {
    if (notes === (contact.outreach_notes ?? '')) return
    await supabase.from('contacts').update({ outreach_notes: notes }).eq('id', contact.id)
  }

  async function markSent() {
    setSaving(true)
    const { error } = await supabase.from('contacts').update({
      touch_1_sent_at: new Date().toISOString(),
      touch_status: 'Touch 1 sent',
      outreach_notes: notes
    }).eq('id', contact.id)
    if (error) { toast.error('Failed to update'); setSaving(false) }
    else { toast.success('Touch 1 logged'); onMarkSent(contact.id) }
  }

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <button onClick={() => router.push('/contacts/' + contact.id)} className="text-sm font-semibold hover:underline text-left" style={{ color: '#111118' }}>
            {contact.first_name} {contact.last_name}
          </button>
          <div className="text-xs" style={{ color: '#6B7280' }}>{contact.job_title ?? contact.outreach_persona ?? 'Unknown role'}</div>
          {contact.company && (
            <button onClick={() => router.push('/companies/' + contact.company!.id)} className="text-xs hover:underline" style={{ color: '#6366F1' }}>
              {contact.company.name}
            </button>
          )}
        </div>
        {score > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: score >= 7 ? '#EEF7F2' : '#F3F4F6', color: score >= 7 ? '#059669' : '#6B7280' }}>
            {score}
          </span>
        )}
      </div>

      {/* Intel pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {asia != null && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: asia > 70 ? '#FFF1F1' : '#FEF3C7', color: asia > 70 ? '#B91C1C' : '#92400E' }}>
            Asia {asia}%
          </span>
        )}
        {csrd && csrd !== 'Unknown' && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EEF0FF', color: '#4F46E5' }}>
            {csrd}
          </span>
        )}
        {contact.company?.avg_order_size_units && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
            {contact.company.avg_order_size_units}
          </span>
        )}
      </div>

      {/* Outreach notes */}
      <div className="mb-3">
        <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Personalisation hook (edit before opening LinkedIn)</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          placeholder="What's specific about this person / brand you'll reference in the DM?"
          className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none"
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111118', lineHeight: 1.5 }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {contact.linkedin_url ? (
          <button onClick={() => { saveNotes(); onOpenLinkedIn(contact.linkedin_url!) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-blue-50"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
            <Linkedin size={11} /> LinkedIn ↗
          </button>
        ) : (
          <span className="text-xs" style={{ color: '#9CA3AF' }}>No LinkedIn URL</span>
        )}
        <button onClick={markSent} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-[#F0FDF4]"
          style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065f46', opacity: saving ? 0.7 : 1 }}>
          <CheckCircle2 size={11} /> Mark Sent
        </button>
      </div>
    </div>
  )
}

/* ── Follow Up Card ── */
function FollowUpCard({ contact, onMarkSent }: { contact: OutreachContact; onMarkSent: (id: string, touch: 'touch2' | 'touch3') => void }) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const due = touchDue(contact)
  if (!due) return null

  const isTouch2 = due === 'touch2'
  const template = isTouch2
    ? `Subject: The supply chain question nobody's asking\n\n${contact.first_name}, following up on my LinkedIn message. I put together a short scorecard (8 questions, 4 minutes) that tells you whether your current sourcing setup is ready for the next Asia disruption — and your 2026 CSRD audit. Brands that have taken it are often surprised by their gaps. Want me to send it over?`
    : `${contact.first_name} — last note from me. We're running a pilot for 3 European brands wanting to pressure-test a nearshore production partner before they need one under pressure — first samples in 14 days, full CSRD docs included, sampling costs guaranteed. If that's relevant timing-wise, happy to share details. If not, no worries.`

  async function markSent() {
    setSaving(true)
    const field = isTouch2 ? 'touch_2_sent_at' : 'touch_3_sent_at'
    const status = isTouch2 ? 'Touch 2 sent' : 'Touch 3 sent'
    const { error } = await supabase.from('contacts').update({ [field]: new Date().toISOString(), touch_status: status }).eq('id', contact.id)
    if (error) { toast.error('Failed to update'); setSaving(false) }
    else { toast.success(isTouch2 ? 'Touch 2 logged' : 'Touch 3 logged'); onMarkSent(contact.id, due) }
  }

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <button onClick={() => router.push('/contacts/' + contact.id)} className="text-sm font-semibold hover:underline" style={{ color: '#111118' }}>
            {contact.first_name} {contact.last_name}
          </button>
          <div className="text-xs" style={{ color: '#6B7280' }}>{contact.company?.name}</div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
          {isTouch2 ? '📧 Touch 2 due' : '💬 Touch 3 due'}
        </span>
      </div>
      <div className="text-xs mb-3 p-2 rounded-lg whitespace-pre-wrap" style={{ background: '#FFFFF0', border: '1px solid #FDE68A', color: '#374151', lineHeight: 1.6 }}>
        {template}
      </div>
      <div className="flex items-center gap-2">
        {isTouch2 && contact.email && (
          <a href={'mailto:' + contact.email + '?subject=The supply chain question nobody%27s asking'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
            <Mail size={11} /> Open Email ↗
          </a>
        )}
        {!isTouch2 && contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
            <Linkedin size={11} /> LinkedIn ↗
          </a>
        )}
        <button onClick={markSent} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
          style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#78350F', opacity: saving ? 0.7 : 1 }}>
          <CheckCircle2 size={11} /> Mark Sent
        </button>
      </div>
    </div>
  )
}

/* ── Replied Card ── */
function RepliedCard({ contact }: { contact: OutreachContact }) {
  const router = useRouter()
  const sentiment = contact.reply_sentiment
  const sentimentColor = sentiment === 'Positive' ? '#059669' : sentiment === 'Neutral' ? '#F59E0B' : '#6B7280'
  const sentimentBg = sentiment === 'Positive' ? '#ECFDF5' : sentiment === 'Neutral' ? '#FFFBEB' : '#F3F4F6'

  const nextAction = sentiment === 'Positive' ? 'Book discovery call → move to Discovery Call stage' :
    sentiment === 'Neutral' ? 'Send scorecard link → move to Scorecard Sent' : 'Log response and close out'

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <button onClick={() => router.push('/contacts/' + contact.id)} className="text-sm font-semibold hover:underline" style={{ color: '#111118' }}>
            {contact.first_name} {contact.last_name}
          </button>
          <div className="text-xs" style={{ color: '#6B7280' }}>{contact.company?.name}</div>
        </div>
        {sentiment && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: sentimentBg, color: sentimentColor, border: '1px solid ' + sentimentColor + '44' }}>
            {sentiment}
          </span>
        )}
      </div>
      <div className="text-xs p-2 rounded-lg mb-3" style={{ background: '#F9FAFB', color: '#374151' }}>
        → {nextAction}
      </div>
      <button onClick={() => router.push('/contacts/' + contact.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}>
        <ExternalLink size={11} /> Open Contact →
      </button>
    </div>
  )
}

/* ── Main Page ── */
export default function OutreachPage() {
  const [sendToday, setSendToday] = useState<OutreachContact[]>([])
  const [followUp, setFollowUp] = useState<OutreachContact[]>([])
  const [replied, setReplied] = useState<OutreachContact[]>([])
  const [slots, setSlots] = useState<ProductionSlot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const select = '*, company:companies(id,name,domain,composite_priority_score,asia_dependency_pct,csrd_obligation,avg_order_size_units)'

    const [sendRes, followRes, repliedRes, slotsRes] = await Promise.all([
      // Column A: Not started, priority score >= 7
      supabase.from('contacts')
        .select(select)
        .eq('touch_status', 'Not started')
        .not('outreach_persona', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25),

      // Column B: Touch 1 sent (4+ days ago, no touch 2) OR Touch 2 sent (5+ days ago, no touch 3)
      supabase.from('contacts')
        .select(select)
        .in('touch_status', ['Touch 1 sent', 'Touch 2 sent'])
        .is('reply_sentiment', null),

      // Column C: Replied with Positive or Neutral sentiment
      supabase.from('contacts')
        .select(select)
        .eq('touch_status', 'Replied')
        .in('reply_sentiment', ['Positive', 'Neutral']),

      // Slots
      supabase.from('production_slots').select('*').eq('quarter', 'Q2-2026'),
    ])

    // Filter Column A by composite_priority_score >= 7
    const sendFiltered = (sendRes.data ?? []).filter((c: OutreachContact) =>
      (c.company?.composite_priority_score ?? 0) >= 7
    )
    setSendToday(sendFiltered)

    // Filter Column B: only contacts where the touch is actually due
    const followFiltered = (followRes.data ?? []).filter((c: OutreachContact) => touchDue(c) !== null)
    setFollowUp(followFiltered)

    setReplied(repliedRes.data ?? [])
    setSlots(slotsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function removeSend(id: string) {
    setSendToday(prev => prev.filter(c => c.id !== id))
  }
  function removeFollowUp(id: string) {
    setFollowUp(prev => prev.filter(c => c.id !== id))
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAFA' }}>
      <TopBar
        title="Daily Outreach"
        breadcrumb={[{ label: 'Outreach' }]}
        action={
          <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-gray-100"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Date line */}
        <div className="text-xs mb-4" style={{ color: '#9CA3AF' }}>{today}</div>

        {/* Slot bar */}
        {slots.length > 0 && <SlotBar slots={slots} />}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="space-y-2 w-full max-w-xs">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {/* Column A: Send Today */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366F1' }}>Send Today</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EEF0FF', color: '#6366F1' }}>{sendToday.length}</span>
              </div>
              {sendToday.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ background: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                  <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>All caught up!</p>
                  <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>Add contacts with persona set + score ≥ 7</p>
                </div>
              ) : (
                sendToday.map(c => (
                  <SendCard key={c.id} contact={c} onMarkSent={removeSend} onOpenLinkedIn={url => window.open(url, '_blank')} />
                ))
              )}
            </div>

            {/* Column B: Follow Up */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F59E0B' }}>Follow Up</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>{followUp.length}</span>
              </div>
              {followUp.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ background: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                  <Clock size={24} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>No follow-ups due</p>
                </div>
              ) : (
                followUp.map(c => (
                  <FollowUpCard key={c.id} contact={c} onMarkSent={(id) => removeFollowUp(id)} />
                ))
              )}
            </div>

            {/* Column C: Replied */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#10B981' }}>Replied — Act</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#065f46' }}>{replied.length}</span>
              </div>
              {replied.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ background: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                  <MessageSquare size={24} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>No replies to action yet</p>
                  <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>Replies appear when contact touch_status = Replied</p>
                </div>
              ) : (
                replied.map(c => <RepliedCard key={c.id} contact={c} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
