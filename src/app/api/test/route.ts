import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp Chat Management API is running!',
    timestamp: new Date().toISOString()
  })
} 