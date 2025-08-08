import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Start a session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, user_email, user_agent } = body || {}

    const { data, error } = await supabase
      .from('user_session')
      .insert({ user_id, user_email, user_agent })
      .select()
      .limit(1)

    if (error) throw error
    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to start session' }, { status: 500 })
  }
}

// End a session
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, action } = body || {}
    if (!session_id) return NextResponse.json({ success: false, error: 'session_id required' }, { status: 400 })

    if (action === 'heartbeat') {
      const { data, error } = await supabase
        .from('user_session')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', session_id)
        .is('ended_at', null)
        .select()
        .limit(1)
      if (error) throw error
      return NextResponse.json({ success: true, data: data?.[0] })
    }

    // default: end
    const { data, error } = await supabase
      .from('user_session')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session_id)
      .select()
      .limit(1)
    if (error) throw error
    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to end session' }, { status: 500 })
  }
}

// Resume: find an active session by id and ensure it hasn't timed out (30 minutes)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('user_session')
      .select('*')
      .eq('id', Number(id))
      .limit(1)
    if (error) throw error

    const session = data?.[0]
    if (!session) return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 })

    // Consider session active if not ended and last activity within 30 minutes
    const THIRTY_MIN = 30 * 60 * 1000
    const last = new Date(session.last_activity_at).getTime()
    const ended = session.ended_at ? new Date(session.ended_at).getTime() : null
    const isActive = !ended && Date.now() - last <= THIRTY_MIN

    if (!isActive) {
      return NextResponse.json({ success: false, error: 'expired' }, { status: 410 })
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to resume session' }, { status: 500 })
  }
}


