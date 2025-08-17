import { NextRequest, NextResponse } from 'next/server'

// Sends messages via Chatwoot API to a specific conversation/contact
// Env required:
// CHATWOOT_BASE_URL (e.g., https://app.chatwoot.com)
// CHATWOOT_ACCOUNT_ID (numeric)
// CHATWOOT_ACCESS_TOKEN (personal access token)
// Either pass conversation_id, or contact_id+inbox_id, or just phone and we will rely on Chatwoot automation
export async function POST(req: NextRequest) {
  try {
    const { to, message, conversation_id, contact_id, inbox_id } = await req.json()
    if (!message) return NextResponse.json({ success: false, error: 'message_required' }, { status: 400 })

    const base = process.env.CHATWOOT_BASE_URL
    const accountId = process.env.CHATWOOT_ACCOUNT_ID
    const token = process.env.CHATWOOT_ACCESS_TOKEN
    if (!base || !accountId || !token) {
      return NextResponse.json({ success: false, error: 'chatwoot_env_missing' }, { status: 500 })
    }

    // If we have conversation_id, send reply to conversation
    if (conversation_id) {
      const url = `${base}/api/v1/accounts/${accountId}/conversations/${conversation_id}/messages`
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_access_token: String(token) },
        body: JSON.stringify({ content: message, message_type: 'outgoing' })
      })
      const json = await r.json().catch(() => ({}))
      if (!r.ok) return NextResponse.json({ success: false, error: json }, { status: 500 })
      return NextResponse.json({ success: true, data: json })
    }

    // Else create message to a contact in a given inbox
    if (contact_id && inbox_id) {
      const url = `${base}/api/v1/accounts/${accountId}/conversations`
      const r1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_access_token: String(token) },
        body: JSON.stringify({ source_id: String(contact_id), inbox_id: Number(inbox_id) })
      })
      const conv = await r1.json()
      if (!r1.ok) return NextResponse.json({ success: false, error: conv }, { status: 500 })
      const r2 = await fetch(`${base}/api/v1/accounts/${accountId}/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_access_token: String(token) },
        body: JSON.stringify({ content: message, message_type: 'outgoing' })
      })
      const json = await r2.json().catch(() => ({}))
      if (!r2.ok) return NextResponse.json({ success: false, error: json }, { status: 500 })
      return NextResponse.json({ success: true, data: json })
    }

    // If only phone provided, rely on Chatwoot phone mapping or automation (optional)
    if (to) {
      return NextResponse.json({ success: false, error: 'phone_only_not_supported_configure_mapping' }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'missing_target' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'error' }, { status: 500 })
  }
}


