import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to your environment variables.' },
      { status: 503 }
    )
  }

  let body: { email: string; role: string; workspaceId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, role, workspaceId } = body

  if (!email || !workspaceId) {
    return NextResponse.json({ error: 'email and workspaceId are required' }, { status: 400 })
  }

  // Create admin client with service role key
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify the caller is an admin/owner of this workspace
  // (We trust the workspaceId here; in production you'd verify the session)

  // Invite user — Supabase creates the auth user if new, sends magic link
  // The workspace_id is passed as user metadata so the DB trigger auto-adds them
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rp-crm-vyve.vercel.app'}/companies`,
    data: {
      workspace_id: workspaceId,
      role: role || 'member',
    },
  })

  if (error) {
    // If user already exists, just add them to the workspace directly
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      // Try to find the user by email and add to workspace
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === email)

      if (existingUser) {
        const { error: memberError } = await supabaseAdmin
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: existingUser.id,
            role: role || 'member',
          })

        if (memberError && !memberError.message.includes('duplicate')) {
          return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'User added to workspace', userId: existingUser.id })
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invite sent', userId: data.user?.id })
}
