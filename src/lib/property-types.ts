// Property Management System TypeScript Interfaces

export interface Property {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  property_type: 'Apartment' | 'House' | 'Condo' | 'Villa' | 'Cabin' | 'Other'
  bedrooms: number
  bathrooms: number
  max_guests: number
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Booked'
  created_at: string
  updated_at: string
}

export interface PropertyDetail {
  id: number
  property_id: number
  detail_type: 
    | 'checkin_info' 
    | 'checkout_info' 
    | 'lockbox_code' 
    | 'wifi_info' 
    | 'parking_info' 
    | 'amenities' 
    | 'house_rules' 
    | 'emergency_contact'
    | 'cleaning_info' 
    | 'maintenance_contact' 
    | 'local_recommendations'
    | 'transportation' 
    | 'key_location' 
    | 'access_instructions'
  title: string
  value: string
  is_public: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface PropertyContact {
  id: number
  property_id: number
  contact_type: 'owner' | 'manager' | 'cleaner' | 'maintenance' | 'emergency' | 'concierge'
  name: string
  phone?: string
  email?: string
  notes?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface PropertyAmenity {
  id: number
  property_id: number
  amenity_name: string
  description?: string
  is_available: boolean
  icon?: string
  created_at: string
}

export interface PropertyImage {
  id: number
  property_id: number
  image_url: string
  image_type: 'main' | 'interior' | 'exterior' | 'amenity' | 'floor_plan'
  caption?: string
  is_primary: boolean
  created_at: string
}

// Extended interfaces with related data
export interface PropertyWithDetails extends Property {
  details: PropertyDetail[]
  contacts: PropertyContact[]
  amenities: PropertyAmenity[]
  images: PropertyImage[]
}

// Property detail type groups for UI organization
export const PROPERTY_DETAIL_GROUPS = {
  access: ['checkin_info', 'checkout_info', 'lockbox_code', 'key_location', 'access_instructions'],
  connectivity: ['wifi_info'],
  logistics: ['parking_info', 'transportation'],
  rules: ['house_rules'],
  safety: ['emergency_contact'],
  services: ['cleaning_info', 'maintenance_contact'],
  local: ['local_recommendations'],
  amenities: ['amenities']
} as const

export type PropertyDetailGroup = keyof typeof PROPERTY_DETAIL_GROUPS

// UI helper types
export interface PropertyDetailGroupData {
  group: PropertyDetailGroup
  title: string
  icon: string
  details: PropertyDetail[]
}

export const PROPERTY_DETAIL_GROUP_CONFIG: Record<PropertyDetailGroup, { title: string; icon: string }> = {
  access: { title: 'Access Information', icon: '🔑' },
  connectivity: { title: 'WiFi & Connectivity', icon: '📶' },
  logistics: { title: 'Parking & Transportation', icon: '🚗' },
  rules: { title: 'House Rules', icon: '📋' },
  safety: { title: 'Emergency Contacts', icon: '🚨' },
  services: { title: 'Services & Maintenance', icon: '🔧' },
  local: { title: 'Local Recommendations', icon: '🗺️' },
  amenities: { title: 'Amenities', icon: '🏠' }
} 