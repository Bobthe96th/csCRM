import OpenAI from 'openai'

// Initialize OpenAI client conditionally
let openai: OpenAI | null = null

const initializeOpenAI = () => {
  if (!openai) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    console.log('Initializing OpenAI with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND')
    
    if (!apiKey) {
      console.error('OpenAI API key is not configured')
      return null
    }
    
    try {
      openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
      })
      console.log('OpenAI client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error)
      return null
    }
  }
  return openai
}

export interface AIResponse {
  success: boolean
  message?: string
  error?: string
}

export interface PropertyContext {
  propertyName: string
  address: string
  district: string
  zone?: string
  rooms?: string
  beds?: string
  bathrooms?: number
  size?: string
  wifiUsername?: string
  wifiPassword?: string
  lockboxCode?: string
  accessType?: string
  host?: string
  gpsLink?: string
  generalGuidance?: string
  additionalNotes?: string
  kitchenAppliances?: string
  laundryAppliances?: string
  electricityMeter?: string
  waterMeter?: string
  gasMeter?: string
  buildingSecurity?: string
}

export class AIService {
  static async generatePropertyResponse(
    context: PropertyContext,
    userQuery: string,
    responseType: 'location' | 'access' | 'amenities' | 'general' | 'custom' = 'general'
  ): Promise<AIResponse> {
    try {
      console.log('Generating property response...')
      console.log('Environment check:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        apiKeyStart: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 10)
      })
      
      const client = initializeOpenAI()
      if (!client) {
        console.error('OpenAI client initialization failed')
        return {
          success: false,
          error: "OpenAI client not initialized. Please check your API key configuration."
        }
      }

      const systemPrompt = this.getSystemPrompt(responseType)
      const userPrompt = this.buildUserPrompt(context, userQuery, responseType)

      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      const response = completion.choices[0]?.message?.content

      if (!response) {
        return {
          success: false,
          error: "No response generated from AI"
        }
      }

      return {
        success: true,
        message: response
      }

    } catch (error) {
      console.error('AI Service Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private static getSystemPrompt(responseType: string): string {
    const basePrompt = `You are a helpful AI assistant for a property management company. You help human agents write professional, friendly, and informative responses to guests about property information.

Key guidelines:
- Be professional yet warm and welcoming
- Use clear, concise language
- Include relevant emojis when appropriate
- Be specific about property details
- Always prioritize guest safety and convenience
- If information is missing, acknowledge it politely
- Keep responses under 200 words unless more detail is specifically requested`

    switch (responseType) {
      case 'location':
        return basePrompt + `\n\nFocus on providing clear location and navigation information. Include landmarks, directions, and any helpful tips for finding the property.`
      
      case 'access':
        return basePrompt + `\n\nFocus on access information including check-in procedures, lockbox codes, key locations, and any access instructions. Be very clear about security procedures.`
      
      case 'amenities':
        return basePrompt + `\n\nFocus on property amenities, appliances, and facilities. Highlight what's available and how to use them.`
      
      case 'general':
        return basePrompt + `\n\nProvide a general overview of the property and answer the specific question asked.`
      
      default:
        return basePrompt
    }
  }

  private static buildUserPrompt(
    context: PropertyContext,
    userQuery: string,
    responseType: string
  ): string {
    const propertyInfo = `
Property Information:
- Name: ${context.propertyName}
- Address: ${context.address}
- District: ${context.district}
- Zone: ${context.zone || 'Not specified'}
- Rooms: ${context.rooms || 'Not specified'}
- Beds: ${context.beds || 'Not specified'}
- Bathrooms: ${context.bathrooms || 'Not specified'}
- Size: ${context.size || 'Not specified'}
- WiFi Network: ${context.wifiUsername || 'Not specified'}
- WiFi Password: ${context.wifiPassword || 'Not specified'}
- Lockbox Code: ${context.lockboxCode || 'Not specified'}
- Access Type: ${context.accessType || 'Not specified'}
- Host: ${context.host || 'Not specified'}
- GPS Link: ${context.gpsLink || 'Not specified'}
- General Guidance: ${context.generalGuidance || 'Not specified'}
- Additional Notes: ${context.additionalNotes || 'Not specified'}
- Kitchen Appliances: ${context.kitchenAppliances || 'Not specified'}
- Laundry Appliances: ${context.laundryAppliances || 'Not specified'}
- Electricity Meter: ${context.electricityMeter || 'Not specified'}
- Water Meter: ${context.waterMeter || 'Not specified'}
- Gas Meter: ${context.gasMeter || 'Not specified'}
- Building Security: ${context.buildingSecurity || 'Not specified'}
`

    return `Guest Query: "${userQuery}"

${propertyInfo}

Please generate a helpful response to the guest's query. Focus on the ${responseType} aspect of the property information. Make sure the response is professional, informative, and addresses their specific question.`
  }

  static async generateQuickResponse(
    context: PropertyContext,
    detailType: string,
    detailValue: string
  ): Promise<AIResponse> {
    const userQuery = `Tell me about the ${detailType}: ${detailValue}`
    return this.generatePropertyResponse(context, userQuery, 'general')
  }

  static async generateLocationResponse(context: PropertyContext): Promise<AIResponse> {
    const userQuery = "I need help finding the property and getting there"
    return this.generatePropertyResponse(context, userQuery, 'location')
  }

  static async generateAccessResponse(context: PropertyContext): Promise<AIResponse> {
    const userQuery = "How do I access the property and get inside?"
    return this.generatePropertyResponse(context, userQuery, 'access')
  }

  static async generateAmenitiesResponse(context: PropertyContext): Promise<AIResponse> {
    const userQuery = "What amenities and appliances are available in the property?"
    return this.generatePropertyResponse(context, userQuery, 'amenities')
  }
} 