'use client'
import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Deal, DealStage } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const STAGES: { id: DealStage; label: string; color: string; bg: string }[] = [
  { id: 'prospecting', label: 'Prospecting', color: '#9090A8', bg: 'rgba(90,90,112,0.06)' },
  { id: 'qualification', label: 'Qualification', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
  { id: 'proposal', label: 'Proposal', color: '#6366F1', bg: 'rgba(99,102,241,0.06)' },
  { id: 'negotiation', label: 'Negotiation', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  { id: 'closed_won', label: 'Closed Won', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  { id: 'closed_lost', label: 'Closed Lost', color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
]

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const cardStyle = { ...style, background: '#1A1A24', border: '1px solid #2A2A38', marginBottom: '8px' }

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} {...listeners}
      className="rounded-lg p-3 cursor-grab active:cursor-grabbing">
      <div className="font-medium text-sm mb-1.5 truncate" style={{ color: '#F4F4F8' }}>{deal.name}</div>
      {(deal as any).company?.name && (
        <div className="text-xs mb-1.5 truncate" style={{ color: '#9090A8' }}>{(deal as any).company.name}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold" style={{ color: '#10B981' }}>{formatCurrency(deal.value)}</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>{deal.probability}%</span>
      </div>
      {deal.close_date && (
        <div className="text-xs mt-1.5" style={{ color: '#5A5A70' }}>Close: {formatDate(deal.close_date)}</div>
      )}
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
  const supabase = createClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

    const { error } = await supabase.from('deals').update({ stage: targetStage }).eq('id', active.id as string)
    if (error) { toast.error('Failed to update deal stage') } else {
      toast.success(`Moved to ${STAGES.find(s => s.id === targetStage)?.label}`)
      onRefresh()
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={e => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 pb-6 overflow-x-auto min-h-0" style={{ height: 'calc(100vh - 120px)' }}>
        {STAGES.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col rounded-xl" style={{ background: stage.bg, border: `1px solid ${stage.color}22` }}>
            {/* Column header */}
            <div className="px-3 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${stage.color}22` }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${stage.color}22`, color: stage.color }}>{dealsByStage(stage.id).length}</span>
              </div>
              <button onClick={() => onAddDeal(stage.id)} className="p-1 rounded hover:bg-white/5 transition-colors">
                <Plus size={13} style={{ color: stage.color }} />
              </button>
            </div>
            {/* Total */}
            <div className="px-3 py-1.5 text-xs font-medium" style={{ color: stage.color, borderBottom: `1px solid ${stage.color}11` }}>
              {formatCurrency(totalByStage(stage.id))}
            </div>
            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3">
              <SortableContext items={dealsByStage(stage.id).map(d => d.id)} strategy={verticalListSortingStrategy}>
                {dealsByStage(stage.id).map(deal => (
                  <DealCard key={deal.id} deal={deal} isDragging={deal.id === activeId} />
                ))}
              </SortableContext>
              {dealsByStage(stage.id).length === 0 && (
                <div className="text-center py-6 text-xs" style={{ color: '#5A5A70' }}>Drop deals here</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="rounded-lg p-3 shadow-xl" style={{ background: '#1A1A24', border: '1px solid #6366F1', width: '256px' }}>
            <div className="font-medium text-sm" style={{ color: '#F4F4F8' }}>{activeDeal.name}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: '#10B981' }}>{formatCurrency(activeDeal.value)}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
