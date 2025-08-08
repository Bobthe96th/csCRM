// Types for the existing Listingdata table - Updated to match actual schema
export interface ListingData {
  property_id: number
  "Listing Name"?: string
  "Listing GPS coordinate"?: string
  "Address"?: string
  "District where property is located"?: string
  "Zone"?: string
  "Group"?: string
  "Building"?: string
  "Floor"?: string
  "Unit Number"?: string
  "Access type"?: string
  "Lockbox/Smartlock Code"?: string
  "WIFI Username"?: string
  "WIFI Password"?: string
  "Number of Rooms"?: string
  "Number of Beds"?: string
  "Types of Beds inside"?: string
  "Number of Bathrooms"?: number
  "Number Of Balconies"?: string
  "Host"?: string
  "User ID"?: string
  "Apartment Size In Squaremeters"?: string
  "Is there a garden?"?: string
  "Electricity recharge type"?: string
  "Electricity meter code"?: string
  "Internet Service Provider"?: string
  "Serial number"?: string
  "Internet number"?: string
  "Water recharge type"?: string
  "Water meter code"?: string
  "Gas recharge type"?: string
  "Gas meter code"?: string
  "Home owner association/Compound fees"?: string
  "Mobile Number of HOA fee collector"?: string
  "Kitchen Appliances"?: string
  "Laundry Appliances"?: string
  "Living Room/Bedroom Appliances"?: string
  "Bathroom Appliances"?: string
  "Other Appliances"?: string
  "User Role"?: string
  "Additional notes"?: string
  "Video on how to reach the apartment"?: string
  "Video on how to throw the trash"?: string
  "Instructions on how to throw the trash"?: string
  "Room ID"?: string
  "Room ID_1"?: string
  "Room ID_2"?: string
  "Number of nearby dry clean strore"?: string
  "Mobile Number of building security guard"?: string
  "Number of Nearby Supermarket"?: string
  "CCTV Brand"?: string
  "CCTV type"?: string
  "Type of storage"?: string
  "General guidance"?: string
  "The toilet Bidet"?: string
  "Comment"?: string
  "Comment User"?: string
  "Comment Date"?: string
  "Timestamp"?: string
  "Last Updated"?: string
  "Created By"?: string
  "Updated By"?: string
  "Entry Status"?: string
  "IP"?: string
  "ID"?: string
  "Key"?: string
  // iCal URLs
  "airbnb_ical_url"?: string
  "booking_ical_url"?: string
  "vrbo_ical_url"?: string
  "manual_ical_url"?: string
}

// Extended interface for enriched listing data
export interface EnrichedListingData extends ListingData {
  // Additional fields that might be useful
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  status?: string
  // Parsed GPS coordinates
  latitude?: number
  longitude?: number
  // Parsed address components
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  // Parsed numeric values
  rooms_count?: number
  beds_count?: number
  balconies_count?: number
  apartment_size?: number
}

// Interface for mapping Listingdata to Property format
export interface ListingToPropertyMapping {
  listingId: number
  propertyId?: number
  isMigrated: boolean
  migrationDate?: string
} 