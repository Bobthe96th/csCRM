import { NextResponse } from 'next/server'
import { GuestService } from '@/lib/guest-service'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test 1: Check if guest_ID table exists and has data
    const { data: guests, error: guestsError } = await supabase
      .from('guest_ID')
      .select('*')
      .limit(5)

    // Test 2: Check if Listingdata table exists and has data
    const { data: listings, error: listingsError } = await supabase
      .from('Listingdata')
      .select('*')
      .limit(5)

    // Test 3: Try to verify a guest with a sample phone number
    const testPhone = '+6631377343' // The phone number from the screenshot
    const verificationResult = await GuestService.verifyGuest({ phoneNumber: testPhone })

    return NextResponse.json({
      success: true,
      data: {
        guests: {
          count: guests?.length || 0,
          sample: guests?.slice(0, 2) || [],
          error: guestsError
        },
        listings: {
          count: listings?.length || 0,
          sample: listings?.slice(0, 2) || [],
          error: listingsError
        },
        verificationTest: {
          phoneNumber: testPhone,
          result: verificationResult
        }
      }
    })

  } catch (error) {
    console.error('Test guest error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 