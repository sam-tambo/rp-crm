'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import { toast } from 'sonner'
import {
  Users, Settings, Crown, Shield, User, Eye,
  Mail, Trash2, ChevronDown, Check, X, UserPlus, Copy
} from 'lucide-react'
import type { WorkspaceMember, UserProfile, MemberRole } from '@/lib/types'

/* ── Role config ─────────────────────────────────────── */
const ROLES: { value: MemberRole; label: string; desc: string; icon: typeof Crown }[] = [
  { value: 'owner',  label: 'Owner',  desc: 'Full access, billing, delete workspace', icon: Crown },
  { value: 'admin',  label: 'Admin',  desc: 'Manage members, all data',               icon: Shield },
  { value: 'member', label: 'Member', desc: 'Create and edit all records',             icon: User },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access',                        icon: Eye },
]

const roleColor: Record<MemberRole, [string, string]> = {
  owner:  ['#FEF3C7', '#92400E'],
  admin:  ['#EEF0FF', '#4F46E5'],
  member: ['#F0FDF4', '#065F46'],
  viewer: ['#F3F4F6', '#6B7280'],
}

function RoleBadge({ role }: { role: MemberRole }) {
  const [bg, color] = roleColor[role] ?? ['#F3F4F6', '#6B7280']
  const r = ROLES.find(x => x.value === role)
  return (
    <span style={{ background: bg, color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
      {r?.label ?? role}
    </span>
  )
}

/* ── Avatar ──────────────────────────────────────────── */
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = [
    ['#d1fae5','#065f46'],['#dbeafe','#1e40af'],['#fce7f3','#9d174d'],
    ['#fef3c7','#92400e'],['#ede9fe','#5b21b6'],['#fee2e2','#991b1b'],
    ['#e0e7ff','#3730a3'],['#fdf4ff','#7e22ce'],
  ]
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  const [bg, tx] = colors[h % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: tx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.42), fontWeight: 700, flexShrink: 0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

/* ── RoleDropdown ────────────────────────────────────── */
function RoleDropdown({ currentRole, memberId, onUpdate, disabled }: {
  currentRole: MemberRole
  memberId: string
  onUpdate: (memberId: string, role: MemberRole) => Promise<void>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function select(role: MemberRole) {
    if (role === currentRole) { setOpen(false); return }
    setSaving(true)
    await onUpdate(memberId, role)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        disabled={disabled || saving}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
        style={{ background: '#F9F9FB', border: '1px solid #E4E4EB', color: '#374151', opacity: disabled ? 0.5 : 1 }}
      >
        <RoleBadge role={currentRole} />
        {!disabled && <ChevronDown size={10} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-lg py-1 w-52 shadow-lg" style={{ background: '#FFFFFF', border: '1px solid #E4E4EB' }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => select(r.value)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <r.icon size={13} style={{ color: '#9CA3AF', marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium" style={{ color: '#111118' }}>{r.label}</div>
                  <div className="text-[10px]" style={{ color: '#9CA3AF' }}>{r.desc}</div>
                </div>
                {currentRole === r.value && <Check size={12} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Invite Modal ────────────────────────────────────── */
function InviteModal({ workspaceId, onClose, onSuccess }: {
  workspaceId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role, workspaceId }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Failed to send invite')
    } else {
      toast.success(`Invite sent to ${email}`)
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  const inputStyle = { background: '#F9F9FB', border: '1px solid #E4E4EB', color: '#111118', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl shadow-xl" style={{ background: '#FFFFFF', border: '1px solid #E4E4EB' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0F0F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#111118' }}>Invite team member</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <X size={14} style={{ color: '#6B7280' }} />
            </button>
          </div>
          <form onSubmit={handleInvite} className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as MemberRole)}
                style={inputStyle}
              >
                {ROLES.filter(r => r.value !== 'owner').map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm transition-colors" style={{ background: '#F9F9FB', border: '1px solid #E4E4EB', color: '#374151' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !email.trim()} className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: '#059669', color: 'white', opacity: (loading || !email.trim()) ? 0.7 : 1 }}>
                {loading ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

/* ── Main Page ───────────────────────────────────────── */
type Tab = 'team' | 'workspace' | 'profile'

interface MemberWithProfile extends WorkspaceMember {
  profile: UserProfile
}

export default function SettingsPage() {
  const { workspace, member, profile, userEmail, userId, canManageTeam, refetch } = useWorkspace()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('team')
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEnabled, setInviteEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/setup-status').then(r => r.json()).then(d => setInviteEnabled(d.inviteEnabled))
  }, [])


  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => { setFullName(profile?.full_name ?? '') }, [profile])

  const fetchMembers = useCallback(async () => {
    if (!workspace?.id) return
    setLoadingMembers(true)
    const { data } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, invited_by, joined_at, profile:user_profiles(id, full_name, email, avatar_url, updated_at)')
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: true })

    if (data) {
      setMembers(data.map(m => ({
        ...m,
        role: m.role as MemberRole,
        profile: (m.profile as unknown as UserProfile) ?? { id: m.user_id, full_name: null, email: null, avatar_url: null, updated_at: '' },
      })))
    }
    setLoadingMembers(false)
  }, [workspace?.id])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  async function updateMemberRole(memberId: string, role: MemberRole) {
    const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId)
    if (error) { toast.error('Failed to update role') }
    else { toast.success('Role updated'); fetchMembers() }
  }

  async function removeMember(mem: MemberWithProfile) {
    if (!confirm(`Remove ${mem.profile?.full_name || mem.profile?.email || 'this member'} from the workspace?`)) return
    const { error } = await supabase.from('workspace_members').delete().eq('id', mem.id)
    if (error) { toast.error('Failed to remove member') }
    else { toast.success('Member removed'); fetchMembers() }
  }

  async function saveProfile() {
    if (!userId) return
    setSavingProfile(true)
    const { error } = await supabase.from('user_profiles').update({ full_name: fullName.trim() || null }).eq('id', userId)
    if (error) { toast.error('Failed to save profile') }
    else { toast.success('Profile saved'); refetch() }
    setSavingProfile(false)
  }

  const tabStyle = (t: Tab) => ({
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: tab === t ? 500 : 400,
    color: tab === t ? '#111118' : '#6B7280',
    borderBottom: tab === t ? '2px solid #059669' : '2px solid transparent',
    cursor: 'pointer' as const,
    background: 'none',
    border: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: tab === t ? '#059669' : 'transparent',
    whiteSpace: 'nowrap' as const,
  })

  const iStyle = { background: '#F9F9FB', border: '1px solid #E4E4EB', color: '#111118', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" breadcrumb={[{ label: 'Settings' }]} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">

          {/* Tabs */}
          <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid #EBEBF0' }}>
            <button style={tabStyle('team')} onClick={() => setTab('team')}>
              <span className="flex items-center gap-1.5"><Users size={13} />Team</span>
            </button>
            <button style={tabStyle('profile')} onClick={() => setTab('profile')}>
              <span className="flex items-center gap-1.5"><User size={13} />My Profile</span>
            </button>
            <button style={tabStyle('workspace')} onClick={() => setTab('workspace')}>
              <span className="flex items-center gap-1.5"><Settings size={13} />Workspace</span>
            </button>
          </div>

          {/* ── TEAM TAB ── */}
          {tab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: '#111118' }}>Team members</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
                  </p>
                </div>
                {canManageTeam && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: '#059669', color: 'white' }}
                  >
                    <UserPlus size={13} />
                    Invite member
                  </button>
                )}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBEBF0' }}>
                {loadingMembers ? (
                  <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Loading members…</div>
                ) : members.length === 0 ? (
                  <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>No members yet.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EBEBF0' }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Member</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Role</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Joined</th>
                        {canManageTeam && <th className="px-4 py-3" />}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => {
                        const name = m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Unknown'
                        const email = m.profile?.email || ''
                        const isMe = m.user_id === userId
                        const isOwner = m.role === 'owner'
                        const canEdit = canManageTeam && !isMe && !(isOwner && member?.role !== 'owner')
                        return (
                          <tr key={m.id} style={{ borderBottom: i < members.length - 1 ? '1px solid #F5F5F8' : 'none' }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={name} size={32} />
                                <div>
                                  <div className="text-sm font-medium" style={{ color: '#111118' }}>
                                    {name}{isMe && <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded" style={{ background: '#F0FDF4', color: '#059669' }}>You</span>}
                                  </div>
                                  {email && <div className="text-xs" style={{ color: '#9CA3AF' }}>{email}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {canEdit ? (
                                <RoleDropdown
                                  currentRole={m.role}
                                  memberId={m.id}
                                  onUpdate={updateMemberRole}
                                  disabled={!canEdit}
                                />
                              ) : (
                                <RoleBadge role={m.role} />
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>
                              {new Date(m.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            {canManageTeam && (
                              <td className="px-4 py-3 text-right">
                                {canEdit && (
                                  <button
                                    onClick={() => removeMember(m)}
                                    className="p-1.5 rounded transition-colors hover:bg-red-50"
                                    title="Remove member"
                                  >
                                    <Trash2 size={13} style={{ color: '#EF4444' }} />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Setup note if service role key missing */}
              {inviteEnabled === false && (
                <div className="rounded-lg p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#92400E' }}>Invite emails require setup</p>
                  <p className="text-xs" style={{ color: '#B45309' }}>
                    To enable email invites, add <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#FEF3C7' }}>SUPABASE_SERVICE_ROLE_KEY</code> to your Vercel environment variables. Find it in your Supabase dashboard under Settings → API.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <div className="rounded-xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#111118' }}>Personal information</h3>
                <div className="flex items-center gap-4">
                  <Avatar name={profile?.full_name || userEmail?.split('@')[0] || 'U'} size={48} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#111118' }}>{profile?.full_name || 'No name set'}</div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>{userEmail}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Display name</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{ ...iStyle, width: '100%' }}
                    onKeyDown={e => { if (e.key === 'Enter') saveProfile() }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Email</label>
                  <input value={userEmail ?? ''} disabled style={{ ...iStyle, width: '100%', opacity: 0.6 }} />
                  <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>Email is managed through your Supabase auth account.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Role in workspace</label>
                  <div className="mt-1"><RoleBadge role={(member?.role ?? 'member') as MemberRole} /></div>
                </div>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: '#059669', color: 'white', opacity: savingProfile ? 0.7 : 1 }}
                >
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </div>
          )}

          {/* ── WORKSPACE TAB ── */}
          {tab === 'workspace' && (
            <div className="space-y-5">
              <div className="rounded-xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#111118' }}>Workspace information</h3>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Workspace name</label>
                  <input value={workspace?.name ?? ''} disabled style={{ ...iStyle, width: '100%', opacity: 0.6 }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Workspace ID</label>
                  <div className="flex items-center gap-2">
                    <input value={workspace?.id ?? ''} readOnly style={{ ...iStyle, flex: 1, fontFamily: 'monospace', fontSize: 11 }} />
                    <button
                      onClick={() => { navigator.clipboard.writeText(workspace?.id ?? ''); toast.success('Copied') }}
                      className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                      style={{ border: '1px solid #E4E4EB' }}
                    >
                      <Copy size={13} style={{ color: '#6B7280' }} />
                    </button>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>Share this ID with team members to join the workspace.</p>
                </div>
              </div>

              {/* Migration status card */}
              <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EBEBF0' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#111118' }}>Database status</h3>
                {workspace ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />
                    <span className="text-xs" style={{ color: '#6B7280' }}>Multi-tenancy migration applied — workspace active</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                      <span className="text-xs" style={{ color: '#6B7280' }}>Migration pending — run the SQL script in your Supabase dashboard</span>
                    </div>
                    <a
                      href="https://supabase.com/dashboard/project/gfpyhleenbexsroheuig/sql/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium underline"
                      style={{ color: '#059669' }}
                    >
                      Open Supabase SQL Editor →
                    </a>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                      Run the file at <code>supabase/migrations/20260327_multitenancy.sql</code> in your project.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvite && workspace && (
        <InviteModal
          workspaceId={workspace.id}
          onClose={() => setShowInvite(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  )
}
