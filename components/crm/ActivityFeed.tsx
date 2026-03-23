'use client'
import { useState } from 'react'
import { Activity } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, ArrowRightLeft, Edit3, Phone, Mail, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const ACTIVITY_ICONS = {
  note: MessageSquare,
  status_change: ArrowRightLeft,
  field_update: Edit3,
  call: Phone,
  email: Mail,
  meeting: Users,
}

interface Props {
  activities: Activity[]
  entityType: 'company' | 'contact' | 'deal'
  entityId: string
  onRefresh: () => void
}

export default function ActivityFeed({ activities, entityType, entityId, onRefresh }: Props) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function addNote() {
    if (!note.trim()) return
    setSaving(true)
    const { error } = await supabase.from('activities').insert({
      type: 'note',
      content: note.trim(),
      entity_type: entityType,
      entity_id: entityId,
    })
    if (error) {
      toast.error('Failed to add note')
    } else {
      setNote('')
      toast.success('Note added')
      onRefresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="rounded-lg p-4" style={{ background: '#F8FBF9', border: '1px solid #D4E8DC' }}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="w-full bg-transparent text-sm resize-none outline-none"
          style={{ color: '#191D25' }}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={addNote}
            disabled={!note.trim() || saving}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{ background: '#1aaa5e', color: 'white', opacity: (!note.trim() || saving) ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Feed */}
      {activities.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#8aaa98' }}>
          <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => {
            const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare
            return (
              <div key={activity.id} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#EEF7F2', border: '1px solid #D4E8DC' }}>
                  <Icon size={13} style={{ color: '#638070' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: '#191D25' }}>{activity.content}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8aaa98' }}>{formatRelativeTime(activity.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
