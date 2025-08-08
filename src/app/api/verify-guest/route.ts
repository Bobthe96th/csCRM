import { NextResponse } from 'next/server'
import { GuestService } from '@/lib/guest-service'

export async function POST(request: Request) {
  try {
    const { phoneNumber, name, ginCode, email } = await request.json()

    // At least one verification method must be provided
    if (!phoneNumber && !name && !ginCode && !email) {
      return NextResponse.json({
        success: false,
        error: 'At least one verification method is required (phoneNumber, name, ginCode, or email)'
      }, { status: 400 })
    }

    const verificationResult = await GuestService.verifyGuest({
      phoneNumber,
      name,
      ginCode,
      email
    })

    return NextResponse.json({
      success: true,
      data: verificationResult
    })

  } catch (error) {
    console.error('Guest verification error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Guest verification API is running',
    endpoints: {
      POST: '/api/verify-guest - Verify guest identity'
    },
    requiredFields: {
      phoneNumber: 'string (optional)',
      name: 'string (optional)',
      ginCode: 'string (optional)',
      email: 'string (optional)'
    }
  })
} 