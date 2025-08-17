import { NextRequest, NextResponse } from 'next/server'

// Send outbound message via n8n (preferred) or fallback to WhatsApp Cloud API
export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json()
    if (!to || !message) {
      return NextResponse.json({ success: false, error: 'to and message are required' }, { status: 400 })
    }

    // Preferred: forward to n8n webhook if configured
    const n8nUrl = process.env.N8N_SEND_WEBHOOK_URL
    const n8nToken = process.env.N8N_TOKEN
    if (n8nUrl) {
      const r = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nToken ? { Authorization: `Bearer ${n8nToken}` } : {})
        },
        body: JSON.stringify({ to, message })
      })
      const json = await r.json().catch(() => ({}))
      if (!r.ok) {
        return NextResponse.json({ success: false, error: json?.error || 'n8n send failed' }, { status: 500 })
      }
      return NextResponse.json({ success: true, via: 'n8n', data: json })
    }

    // Fallback: direct Cloud API
    const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ success: false, error: 'No n8n URL and Cloud API envs missing' }, { status: 500 })
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    }

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const json = await r.json()
    if (!r.ok) {
      return NextResponse.json({ success: false, error: json?.error || 'Failed to send' }, { status: 500 })
    }
    return NextResponse.json({ success: true, via: 'cloud_api', data: json })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


