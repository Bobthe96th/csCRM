import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// WhatsApp Cloud API webhook: verification + inbound events

// GET: verify webhook (Meta will call with hub.challenge)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }
  return NextResponse.json({ ok: true, message: 'Webhook is up' })
}

// POST: receive inbound messages/status updates from Meta
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // Meta sends objects with shape: { object: 'whatsapp_business_account', entry: [ ... ] }
    if (data?.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true })
    }

    for (const entry of data.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value

        // Handle inbound messages
        if (value?.messages) {
          for (const msg of value.messages) {
            const from = msg.from
            const textBody = msg.text?.body || msg.button?.text || msg.interactive?.body?.text || ''
            if (from && textBody) {
              await supabase.from('whatsapp_inbox').insert({
                sender_number: from,
                message_text: textBody,
                direction: 'inbound',
                agent: 'AI',
                status: 'open'
              })
            }
          }
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('ERROR', { status: 500 })
  }
}