import { NextResponse } from 'next/server'
import { ICalService } from '@/lib/ical-service'

export async function POST(request: Request) {
  try {
    const { icalLinkId } = await request.json()

    if (!icalLinkId) {
      return NextResponse.json({
        success: false,
        error: 'iCal link ID is required'
      }, { status: 400 })
    }

    const result = await ICalService.syncICalData(icalLinkId)

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Successfully synced ${result.eventsAdded} events` 
        : `Sync failed: ${result.error}`
    })

  } catch (error) {
    console.error('iCal sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'iCal sync API is running',
    endpoints: {
      POST: '/api/sync-ical - Sync iCal data for a specific link'
    }
  })
} 