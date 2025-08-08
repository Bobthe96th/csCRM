import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API key not found in environment variables' 
      }, { status: 400 })
    }

    // Test OpenAI connection
    const openai = new OpenAI({
      apiKey: apiKey
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello from OpenAI!' if you can read this message."
        }
      ],
      max_tokens: 50
    })

    const response = completion.choices[0]?.message?.content

    return NextResponse.json({ 
      success: true, 
      message: 'OpenAI API is working correctly',
      response: response,
      apiKeyConfigured: !!apiKey
    })

  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY
    }, { status: 500 })
  }
} 