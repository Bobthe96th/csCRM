import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Chatwoot webhook for incoming messages
// Configure in Chatwoot: Settings → Integrations → Webhooks → URL: /api/chatwoot/inbound
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Chatwoot inbound webhook is live' })
}

export async function POST(req: NextRequest) {
  try {
    const evt = await req.json()
    // Typical payload fields: content, conversation, sender, message_type
    const content = evt?.content || ''
    const conversationId = evt?.conversation?.id || evt?.conversation_id
    const senderPhone = evt?.sender?.phone_number || evt?.sender?.phone || evt?.sender?.identifier

    if (!content || !conversationId) {
      return NextResponse.json({ success: false, error: 'invalid_payload' }, { status: 400 })
    }

    // Resolve phone via mapping if missing
    let phone = senderPhone as string | undefined
    if (!phone && conversationId) {
      const { data: map } = await supabase
        .from('chatwoot_mapping')
        .select('*')
        .eq('conversation_id', conversationId)
        .limit(1)
        .single()
      phone = map?.phone
    }

    await supabase.from('whatsapp_inbox').insert({
      sender_number: phone || String(conversationId),
      message_text: content,
      direction: 'inbound',
      agent: 'AI',
      status: 'open'
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'error' }, { status: 500 })
  }
}


