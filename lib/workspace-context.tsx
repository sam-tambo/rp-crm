'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember, UserProfile, MemberRole } from '@/lib/types'

interface WorkspaceContextType {
  workspace: Workspace | null
  member: WorkspaceMember | null
  profile: UserProfile | null
  userEmail: string | null
  userId: string | null
  loading: boolean
  refetch: () => void
  canManageTeam: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  member: null,
  profile: null,
  userEmail: null,
  userId: null,
  loading: true,
  refetch: () => {},
  canManageTeam: false,
})

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    setUserEmail(user.email ?? null)
    setUserId(user.id)

    // Load workspace membership (join to workspace table)
    const { data: mem } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, invited_by, joined_at, workspaces(id, name, slug, logo_url, created_at)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (mem) {
      const ws = mem.workspaces as unknown as Workspace
      setWorkspace(ws)
      setMember({
        id: mem.id,
        workspace_id: mem.workspace_id,
        user_id: mem.user_id,
        role: mem.role as MemberRole,
        invited_by: mem.invited_by,
        joined_at: mem.joined_at,
      })
    }

    // Load user profile
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, updated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (prof) setProfile(prof as UserProfile)

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const canManageTeam = member?.role === 'owner' || member?.role === 'admin'

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      member,
      profile,
      userEmail,
      userId,
      loading,
      refetch: load,
      canManageTeam,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)
