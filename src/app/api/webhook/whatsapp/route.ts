import { NextRequest, NextResponse } from 'next/server'

interface WhatsAppMessage {
  to: string
  message: string
  agent: 'AI' | 'Human'
  conversation_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppMessage = await request.json()
    
    // Validate required fields
    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: to and message' },
        { status: 400 }
      )
    }

    console.log('Webhook received WhatsApp message:', {
      to: body.to,
      message: body.message,
      agent: body.agent,
      conversation_id: body.conversation_id
    })

    // TODO: Replace with your actual WhatsApp API endpoint
    // This is where you would integrate with your WhatsApp Business API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://your-whatsapp-api.com/send'
    const whatsappApiKey = process.env.WHATSAPP_API_KEY

    if (!whatsappApiKey) {
      console.warn('WhatsApp API key not configured, simulating message send')
      // Simulate successful send for testing
      return NextResponse.json({
        success: true,
        message_id: `msg_${Date.now()}`,
        status: 'sent',
        timestamp: new Date().toISOString()
      })
    }

    // Send message to WhatsApp API
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappApiKey}`
      },
      body: JSON.stringify({
        to: body.to,
        message: body.message,
        agent: body.agent,
        conversation_id: body.conversation_id
      })
    })

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    console.log('WhatsApp message sent successfully:', result)

    return NextResponse.json({
      success: true,
      message_id: result.message_id || `msg_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      whatsapp_response: result
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing the webhook
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Webhook is active',
    endpoints: {
      POST: '/api/webhook/whatsapp - Send message to WhatsApp',
      GET: '/api/webhook/whatsapp - Test endpoint'
    },
    required_fields: {
      to: 'Phone number (string)',
      message: 'Message text (string)',
      agent: 'AI or Human (string, optional)',
      conversation_id: 'Conversation ID (string, optional)'
    },
    example: {
      to: '+1234567890',
      message: 'Hello from the chat interface!',
      agent: 'Human',
      conversation_id: 'conv_123'
    }
  })
} 