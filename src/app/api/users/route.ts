import { NextRequest, NextResponse } from 'next/server'
import { supabase, type AppUser, type Capability } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('shared_inbox_app_user')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: users as AppUser[] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { display_name, email, phone, role, capabilities }: { display_name: string; email?: string; phone?: string; role: 'admin' | 'agent'; capabilities?: string[] } = body

    if (!display_name || !role) {
      return NextResponse.json({ success: false, error: 'display_name and role are required' }, { status: 400 })
    }

    // Create user
    const { data: newUsers, error: userError } = await supabase
      .from('shared_inbox_app_user')
      .insert({ display_name, email, phone, role })
      .select()
      .limit(1)

    if (userError) throw userError
    const newUser = newUsers?.[0]

    // If explicit capabilities are provided, map keys -> ids and insert into user_capability
    if (newUser && Array.isArray(capabilities) && capabilities.length > 0) {
      const { data: caps, error: capError } = await supabase
        .from('capability')
        .select('*')
        .in('key', capabilities)

      if (capError) throw capError

      const userCaps = (caps || []).map((c: Capability) => ({ user_id: newUser.id, capability_id: c.id }))
      if (userCaps.length > 0) {
        const { error: insertError } = await supabase
          .from('user_capability')
          .insert(userCaps)
        if (insertError) throw insertError
      }
    }

    return NextResponse.json({ success: true, data: newUser })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create user' }, { status: 500 })
  }
}


