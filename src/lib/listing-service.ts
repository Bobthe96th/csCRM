import { supabase } from './supabase'
import { ListingData, EnrichedListingData, ListingToPropertyMapping } from './listing-types'
import { Property } from './property-types'

export class ListingService {
  // Fetch all listing data from the existing table
  static async fetchAllListings(): Promise<ListingData[]> {
    try {
      console.log('Fetching listings from Listingdata table...')
      
      // Simple fetch without count first to avoid potential issues
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .limit(100) // Add limit to prevent infinite loading

      if (error) {
        console.error('Supabase error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('Fetched listings:', data)
      console.log('Number of listings fetched:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error fetching listings:', error)
      return []
    }
  }

  // Fetch a single listing by ID
  static async fetchListingById(propertyId: number): Promise<ListingData | null> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .eq('property_id', propertyId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching listing:', error)
      return null
    }
  }

  // Enrich listing data with parsed information
  static enrichListingData(listing: ListingData): EnrichedListingData {
    const enriched: EnrichedListingData = { ...listing }

    // Parse GPS coordinates from Google Maps URL
    if (listing["Listing GPS coordinate"]) {
      const gpsUrl = listing["Listing GPS coordinate"]
      const coordsMatch = gpsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (coordsMatch) {
        enriched.latitude = parseFloat(coordsMatch[1])
        enriched.longitude = parseFloat(coordsMatch[2])
      }
    }

    // Parse address components
    if (listing["Address"]) {
      const address = listing["Address"]
      // Basic address parsing - you might want to use a more sophisticated parser
      const addressParts = address.split(',').map(part => part.trim())
      
      if (addressParts.length >= 3) {
        enriched.street_address = addressParts[0]
        enriched.city = addressParts[1]
        enriched.state = addressParts[2]
        enriched.zip_code = addressParts[3] || ''
        enriched.country = addressParts[4] || 'Egypt' // Default to Egypt based on your data
      }
    }

    // Parse numeric values
    if (listing["Number of Rooms"]) {
      enriched.rooms_count = parseInt(listing["Number of Rooms"]) || 0
    }
    if (listing["Number of Beds"]) {
      enriched.beds_count = parseInt(listing["Number of Beds"]) || 0
    }
    if (listing["Number Of Balconies"]) {
      enriched.balconies_count = parseInt(listing["Number Of Balconies"]) || 0
    }
    if (listing["Apartment Size In Squaremeters"]) {
      enriched.apartment_size = parseFloat(listing["Apartment Size In Squaremeters"]) || 0
    }

      // Set default values for property management fields
  enriched.property_type = 'Apartment' // Default type
  enriched.bedrooms = enriched.rooms_count || 2 // Use parsed rooms count
  enriched.bathrooms = listing["Number of Bathrooms"] || 1

  // Add iCal URLs to enriched data
  enriched.airbnb_ical_url = listing["airbnb_ical_url"]
  enriched.booking_ical_url = listing["booking_ical_url"]
  enriched.vrbo_ical_url = listing["vrbo_ical_url"]
  enriched.manual_ical_url = listing["manual_ical_url"]
    enriched.max_guests = enriched.beds_count ? enriched.beds_count * 2 : 4 // Estimate based on beds
    enriched.status = 'Active' // Default status

    return enriched
  }

  // Migrate a listing to the property management system with duplicate prevention
  static async migrateListingToProperty(listing: ListingData): Promise<{ success: boolean; property?: Property; message: string }> {
    try {
      const enriched = this.enrichListingData(listing)
      
      const propertyName = enriched["Listing Name"] || `Property ${enriched.property_id}`
      const propertyAddress = enriched["Address"] || ''
      
      // Check if property already exists
      const exists = await this.checkPropertyExists(propertyName, propertyAddress)
      if (exists) {
        return {
          success: false,
          message: `Property "${propertyName}" at "${propertyAddress}" already exists in the properties table`
        }
      }
      
      // Create property record
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert([{
          name: propertyName,
          address: propertyAddress,
          city: enriched.city || enriched["District where property is located"] || 'Cairo',
          state: enriched.state || 'Cairo',
          zip_code: enriched.zip_code || '00000',
          country: enriched.country || 'Egypt',
          property_type: enriched.property_type || 'Apartment',
          bedrooms: enriched.bedrooms || 2,
          bathrooms: enriched.bathrooms || 1,
          max_guests: enriched.max_guests || 4,
          status: enriched.status || 'Active'
        }])
        .select()
        .single()

      if (propertyError) {
        if (propertyError.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: `Property "${propertyName}" already exists (database constraint)`
          }
        }
        throw propertyError
      }

      // Add comprehensive property details based on the listing
      const defaultDetails = [
        // Check-in/Check-out info
        {
          property_id: property.id,
          detail_type: 'checkin_info',
          title: 'Check-in Time',
          value: '3:00 PM',
          priority: 1
        },
        {
          property_id: property.id,
          detail_type: 'checkout_info',
          title: 'Check-out Time',
          value: '11:00 AM',
          priority: 2
        },
        // Access information
        {
          property_id: property.id,
          detail_type: 'lockbox_code',
          title: 'Lockbox/Smartlock Code',
          value: enriched["Lockbox/Smartlock Code"] || 'Contact host for access',
          priority: 1
        },
        {
          property_id: property.id,
          detail_type: 'key_location',
          title: 'Key Location',
          value: enriched["Access type"] || 'Lockbox',
          priority: 2
        },
        // WiFi information
        {
          property_id: property.id,
          detail_type: 'wifi_info',
          title: 'WiFi Network',
          value: enriched["WIFI Username"] || `${enriched["Listing Name"]?.replace(/\s+/g, '')}_WiFi`,
          priority: 1
        },
        {
          property_id: property.id,
          detail_type: 'wifi_info',
          title: 'WiFi Password',
          value: enriched["WIFI Password"] || 'Contact host for password',
          priority: 2
        },
        // Parking information
        {
          property_id: property.id,
          detail_type: 'parking_info',
          title: 'Parking',
          value: 'Street parking available',
          priority: 1
        },
        // Property details
        {
          property_id: property.id,
          detail_type: 'checkin_info',
          title: 'Number of Rooms',
          value: enriched["Number of Rooms"] || '2',
          priority: 3
        },
        {
          property_id: property.id,
          detail_type: 'checkin_info',
          title: 'Number of Beds',
          value: enriched["Number of Beds"] || '2',
          priority: 4
        },
        {
          property_id: property.id,
          detail_type: 'checkin_info',
          title: 'Number of Bathrooms',
          value: enriched["Number of Bathrooms"]?.toString() || '1',
          priority: 5
        }
      ]

      // Add utilities information if available
      if (enriched["Electricity meter code"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'services',
          title: 'Electricity Meter Code',
          value: enriched["Electricity meter code"],
          priority: 1
        })
      }

      if (enriched["Water meter code"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'services',
          title: 'Water Meter Code',
          value: enriched["Water meter code"],
          priority: 2
        })
      }

      if (enriched["Gas meter code"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'services',
          title: 'Gas Meter Code',
          value: enriched["Gas meter code"],
          priority: 3
        })
      }

      // Add contact information
      if (enriched["Mobile Number of building security guard"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'emergency_contact',
          title: 'Building Security',
          value: enriched["Mobile Number of building security guard"],
          priority: 1
        })
      }

      if (enriched["Mobile Number of HOA fee collector"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'services',
          title: 'HOA Fee Collector',
          value: enriched["Mobile Number of HOA fee collector"],
          priority: 4
        })
      }

      // Add appliances information
      if (enriched["Kitchen Appliances"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'amenities',
          title: 'Kitchen Appliances',
          value: enriched["Kitchen Appliances"],
          priority: 1
        })
      }

      if (enriched["Laundry Appliances"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'amenities',
          title: 'Laundry Appliances',
          value: enriched["Laundry Appliances"],
          priority: 2
        })
      }

      // Add general guidance
      if (enriched["General guidance"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'house_rules',
          title: 'General Guidance',
          value: enriched["General guidance"],
          priority: 1
        })
      }

      // Add additional notes
      if (enriched["Additional notes"]) {
        defaultDetails.push({
          property_id: property.id,
          detail_type: 'local',
          title: 'Additional Notes',
          value: enriched["Additional notes"],
          priority: 1
        })
      }

      // Insert all details
      const { error: detailsError } = await supabase
        .from('property_details')
        .insert(defaultDetails)

      if (detailsError) {
        console.error('Error adding property details:', detailsError)
      }

      // Add property contacts if host information is available
      if (enriched["Host"]) {
        const { error: contactError } = await supabase
          .from('property_contacts')
          .insert([{
            property_id: property.id,
            contact_type: 'owner',
            name: enriched["Host"],
            phone: enriched["Mobile Number of building security guard"] || '',
            email: '',
            is_primary: true
          }])

        if (contactError) {
          console.error('Error adding property contact:', contactError)
        }
      }

      return {
        success: true,
        property,
        message: `Successfully migrated "${propertyName}" to properties table`
      }
    } catch (error) {
      console.error('Error migrating listing to property:', error)
      return {
        success: false,
        message: `Error migrating listing: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Migrate multiple listings at once with duplicate prevention
  static async migrateMultipleListings(listings: ListingData[]): Promise<{ 
    success: boolean; 
    properties: Property[]; 
    message: string; 
    migrated: number; 
    skipped: number; 
    errors: string[] 
  }> {
    const migratedProperties: Property[] = []
    const errors: string[] = []
    let migrated = 0
    let skipped = 0
    
    for (const listing of listings) {
      const result = await this.migrateListingToProperty(listing)
      
      if (result.success && result.property) {
        migratedProperties.push(result.property)
        migrated++
      } else {
        if (result.message.includes('already exists')) {
          skipped++
        } else {
          errors.push(result.message)
        }
      }
    }
    
    const message = `Migration complete: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`
    
    return {
      success: migrated > 0,
      properties: migratedProperties,
      message,
      migrated,
      skipped,
      errors
    }
  }

  // Search listings by name, district, or address
  static async searchListings(searchTerm: string): Promise<ListingData[]> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .or(`"Listing Name".ilike.%${searchTerm}%,"District where property is located".ilike.%${searchTerm}%,"Address".ilike.%${searchTerm}%`)
        .order('"Listing Name"')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching listings:', error)
      return []
    }
  }

  // Get listing statistics
  static async getListingStats(): Promise<{
    total: number
    districts: string[]
    districtCounts: Record<string, number>
    zones: string[]
    zoneCounts: Record<string, number>
  }> {
    try {
      const listings = await this.fetchAllListings()
      const districts = Array.from(new Set(listings.map(l => l["District where property is located"]).filter((d): d is string => Boolean(d))))
      const zones = Array.from(new Set(listings.map(l => l["Zone"]).filter((z): z is string => Boolean(z))))
      
      const districtCounts: Record<string, number> = {}
      const zoneCounts: Record<string, number> = {}
      
      districts.forEach(district => {
        districtCounts[district] = listings.filter(l => l["District where property is located"] === district).length
      })

      zones.forEach(zone => {
        zoneCounts[zone] = listings.filter(l => l["Zone"] === zone).length
      })

      return {
        total: listings.length,
        districts,
        districtCounts,
        zones,
        zoneCounts
      }
    } catch (error) {
      console.error('Error getting listing stats:', error)
      return {
        total: 0,
        districts: [],
        districtCounts: {},
        zones: [],
        zoneCounts: {}
      }
    }
  }

  // Get listings by district
  static async getListingsByDistrict(district: string): Promise<ListingData[]> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .eq('"District where property is located"', district)
        .order('"Listing Name"')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching listings by district:', error)
      return []
    }
  }

  // Get listings by zone
  static async getListingsByZone(zone: string): Promise<ListingData[]> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .eq('"Zone"', zone)
        .order('"Listing Name"')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching listings by zone:', error)
      return []
    }
  }

  // Test database connection and table access
  static async testConnection(): Promise<{ success: boolean; error?: string; tableExists?: boolean; count?: number }> {
    try {
      console.log('Testing Supabase connection...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Key (first 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10))
      
      // Simple test with limit to avoid blocking
      const { data, error } = await supabase
        .from('Listingdata')
        .select('property_id')
        .limit(1)

      if (error) {
        console.error('Connection test error:', error)
        return { success: false, error: error.message }
      }

      console.log('Connection test successful, data:', data)
      return { success: true, tableExists: true, count: data ? 1 : 0 }
    } catch (error) {
      console.error('Connection test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check for duplicate listings in the database
  static async checkDuplicateListings(): Promise<{ success: boolean; duplicates?: any[]; error?: string }> {
    try {
      console.log('Checking for duplicate listings...')
      
      const { data, error } = await supabase
        .from('duplicate_listings')
        .select('*')

      if (error) {
        console.error('Error checking duplicate listings:', error)
        return { success: false, error: error.message }
      }

      console.log('Duplicate listings found:', data)
      return { success: true, duplicates: data || [] }
    } catch (error) {
      console.error('Error checking duplicate listings:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check for duplicate properties in the database
  static async checkDuplicateProperties(): Promise<{ success: boolean; duplicates?: any[]; error?: string }> {
    try {
      console.log('Checking for duplicate properties...')
      
      const { data, error } = await supabase
        .from('duplicate_properties')
        .select('*')

      if (error) {
        console.error('Error checking duplicate properties:', error)
        return { success: false, error: error.message }
      }

      console.log('Duplicate properties found:', data)
      return { success: true, duplicates: data || [] }
    } catch (error) {
      console.error('Error checking duplicate properties:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check what tables exist in the database
  static async checkTables(): Promise<{ success: boolean; tables?: string[]; error?: string }> {
    try {
      console.log('Checking available tables...')
      
      // Try to get table information
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (error) {
        console.error('Error checking tables:', error)
        return { success: false, error: error.message }
      }

      const tables = data?.map(row => row.table_name) || []
      console.log('Available tables:', tables)
      return { success: true, tables }
    } catch (error) {
      console.error('Error checking tables:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check if a listing already exists by property_id
  static async checkListingExists(propertyId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select('property_id')
        .eq('property_id', propertyId)
        .limit(1)

      if (error) {
        console.error('Error checking listing existence:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking listing existence:', error)
      return false
    }
  }

  // Check if a property already exists by name and address
  static async checkPropertyExists(name: string, address: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .eq('name', name)
        .eq('address', address)
        .limit(1)

      if (error) {
        console.error('Error checking property existence:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking property existence:', error)
      return false
    }
  }

  // Insert sample data for testing with duplicate prevention
  static async insertSampleData(): Promise<{ success: boolean; message: string; inserted?: number; skipped?: number }> {
    try {
      console.log('Starting to insert sample data with duplicate prevention...')
      
      const sampleData = [
        {
          property_id: 9991, // Use high numbers to avoid conflicts
          "Listing Name": "Sample Apartment 1",
          "Address": "123 Main Street, Cairo, Egypt",
          "District where property is located": "Maadi",
          "Zone": "Zone 1",
          "Number of Rooms": "2",
          "Number of Beds": "2",
          "Number of Bathrooms": 1,
          "WIFI Username": "SampleWiFi1",
          "WIFI Password": "password123",
          "Lockbox/Smartlock Code": "1234",
          "Apartment Size In Squaremeters": "80"
        },
        {
          property_id: 9992,
          "Listing Name": "Sample Villa 1",
          "Address": "456 Garden Road, Alexandria, Egypt",
          "District where property is located": "Miami",
          "Zone": "Zone 2",
          "Number of Rooms": "3",
          "Number of Beds": "3",
          "Number of Bathrooms": 2,
          "WIFI Username": "SampleWiFi2",
          "WIFI Password": "password456",
          "Lockbox/Smartlock Code": "5678",
          "Apartment Size In Squaremeters": "120"
        }
      ]

      let inserted = 0
      let skipped = 0

      for (const item of sampleData) {
        const exists = await this.checkListingExists(item.property_id)
        
        if (exists) {
          console.log(`Skipping property_id ${item.property_id} - already exists`)
          skipped++
          continue
        }

        const { error } = await supabase
          .from('Listingdata')
          .insert([item])

        if (error) {
          console.error(`Error inserting property_id ${item.property_id}:`, error)
          if (error.code === '23505') { // PostgreSQL unique constraint violation
            console.log(`Property_id ${item.property_id} already exists (constraint violation)`)
            skipped++
          } else {
            console.error('Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            })
          }
        } else {
          console.log(`Successfully inserted property_id ${item.property_id}`)
          inserted++
        }
      }

      const message = `Inserted ${inserted} new records, skipped ${skipped} duplicates`
      console.log(message)
      
      return { 
        success: inserted > 0, 
        message,
        inserted,
        skipped
      }
    } catch (error) {
      console.error('Error inserting sample data:', error)
      return { 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // Get iCal URLs for a specific listing
  static async getListingICalUrls(propertyId: number): Promise<{
    airbnb_ical_url?: string
    booking_ical_url?: string
    vrbo_ical_url?: string
    manual_ical_url?: string
  }> {
    try {
      const listing = await this.fetchListingById(propertyId)
      if (!listing) {
        return {}
      }

      return {
        airbnb_ical_url: listing["airbnb_ical_url"],
        booking_ical_url: listing["booking_ical_url"],
        vrbo_ical_url: listing["vrbo_ical_url"],
        manual_ical_url: listing["manual_ical_url"]
      }
    } catch (error) {
      console.error('Error fetching iCal URLs:', error)
      return {}
    }
  }

  // Update iCal URLs for a specific listing
  static async updateListingICalUrls(
    propertyId: number,
    urls: {
      airbnb_ical_url?: string
      booking_ical_url?: string
      vrbo_ical_url?: string
      manual_ical_url?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('Listingdata')
        .update({
          airbnb_ical_url: urls.airbnb_ical_url,
          booking_ical_url: urls.booking_ical_url,
          vrbo_ical_url: urls.vrbo_ical_url,
          manual_ical_url: urls.manual_ical_url
        })
        .eq('property_id', propertyId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating iCal URLs:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Get all listings with iCal URLs
  static async getListingsWithICalUrls(): Promise<Array<{
    property_id: number
    "Listing Name"?: string
    "Address"?: string
    airbnb_ical_url?: string
    booking_ical_url?: string
    vrbo_ical_url?: string
    manual_ical_url?: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('Listingdata')
        .select(`
          property_id,
          "Listing Name",
          "Address",
          airbnb_ical_url,
          booking_ical_url,
          vrbo_ical_url,
          manual_ical_url
        `)
        .or('airbnb_ical_url.not.is.null,booking_ical_url.not.is.null,vrbo_ical_url.not.is.null,manual_ical_url.not.is.null')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching listings with iCal URLs:', error)
      return []
    }
  }
} 