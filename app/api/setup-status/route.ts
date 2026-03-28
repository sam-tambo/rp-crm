import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    inviteEnabled: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL),
  })
}
