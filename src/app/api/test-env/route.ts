import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    hasOpenAIKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    openAIKeyStart: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 10) || 'NOT_FOUND',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || 'NOT_FOUND',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('SUPABASE'))
  }

  return NextResponse.json({
    success: true,
    message: 'Environment variables check',
    data: envVars
  })
} 