import { AIService, PropertyContext, AIResponse } from './ai-service'
import { ListingData } from './listing-types'
import { GuestService, GuestVerificationRequest, GuestVerificationResult, GuestContext } from './guest-service'

export interface AutoResponseResult {
  canAnswer: boolean
  response?: string
  escalationMessage?: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
  requiresVerification?: boolean
  verificationPrompt?: string
}

export interface QuestionAnalysis {
  isPropertyRelated: boolean
  isAccessRelated: boolean
  isLocationRelated: boolean
  isAmenitiesRelated: boolean
  isGeneralInfo: boolean
  isTechnicalIssue: boolean
  isBookingRelated: boolean
  isPaymentRelated: boolean
  isComplaintRelated: boolean
  requiresHumanIntervention: boolean
}

export class AIAutoResponseService {
  // Keywords that indicate the AI can likely answer the question
  private static readonly AI_CAPABLE_KEYWORDS = [
    // Property information
    'property', 'apartment', 'house', 'room', 'bed', 'bathroom', 'size', 'address', 'location',
    'wifi', 'internet', 'password', 'lockbox', 'code', 'key', 'access', 'check-in', 'checkout',
    'amenities', 'appliances', 'kitchen', 'laundry', 'parking', 'elevator', 'security',
    'district', 'zone', 'neighborhood', 'area', 'nearby', 'transportation', 'metro', 'bus',
    'electricity', 'water', 'gas', 'meter', 'utilities', 'host', 'owner',
    
    // Common guest questions
    'how to find', 'where is', 'how do i get', 'directions', 'map', 'gps',
    'what time', 'when can', 'check-in time', 'checkout time',
    'what is included', 'what amenities', 'what appliances',
    'how to use', 'instructions', 'manual', 'guide',
    'emergency', 'contact', 'phone', 'number',
    
    // General property info
    'tell me about', 'information about', 'details about', 'what about',
    'is there', 'does it have', 'can i', 'is it possible'
  ]

  // Keywords that indicate human intervention is needed
  private static readonly HUMAN_INTERVENTION_KEYWORDS = [
    // Booking and payments
    'book', 'booking', 'reserve', 'reservation', 'payment', 'pay', 'money', 'price', 'cost', 'fee',
    'refund', 'cancel', 'cancellation', 'modify', 'change', 'extend', 'early', 'late',
    
    // Complaints and issues
    'problem', 'issue', 'broken', 'not working', 'damaged', 'dirty', 'clean', 'maintenance',
    'complaint', 'unhappy', 'disappointed', 'bad', 'terrible', 'awful', 'horrible',
    'fix', 'repair', 'replace', 'compensation', 'refund',
    
    // Complex requests
    'special', 'request', 'arrangement', 'exception', 'favor', 'help',
    'urgent', 'emergency', 'immediate', 'asap', 'now',
    
    // Technical support
    'technical', 'support', 'help desk', 'customer service', 'representative',
    'speak to', 'talk to', 'human', 'person', 'agent',
    
    // Legal and policy
    'policy', 'terms', 'conditions', 'legal', 'law', 'rights', 'contract',
    'insurance', 'liability', 'damage', 'security deposit'
  ]

  // Keywords that indicate verification information
  private static readonly VERIFICATION_KEYWORDS = [
    'my name is', 'i am', 'i\'m', 'this is', 'phone number', 'mobile', 'cell',
    'gin', 'code', 'identification', 'verify', 'confirm', 'check in', 'reservation',
    'booking', 'guest', 'staying', 'arrival', 'check-in', 'checkin'
  ]

  static analyzeQuestion(question: string): QuestionAnalysis {
    const lowerQuestion = question.toLowerCase()
    
    return {
      isPropertyRelated: this.hasKeywords(lowerQuestion, ['property', 'apartment', 'house', 'room', 'bed', 'bathroom']),
      isAccessRelated: this.hasKeywords(lowerQuestion, ['access', 'key', 'lockbox', 'code', 'check-in', 'enter', 'door']),
      isLocationRelated: this.hasKeywords(lowerQuestion, ['location', 'address', 'where', 'find', 'directions', 'map', 'gps']),
      isAmenitiesRelated: this.hasKeywords(lowerQuestion, ['amenities', 'appliances', 'wifi', 'parking', 'elevator', 'kitchen']),
      isGeneralInfo: this.hasKeywords(lowerQuestion, ['what', 'how', 'tell me', 'information', 'details']),
      isTechnicalIssue: this.hasKeywords(lowerQuestion, ['problem', 'issue', 'broken', 'not working', 'fix', 'repair']),
      isBookingRelated: this.hasKeywords(lowerQuestion, ['book', 'booking', 'reserve', 'reservation', 'payment']),
      isPaymentRelated: this.hasKeywords(lowerQuestion, ['payment', 'pay', 'money', 'price', 'cost', 'fee', 'refund']),
      isComplaintRelated: this.hasKeywords(lowerQuestion, ['complaint', 'unhappy', 'disappointed', 'bad', 'terrible']),
      requiresHumanIntervention: this.hasKeywords(lowerQuestion, this.HUMAN_INTERVENTION_KEYWORDS)
    }
  }

  static async canAnswerQuestion(
    question: string,
    availableProperties: ListingData[]
  ): Promise<AutoResponseResult> {
    const analysis = this.analyzeQuestion(question)
    const lowerQuestion = question.toLowerCase()

    // Check if question requires human intervention
    if (analysis.requiresHumanIntervention) {
      return {
        canAnswer: false,
        escalationMessage: this.generateEscalationMessage(question, analysis),
        confidence: 'high',
        reason: 'Question requires human intervention (complaints, payments, technical issues, etc.)'
      }
    }

    // Check if question is property-related and we have property data
    if (analysis.isPropertyRelated && availableProperties.length > 0) {
      // Check if we have relevant information for the specific question
      const hasRelevantInfo = this.hasRelevantPropertyInfo(question, availableProperties)
      
      if (hasRelevantInfo) {
        return {
          canAnswer: true,
          confidence: 'high',
          reason: 'Question is property-related and relevant information is available'
        }
      } else {
        return {
          canAnswer: false,
          escalationMessage: this.generateEscalationMessage(question, analysis),
          confidence: 'medium',
          reason: 'Question is property-related but specific information is not available'
        }
      }
    }

    // Check if question is general but within AI capabilities
    if (analysis.isGeneralInfo && this.hasKeywords(lowerQuestion, this.AI_CAPABLE_KEYWORDS)) {
      return {
        canAnswer: true,
        confidence: 'medium',
        reason: 'General question within AI capabilities'
      }
    }

    // Default to escalation
    return {
      canAnswer: false,
      escalationMessage: this.generateEscalationMessage(question, analysis),
      confidence: 'low',
      reason: 'Question type not recognized or outside AI capabilities'
    }
  }

  static async generateAutoResponse(
    question: string,
    properties: ListingData[]
  ): Promise<AIResponse> {
    // Simple verification: only check for name
    const nameInfo = this.extractNameFromQuestion(question)
    
    if (nameInfo) {
      // Guest provided their name, ask for property info
      return {
        success: true,
        message: `Hello ${nameInfo}! 👋 I can help you with your stay. Please tell me your property number or the location/area where you're staying so I can provide you with the right information.`
      }
    }

    // Check if this is a property location/ID question
    const propertyInfo = this.extractPropertyInfo(question)
    if (propertyInfo) {
      // Find the relevant property
      const relevantProperty = this.findPropertyByInfo(propertyInfo, properties)
      
      if (relevantProperty) {
        // Convert property to context and generate response
        const context = this.convertListingToContext(relevantProperty)
        const analysis = this.analyzeQuestion(question)
        
        // Determine response type based on question analysis
        let responseType: 'location' | 'access' | 'amenities' | 'general' = 'general'
        
        if (analysis.isLocationRelated) responseType = 'location'
        else if (analysis.isAccessRelated) responseType = 'access'
        else if (analysis.isAmenitiesRelated) responseType = 'amenities'

        return await AIService.generatePropertyResponse(context, question, responseType)
      } else {
        return {
          success: true,
          message: "I couldn't find a property matching that information. Could you please provide the property number or be more specific about the location?"
        }
      }
    }

    // Check if this is a general question that requires property context
    const analysis = this.analyzeQuestion(question)
    if (analysis.isPropertyRelated || analysis.isAccessRelated || analysis.isLocationRelated || analysis.isAmenitiesRelated) {
      return {
        success: true,
        message: "I'd be happy to help you with property information! First, could you please tell me your name and then your property number or location?"
      }
    }

    // Check if question requires human intervention
    if (analysis.requiresHumanIntervention) {
      return {
        success: true,
        message: this.generateEscalationMessage(question, analysis)
      }
    }

    // Default response for other questions
    return {
      success: true,
      message: "Hello! I'm here to help you with your stay. Could you please tell me your name first, and then I can assist you with property information, access details, and any other questions you may have."
    }
  }

  private static hasKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private static extractNameFromQuestion(message: string): string | null {
    // Extract name (look for patterns like "my name is", "i am", etc.)
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i am ([a-zA-Z\s]+)/i,
      /i'm ([a-zA-Z\s]+)/i,
      /this is ([a-zA-Z\s]+)/i,
      /name: ([a-zA-Z\s]+)/i,
      /i'm ([a-zA-Z\s]+)/i,
      /call me ([a-zA-Z\s]+)/i
    ]

    for (const pattern of namePatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  }

  private static extractPropertyInfo(message: string): string | null {
    const lowerMessage = message.toLowerCase()
    
    // Look for property numbers (e.g., "property 4", "property ID 4", "property number 4")
    const propertyNumberPatterns = [
      /property\s+(?:id\s+)?(?:number\s+)?(\d+)/i,
      /property\s+(\d+)/i,
      /property\s+id\s+(\d+)/i
    ]

    for (const pattern of propertyNumberPatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        return `property_${match[1]}`
      }
    }

    // Look for location/district mentions
    const locationKeywords = ['maadi', 'zamalek', 'downtown', 'heliopolis', 'nasr city', '6th october', 'new cairo']
    for (const location of locationKeywords) {
      if (lowerMessage.includes(location)) {
        return location
      }
    }

    // Look for specific addresses or areas
    if (lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('area')) {
      // Extract the location part after these keywords
      const locationPatterns = [
        /address[:\s]+([^.!?]+)/i,
        /location[:\s]+([^.!?]+)/i,
        /area[:\s]+([^.!?]+)/i
      ]
      
      for (const pattern of locationPatterns) {
        const match = message.match(pattern)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
    }

    return null
  }

  private static findPropertyByInfo(propertyInfo: string, properties: ListingData[]): ListingData | null {
    if (properties.length === 0) return null

    // If it's a property number
    if (propertyInfo.startsWith('property_')) {
      const propertyId = propertyInfo.replace('property_', '')
      return properties.find(p => p.property_id === propertyId) || null
    }

    // If it's a location/district
    const lowerPropertyInfo = propertyInfo.toLowerCase()
    
    // First try exact matches
    for (const property of properties) {
      const district = property["District where property is located"]?.toLowerCase()
      const zone = property["Zone"]?.toLowerCase()
      const address = property["Address"]?.toLowerCase()
      
      if (district?.includes(lowerPropertyInfo) || 
          zone?.includes(lowerPropertyInfo) || 
          address?.includes(lowerPropertyInfo)) {
        return property
      }
    }

    // If no exact match, try partial matches
    for (const property of properties) {
      const district = property["District where property is located"]?.toLowerCase()
      const zone = property["Zone"]?.toLowerCase()
      const address = property["Address"]?.toLowerCase()
      
      if (district && lowerPropertyInfo.includes(district) ||
          zone && lowerPropertyInfo.includes(zone) ||
          address && lowerPropertyInfo.includes(address)) {
        return property
      }
    }

    return null
  }

  private static hasRelevantPropertyInfo(question: string, properties: ListingData[]): boolean {
    const lowerQuestion = question.toLowerCase()
    
    return properties.some(property => {
      // Check if question mentions specific property details we have
      const propertyFields = [
        property["Listing Name"],
        property["Address"],
        property["District where property is located"],
        property["Zone"],
        property["Number of Rooms"],
        property["Number of Beds"],
        property["Number of Bathrooms"],
        property["Apartment Size In Squaremeters"],
        property["WIFI Username"],
        property["WIFI Password"],
        property["Lockbox/Smartlock Code"],
        property["Access type"],
        property["Host"],
        property["Listing GPS coordinate"],
        property["General guidance"],
        property["Additional notes"],
        property["Kitchen Appliances"],
        property["Laundry Appliances"],
        property["Electricity meter code"],
        property["Water meter code"],
        property["Gas meter code"],
        property["Mobile Number of building security guard"]
      ].filter(field => field && typeof field === 'string')

      return propertyFields.some(field => 
        field && lowerQuestion.includes(field.toLowerCase())
      )
    })
  }

  private static findMostRelevantProperty(question: string, properties: ListingData[]): ListingData | null {
    if (properties.length === 0) return null
    if (properties.length === 1) return properties[0]

    // Simple relevance scoring - can be enhanced
    const lowerQuestion = question.toLowerCase()
    let bestMatch = properties[0]
    let bestScore = 0

    for (const property of properties) {
      let score = 0
      
      // Check for property name match
      if (property["Listing Name"] && typeof property["Listing Name"] === 'string' && lowerQuestion.includes(property["Listing Name"].toLowerCase())) {
        score += 10
      }
      
      // Check for address match
      if (property["Address"] && typeof property["Address"] === 'string' && lowerQuestion.includes(property["Address"].toLowerCase())) {
        score += 8
      }
      
      // Check for district match
      if (property["District where property is located"] && typeof property["District where property is located"] === 'string' && lowerQuestion.includes(property["District where property is located"].toLowerCase())) {
        score += 6
      }
      
      // Check for zone match
      if (property["Zone"] && typeof property["Zone"] === 'string' && lowerQuestion.includes(property["Zone"].toLowerCase())) {
        score += 4
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = property
      }
    }

    return bestMatch
  }

  private static convertListingToContext(listing: ListingData): PropertyContext {
    return {
      propertyName: (listing["Listing Name"] && typeof listing["Listing Name"] === 'string') ? listing["Listing Name"] : `Property ${listing.property_id}`,
      address: (listing["Address"] && typeof listing["Address"] === 'string') ? listing["Address"] : 'Address not available',
      district: (listing["District where property is located"] && typeof listing["District where property is located"] === 'string') ? listing["District where property is located"] : 'Unknown District',
      zone: (listing["Zone"] && typeof listing["Zone"] === 'string') ? listing["Zone"] : undefined,
      rooms: (listing["Number of Rooms"] && typeof listing["Number of Rooms"] === 'string') ? listing["Number of Rooms"] : undefined,
      beds: (listing["Number of Beds"] && typeof listing["Number of Beds"] === 'string') ? listing["Number of Beds"] : undefined,
      bathrooms: (listing["Number of Bathrooms"] && typeof listing["Number of Bathrooms"] === 'number') ? listing["Number of Bathrooms"] : undefined,
      size: (listing["Apartment Size In Squaremeters"] && typeof listing["Apartment Size In Squaremeters"] === 'string') ? listing["Apartment Size In Squaremeters"] : undefined,
      wifiUsername: (listing["WIFI Username"] && typeof listing["WIFI Username"] === 'string') ? listing["WIFI Username"] : undefined,
      wifiPassword: (listing["WIFI Password"] && typeof listing["WIFI Password"] === 'string') ? listing["WIFI Password"] : undefined,
      lockboxCode: (listing["Lockbox/Smartlock Code"] && typeof listing["Lockbox/Smartlock Code"] === 'string') ? listing["Lockbox/Smartlock Code"] : undefined,
      accessType: (listing["Access type"] && typeof listing["Access type"] === 'string') ? listing["Access type"] : undefined,
      host: (listing["Host"] && typeof listing["Host"] === 'string') ? listing["Host"] : undefined,
      gpsLink: (listing["Listing GPS coordinate"] && typeof listing["Listing GPS coordinate"] === 'string') ? listing["Listing GPS coordinate"] : undefined,
      generalGuidance: (listing["General guidance"] && typeof listing["General guidance"] === 'string') ? listing["General guidance"] : undefined,
      additionalNotes: (listing["Additional notes"] && typeof listing["Additional notes"] === 'string') ? listing["Additional notes"] : undefined,
      kitchenAppliances: (listing["Kitchen Appliances"] && typeof listing["Kitchen Appliances"] === 'string') ? listing["Kitchen Appliances"] : undefined,
      laundryAppliances: (listing["Laundry Appliances"] && typeof listing["Laundry Appliances"] === 'string') ? listing["Laundry Appliances"] : undefined,
      electricityMeter: (listing["Electricity meter code"] && typeof listing["Electricity meter code"] === 'string') ? listing["Electricity meter code"] : undefined,
      waterMeter: (listing["Water meter code"] && typeof listing["Water meter code"] === 'string') ? listing["Water meter code"] : undefined,
      gasMeter: (listing["Gas meter code"] && typeof listing["Gas meter code"] === 'string') ? listing["Gas meter code"] : undefined,
      buildingSecurity: (listing["Mobile Number of building security guard"] && typeof listing["Mobile Number of building security guard"] === 'string') ? listing["Mobile Number of building security guard"] : undefined
    }
  }

  private static generateEscalationMessage(question: string, analysis: QuestionAnalysis): string {
    if (analysis.isComplaintRelated) {
      return `I understand you have a concern about your stay. I'm escalating this to our customer service team who will be able to assist you better. Someone will be in touch with you shortly.`
    }
    
    if (analysis.isPaymentRelated) {
      return `I'm transferring you to our billing department who can help with payment-related questions. They'll be with you in a few minutes.`
    }
    
    if (analysis.isTechnicalIssue) {
      return `I'm connecting you with our technical support team who can help resolve this issue. They'll be available shortly.`
    }
    
    if (analysis.isBookingRelated) {
      return `I'm transferring you to our reservations team who can assist with booking-related questions. They'll be with you shortly.`
    }

    return this.getDefaultEscalationMessage()
  }

  private static getDefaultEscalationMessage(): string {
    return `I'm connecting you with a human agent who will be able to assist you better. They'll be chatting with you in a few minutes.`
  }
} 