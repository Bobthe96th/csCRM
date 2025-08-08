import { NextResponse } from 'next/server'
import { AIAutoResponseService } from '@/lib/ai-auto-response'
import { ListingService } from '@/lib/listing-service'
import { GuestService } from '@/lib/guest-service'

export async function POST(request: Request) {
  try {
    const { question, guestId, conversationId, phoneNumber } = await request.json()

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 })
    }

    // Fetch all available properties
    const properties = await ListingService.fetchAllListings()
    
    // Generate auto-response
    const response = await AIAutoResponseService.generateAutoResponse(question, properties)
    
    // Analyze the question for logging/debugging
    const analysis = AIAutoResponseService.analyzeQuestion(question)
    const canAnswer = await AIAutoResponseService.canAnswerQuestion(question, properties)

    return NextResponse.json({
      success: true,
      data: {
        response: response.message,
        canAnswer: canAnswer.canAnswer,
        confidence: canAnswer.confidence,
        reason: canAnswer.reason,
        analysis: analysis,
        propertiesCount: properties.length,
                 guestId,
         conversationId,
         timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Auto-response error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        response: "I'm connecting you with a human agent who will be able to assist you better. They'll be chatting with you in a few minutes.",
        canAnswer: false,
        confidence: 'low',
        reason: 'Error occurred during processing'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Auto-response API is running',
    endpoints: {
      POST: '/api/auto-response - Send a question for auto-response'
    }
  })
} 