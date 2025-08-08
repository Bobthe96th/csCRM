import { supabase } from './supabase'
import { GuestID, GuestVerificationRequest, GuestVerificationResult, GuestContext } from './guest-types'

export class GuestService {
  static async verifyGuest(request: GuestVerificationRequest): Promise<GuestVerificationResult> {
    try {
      let guest: GuestID | null = null
      let verificationMethod: 'phone' | 'name' | 'gin' | 'email' | 'none' = 'none'

      console.log('Verifying guest with request:', request)

      // Try to find guest by phone number first (most reliable)
      if (request.phoneNumber) {
        console.log('Attempting phone verification with:', request.phoneNumber)
        const { data, error } = await supabase
          .from('guest_ID')
          .select('*')
          .eq('Phone number', request.phoneNumber)
          .single()

        console.log('Phone verification result:', { data, error })
        if (!error && data) {
          guest = data
          verificationMethod = 'phone'
        }
      }

      // If not found by phone, try by name
      if (!guest && request.name) {
        const { data, error } = await supabase
          .from('guest_ID')
          .select('*')
          .ilike('Name', `%${request.name}%`)
          .single()

        if (!error && data) {
          guest = data
          verificationMethod = 'name'
        }
      }

      // If not found by name, try by GIN code (KYC field)
      if (!guest && request.ginCode) {
        const { data, error } = await supabase
          .from('guest_ID')
          .select('*')
          .eq('KYC', request.ginCode)
          .single()

        if (!error && data) {
          guest = data
          verificationMethod = 'gin'
        }
      }

      // If not found by GIN, try by email
      if (!guest && request.email) {
        const { data, error } = await supabase
          .from('guest_ID')
          .select('*')
          .eq('Email', request.email)
          .single()

        if (!error && data) {
          guest = data
          verificationMethod = 'email'
        }
      }

      if (guest) {
        return {
          success: true,
          guest,
          message: `Welcome back, ${guest["Name"] || 'Guest'}! I've verified your identity.`,
          verificationMethod,
          isVerified: true
        }
      } else {
        return {
          success: false,
          message: "I couldn't find your information in our system. Please provide your name, phone number, or GIN code so I can assist you better.",
          verificationMethod: 'none',
          isVerified: false
        }
      }
    } catch (error) {
      console.error('Guest verification error:', error)
      return {
        success: false,
        message: "Sorry, I encountered an error while verifying your information. Please try again.",
        verificationMethod: 'none',
        isVerified: false
      }
    }
  }

  static async getGuestByPropertyId(propertyId: string): Promise<GuestID[]> {
    try {
      const { data, error } = await supabase
        .from('guest_ID')
        .select('*')
        .eq('Property ID', propertyId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching guests by property ID:', error)
      return []
    }
  }

  static async getGuestWithPropertyInfo(guestId: string): Promise<{ guest: GuestID | null, property: any | null }> {
    try {
      console.log('Getting guest with property info for ID:', guestId)
      
      // First get the guest
      const { data: guest, error: guestError } = await supabase
        .from('guest_ID')
        .select('*')
        .eq('ID', guestId)
        .single()

      console.log('Guest fetch result:', { guest, guestError })

      if (guestError || !guest) {
        return { guest: null, property: null }
      }

      // Then get the property from Listingdata using the Property ID
      console.log('Looking for property with ID:', guest['Property ID'])
      const { data: property, error: propertyError } = await supabase
        .from('Listingdata')
        .select('*')
        .eq('property_id', guest['Property ID'])
        .single()

      console.log('Property fetch result:', { property, propertyError })

      if (propertyError) {
        console.error('Error fetching property:', propertyError)
        return { guest, property: null }
      }

      return { guest, property }
    } catch (error) {
      console.error('Error fetching guest with property info:', error)
      return { guest: null, property: null }
    }
  }

  static async verifyGuestWithProperty(request: GuestVerificationRequest): Promise<GuestVerificationResult> {
    try {
      // First verify the guest
      const verificationResult = await this.verifyGuest(request)
      
      if (!verificationResult.isVerified || !verificationResult.guest) {
        return verificationResult
      }

      // Now get the property information for this guest
      const { guest, property } = await this.getGuestWithPropertyInfo(verificationResult.guest['ID'] || '')
      
      if (!property) {
        return {
          ...verificationResult,
          message: `Welcome back, ${verificationResult.guest['Name'] || 'Guest'}! I've verified your identity, but I couldn't find your property information. Please contact support.`
        }
      }

      // Return enhanced verification result with property info
      return {
        ...verificationResult,
        guest: {
          ...verificationResult.guest,
          propertyInfo: property
        },
        message: `Welcome back, ${verificationResult.guest['Name'] || 'Guest'}! I've verified your identity and found your property information.`
      }
    } catch (error) {
      console.error('Guest verification with property error:', error)
      return {
        success: false,
        message: "Sorry, I encountered an error while verifying your information. Please try again.",
        verificationMethod: 'none',
        isVerified: false
      }
    }
  }

  static async getGuestById(guestId: string): Promise<GuestID | null> {
    try {
      const { data, error } = await supabase
        .from('guest_ID')
        .select('*')
        .eq('ID', guestId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching guest by ID:', error)
      return null
    }
  }

  static convertGuestToContext(guest: GuestID): GuestContext {
    const propertyInfo = (guest as any).propertyInfo
    
    return {
      guestId: guest["ID"] || '',
      name: guest["Name"] || 'Unknown Guest',
      phoneNumber: guest["Phone number"] || '',
      propertyId: guest["Property ID"] || '',
      checkInDate: guest["Date of arrival (check in)"] || '',
      checkOutDate: guest["Checkout date"] || '',
      email: guest["Email"],
      nationality: guest["Nationality of main guest"],
      reservationPlatform: guest["Reservation Platform"],
      reasonOfVisit: guest["Reason of visit"],
      propertyInfo: propertyInfo
    }
  }

  static generateVerificationPrompt(): string {
    return `Hello! I'm here to help you with your stay. To provide you with the best assistance, I need to verify your identity.

Please provide one of the following:
• Your phone number
• Your full name
• Your GIN code (from your booking confirmation)
• Your email address

Once I verify your information, I'll be able to help you with property details, access information, and any other questions you may have.`
  }

  static generateWelcomeMessage(guest: GuestID): string {
    const name = guest["Name"] || 'Guest'
    const propertyId = guest["Property ID"] || 'your property'
    const checkInDate = guest["Date of arrival (check in)"] || 'your stay'
    const propertyName = (guest as any).propertyInfo?.["Listing Name"] || propertyId
    
    return `Welcome back, ${name}! 👋

I can see you're staying at ${propertyName} (Property ID: ${propertyId}) with check-in on ${checkInDate}. I'm here to help you with:
• Property information and access details
• WiFi and amenities information
• Location and directions
• Any other questions about your stay

What can I help you with today?`
  }
} 