export interface ICalLink {
  id: string
  property_id: string
  platform_name: 'airbnb' | 'booking' | 'agoda' | 'tripadvisor' | 'nomads' | 'hive' | 'other'
  ical_url: string
  display_name?: string
  is_active: boolean
  last_sync?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarEvent {
  id: string
  ical_link_id?: string
  property_id: string
  event_id: string
  title?: string
  start_date: string
  end_date: string
  status: 'confirmed' | 'cancelled' | 'tentative'
  platform: string
  guest_name?: string
  guest_email?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface PropertyOccupancy {
  date: string
  is_occupied: boolean
  event_count: number
  platforms: string[]
}

export interface ICalPlatform {
  name: 'airbnb' | 'booking' | 'agoda' | 'tripadvisor' | 'nomads' | 'hive' | 'other'
  displayName: string
  color: string
  icon: string
}

export interface OccupancyStats {
  totalDays: number
  occupiedDays: number
  occupancyRate: number
  upcomingBookings: number
  platforms: { [key: string]: number }
}

export interface ICalSyncResult {
  success: boolean
  eventsAdded: number
  eventsUpdated: number
  eventsRemoved: number
  error?: string
} 