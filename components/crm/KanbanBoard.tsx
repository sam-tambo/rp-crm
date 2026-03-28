'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Deal, DealStage, ProductionSlot } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, AlertTriangle } from 'lucide-react'

const STAGES: { id: DealStage; label: string; color: string; bg: string }[] = [
  { id: 'identified',     label: 'Identified',     color: '#6B7280', bg: 'rgba(107,114,128,0.05)' },
  { id: 'in_sequence',    label: 'In Sequence',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
  { id: 'scorecard_sent', label: 'Scorecard Sent',  color: '#6366F1', bg: 'rgba(99,102,241,0.06)' },
  { id: 'discovery_call', label: 'Discovery Call',  color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
  { id: 'pilot_proposed', label: 'Pilot Proposed',  color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  { id: 'slot_confirmed', label: 'Slot Confirmed',  color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  { id: 'in_production',  label: 'In Production',   color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { id: 'closed_won',     label: 'Closed Won',      color: '#065f46', bg: 'rgba(6,95,70,0.06)' },
  { id: 'closed_lost',    label: 'Closed Lost',     color: '#EF4444', bg: 'rgba(239,68,68,0.05)' },
]

function isStale(deal: Deal): boolean {
  const ref = deal.last_activity_at ?? deal.updated_at
  if (!ref) return false
  return Date.now() - new Date(ref).getTime() > 7 * 24 * 60 * 60 * 1000
}

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const stale = isStale(deal)

  const cardBg = deal.stage === 'closed_won'    ? '#F0FDF4' :
                 deal.stage === 'closed_lost'   ? '#FFF5F5' :
                 deal.stage === 'slot_confirmed' ? '#ECFDF5' :
                 deal.stage === 'in_production'  ? '#ECFDF5' :
                 '#FFFFFF'
  const cardBorder = deal.stage === 'closed_won'    ? '#86EFAC' :
                     deal.stage === 'closed_lost'   ? '#FCA5A5' :
                     deal.stage === 'slot_confirmed' ? '#6EE7B7' :
                     deal.stage === 'in_production'  ? '#34D399' :
                     '#E5E7EB'

  const cardStyle = { ...style, background: cardBg, border: '1px solid ' + cardBorder, marginBottom: '8px' }

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} {...listeners}
      onClick={() => router.push('/deals/' + deal.id)}
      className="rounded-lg p-3 cursor-pointer active:cursor-grabbing">
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="font-medium text-sm truncate" style={{ color: '#111118' }}>{deal.name}</div>
        {stale && <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} title="No activity in 7+ days" />}
      </div>
      {(deal as any).company?.name && (
        <div className="text-xs mb-1.5 truncate" style={{ color: '#6B7280' }}>{(deal as any).company.name}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold" style={{ color: '#059669' }}>{formatCurrency(deal.value)}</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.10)', color: '#6366F1' }}>{deal.probability}%</span>
      </div>
      {deal.close_date && (
        <div className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>Close: {formatDate(deal.close_date)}</div>
      )}
    </div>
  )
}

/* ── Slot Status Bar ───────────────────────────────────── */
function SlotStatusBar({ slots }: { slots: ProductionSlot[] }) {
  const q2Slots = slots.filter(s => s.quarter === 'Q2-2026')
  const nextQuarter = 'Q3 → Jul 1'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-xl text-xs"
      style={{ background: '#F8FAFF', border: '1px solid #E0E7FF' }}>
      <span className="font-semibold uppercase tracking-wider" style={{ color: '#6366F1', fontSize: 10 }}>Q2 Production Slots</span>
      <div className="flex items-center gap-2">
        {q2Slots.map(slot => {
          const available = slot.status === 'available'
          return (
            <div key={slot.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: available ? '#ECFDF5' : '#FFF1F1',
                border: '1px solid ' + (available ? '#6EE7B7' : '#FCA5A5')
              }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: available ? '#10B981' : '#EF4444' }} />
              <span style={{ color: available ? '#065f46' : '#991B1B', fontWeight: 600 }}>
                {slot.slot_code.replace('Q2-2026-', 'Slot ')}
              </span>
              <span style={{ color: available ? '#059669' : '#B91C1C' }}>
                {available ? 'AVAILABLE' : ((slot as any).deal?.name?.slice(0, 12) ?? 'TAKEN')}
              </span>
            </div>
          )
        })}
      </div>
      <span className="ml-auto" style={{ color: '#9CA3AF' }}>Next: {nextQuarter}</span>
    </div>
  )
}

interface Props {
  deals: Deal[]
  onAddDeal: (stage: DealStage) => void
  onRefresh: () => void
}

export default function KanbanBoard({ deals, onAddDeal, onRefresh }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [slots, setSlots] = useState<ProductionSlot[]>([])
  const supabase = createClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    supabase
      .from('production_slots')
      .select('*, deal:deals(id,name)')
      .eq('quarter', 'Q2-2026')
      .then(({ data }) => setSlots(data ?? []))
  }, [])

  const dealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage)
  const totalByStage = (stage: DealStage) => dealsByStage(stage).reduce((sum, d) => sum + (d.value ?? 0), 0)
  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    let targetStage: DealStage | null = null
    for (const stage of STAGES) {
      if (over.id === stage.id || dealsByStage(stage.id).some(d => d.id === over.id)) {
        targetStage = stage.id
        break
      }
    }

    if (!targetStage) return
    const deal = deals.find(d => d.id === active.id)
    if (!deal || deal.stage === targetStage) return

    // Prompt for loss reason if moving to closed_lost
    if (targetStage === 'closed_lost') {
      const reason = window.prompt('Reason for closing lost? (No reply / Chose competitor / Poor timing / No budget / Quality concern / Other)')
      if (reason === null) return // cancelled
      await supabase.from('deals').update({ stage: targetStage, loss_reason: reason, last_activity_at: new Date().toISOString() }).eq('id', active.id as string)
      toast.success('Deal closed lost')
      onRefresh()
      return
    }

    const { error } = await supabase.from('deals').update({ stage: targetStage, last_activity_at: new Date().toISOString() }).eq('id', active.id as string)
    if (error) { toast.error('Failed to update deal stage') } else {
      toast.success('Moved to ' + (STAGES.find(s => s.id === targetStage)?.label ?? targetStage))
      onRefresh()
    }
  }

  return (
    <div>
      {/* Slot status bar */}
      {slots.length > 0 && <SlotStatusBar slots={slots} />}

      <DndContext sensors={sensors} onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 pb-6 overflow-x-auto min-h-0" style={{ height: 'calc(100vh - 180px)' }}>
          {STAGES.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-60 flex flex-col rounded-xl" style={{ background: stage.bg, border: '1px solid ' + stage.color + '22' }}>
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid ' + stage.color + '22' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: stage.color + '22', color: stage.color }}>{dealsByStage(stage.id).length}</span>
                </div>
                <button onClick={() => onAddDeal(stage.id)} className="p-1 rounded hover:bg-white/40 transition-colors">
                  <Plus size={12} style={{ color: stage.color }} />
                </button>
              </div>
              {/* Total */}
              <div className="px-3 py-1.5 text-xs font-medium" style={{ color: stage.color, borderBottom: '1px solid ' + stage.color + '11' }}>
                {formatCurrency(totalByStage(stage.id))}
              </div>
              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2.5">
                <SortableContext items={dealsByStage(stage.id).map(d => d.id)} strategy={verticalListSortingStrategy}>
                  {dealsByStage(stage.id).map(deal => (
                    <DealCard key={deal.id} deal={deal} isDragging={deal.id === activeId} />
                  ))}
                </SortableContext>
                {dealsByStage(stage.id).length === 0 && (
                  <div className="text-center py-6 text-xs" style={{ color: stage.color + '88' }}>Drop deals here</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeDeal && (
            <div className="rounded-lg p-3 shadow-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', width: '240px' }}>
              <div className="font-medium text-sm" style={{ color: '#111118' }}>{activeDeal.name}</div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#059669' }}>{formatCurrency(activeDeal.value)}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
