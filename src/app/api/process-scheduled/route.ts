import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ScheduledMessage {
  id: number
  message_text: string
  recipient_number: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'cancelled'
}

// Mock send for development/testing so we don't need a real WhatsApp API
async function sendWhatsApp(to: string, message: string) {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 50))
  return {
    success: true,
    message_id: `mock_${Date.now()}`,
    status: 'sent',
    to,
    message
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const debug = url.searchParams.get('debug') === '1'
    const now = Date.now()
    const windowMs = 60_000 // process anything due in the next 60s as well
    const horizonIso = new Date(now + windowMs).toISOString()

    // Fetch due, pending messages
    const { data: due, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', horizonIso)
      .order('scheduled_time', { ascending: true })
      .limit(20)

    if (error) throw error

    const results: Array<{ id: number; status: string; error?: string }> = []

    for (const msg of (due || []) as ScheduledMessage[]) {
      try {
        // Send via WhatsApp (internal route simulates if API key missing)
        await sendWhatsApp(msg.recipient_number, msg.message_text)

        // Insert into whatsapp_inbox for history
        const { error: insertErr } = await supabase
          .from('whatsapp_inbox')
          .insert({
            sender_number: msg.recipient_number,
            message_text: msg.message_text,
            direction: 'outbound',
            agent: 'Human',
            status: 'open'
          })
        if (insertErr) throw insertErr

        // Mark as sent
        const { error: updErr } = await supabase
          .from('scheduled_messages')
          .update({ status: 'sent' })
          .eq('id', msg.id)
          .eq('status', 'pending')
        if (updErr) throw updErr

        results.push({ id: msg.id, status: 'sent' })
      } catch (e: any) {
        results.push({ id: msg.id, status: 'error', error: String(e?.message || e) })
      }
    }

    return NextResponse.json({ processed: results.length, results, now: new Date(now).toISOString(), horizon: horizonIso, due_count: due?.length || 0, debug_due: debug ? due : undefined })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
