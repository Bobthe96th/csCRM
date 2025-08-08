import { supabase } from './supabase'
import { ICalLink, CalendarEvent, PropertyOccupancy, ICalSyncResult } from './ical-types'

export class ICalService {
  static readonly PLATFORMS = {
    airbnb: { name: 'airbnb', displayName: 'Airbnb', color: '#FF5A5F', icon: '🏠' },
    booking: { name: 'booking', displayName: 'Booking.com', color: '#003580', icon: '🌐' },
    agoda: { name: 'agoda', displayName: 'Agoda', color: '#E53E3E', icon: '🏨' },
    tripadvisor: { name: 'tripadvisor', displayName: 'TripAdvisor', color: '#00AA6C', icon: '📝' },
    nomads: { name: 'nomads', displayName: 'Nomads', color: '#FF6B35', icon: '🌍' },
    hive: { name: 'hive', displayName: 'Hive', color: '#FFD700', icon: '🐝' },
    other: { name: 'other', displayName: 'Other', color: '#6B7280', icon: '📅' }
  }

  // Get all iCal links for a property
  static async getICalLinks(propertyId: string): Promise<ICalLink[]> {
    try {
      const { data, error } = await supabase
        .from('ical_links')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching iCal links:', error)
      return []
    }
  }

  // Add a new iCal link
  static async addICalLink(link: Omit<ICalLink, 'id' | 'created_at' | 'updated_at'>): Promise<ICalLink | null> {
    try {
      const { data, error } = await supabase
        .from('ical_links')
        .insert([link])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding iCal link:', error)
      return null
    }
  }

  // Update an iCal link
  static async updateICalLink(id: string, updates: Partial<ICalLink>): Promise<ICalLink | null> {
    try {
      const { data, error } = await supabase
        .from('ical_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating iCal link:', error)
      return null
    }
  }

  // Delete an iCal link
  static async deleteICalLink(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ical_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting iCal link:', error)
      return false
    }
  }

  // Get calendar events for a property
  static async getCalendarEvents(propertyId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('start_date', startDate)
      }
      if (endDate) {
        query = query.lte('end_date', endDate)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      return []
    }
  }

  // Get occupancy data for a property
  static async getPropertyOccupancy(propertyId: string, startDate: string, endDate: string): Promise<PropertyOccupancy[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_property_occupancy', {
          p_property_id: propertyId,
          p_start_date: startDate,
          p_end_date: endDate
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching property occupancy:', error)
      return []
    }
  }

  // Sync iCal data for a specific link
  static async syncICalData(icalLinkId: string): Promise<ICalSyncResult> {
    try {
      // First, get the iCal link details
      const { data: link, error: linkError } = await supabase
        .from('ical_links')
        .select('*')
        .eq('id', icalLinkId)
        .single()

      if (linkError || !link) {
        return {
          success: false,
          eventsAdded: 0,
          eventsUpdated: 0,
          eventsRemoved: 0,
          error: 'iCal link not found'
        }
      }

      // Fetch iCal data from the URL
      const response = await fetch(link.ical_url)
      if (!response.ok) {
        return {
          success: false,
          eventsAdded: 0,
          eventsUpdated: 0,
          eventsRemoved: 0,
          error: `Failed to fetch iCal data: ${response.statusText}`
        }
      }

      const icalData = await response.text()
      const events = this.parseICalData(icalData, link.property_id, link.platform_name)

      // Clear existing events for this iCal link
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('ical_link_id', icalLinkId)

      if (deleteError) {
        return {
          success: false,
          eventsAdded: 0,
          eventsUpdated: 0,
          eventsRemoved: 0,
          error: `Failed to clear existing events: ${deleteError.message}`
        }
      }

      // Insert new events
      if (events.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(events.map(event => ({
            ...event,
            ical_link_id: icalLinkId
          })))

        if (insertError) {
          return {
            success: false,
            eventsAdded: 0,
            eventsUpdated: 0,
            eventsRemoved: 0,
            error: `Failed to insert events: ${insertError.message}`
          }
        }
      }

      // Update last sync timestamp
      await this.updateICalLink(icalLinkId, { last_sync: new Date().toISOString() })

      return {
        success: true,
        eventsAdded: events.length,
        eventsUpdated: 0,
        eventsRemoved: 0
      }
    } catch (error) {
      console.error('Error syncing iCal data:', error)
      return {
        success: false,
        eventsAdded: 0,
        eventsUpdated: 0,
        eventsRemoved: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Parse iCal data into calendar events
  private static parseICalData(icalData: string, propertyId: string, platform: string): Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>[] {
    const events: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>[] = []
    const lines = icalData.split('\n')
    
    let currentEvent: any = {}
    let inEvent = false

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (trimmedLine === 'BEGIN:VEVENT') {
        inEvent = true
        currentEvent = {
          property_id: propertyId,
          platform: platform,
          status: 'confirmed'
        }
      } else if (trimmedLine === 'END:VEVENT') {
        if (inEvent && currentEvent.event_id) {
          events.push(currentEvent)
        }
        inEvent = false
        currentEvent = {}
      } else if (inEvent) {
        const [key, ...valueParts] = trimmedLine.split(':')
        const value = valueParts.join(':')
        
        switch (key) {
          case 'UID':
            currentEvent.event_id = value
            break
          case 'SUMMARY':
            currentEvent.title = value
            break
          case 'DTSTART':
          case 'DTSTART;VALUE=DATE':
            currentEvent.start_date = this.parseICalDate(value)
            break
          case 'DTEND':
          case 'DTEND;VALUE=DATE':
            currentEvent.end_date = this.parseICalDate(value)
            break
          case 'DESCRIPTION':
            currentEvent.notes = value
            break
          case 'ORGANIZER':
            if (value.includes('mailto:')) {
              currentEvent.guest_email = value.replace('mailto:', '')
            }
            break
        }
      }
    }

    return events.filter(event => event.start_date && event.end_date)
  }

  // Parse iCal date format
  private static parseICalDate(dateString: string): string {
    // Remove timezone info and parse
    const cleanDate = dateString.replace(/[A-Z]{3}$/, '').replace(/[A-Z]{4}$/, '')
    
    if (cleanDate.length === 8) {
      // Date only format (YYYYMMDD)
      const year = cleanDate.substring(0, 4)
      const month = cleanDate.substring(4, 6)
      const day = cleanDate.substring(6, 8)
      return `${year}-${month}-${day}T00:00:00Z`
    } else {
      // DateTime format (YYYYMMDDTHHMMSS)
      const year = cleanDate.substring(0, 4)
      const month = cleanDate.substring(4, 6)
      const day = cleanDate.substring(6, 8)
      const hour = cleanDate.substring(9, 11)
      const minute = cleanDate.substring(11, 13)
      const second = cleanDate.substring(13, 15)
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
    }
  }

  // Get occupancy statistics for a property
  static async getOccupancyStats(propertyId: string, startDate: string, endDate: string) {
    try {
      const occupancy = await this.getPropertyOccupancy(propertyId, startDate, endDate)
      
      const totalDays = occupancy.length
      const occupiedDays = occupancy.filter(day => day.is_occupied).length
      const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0
      
      const platforms: { [key: string]: number } = {}
      occupancy.forEach(day => {
        day.platforms.forEach(platform => {
          platforms[platform] = (platforms[platform] || 0) + 1
        })
      })

      const upcomingBookings = occupancy.filter(day => 
        day.is_occupied && new Date(day.date) > new Date()
      ).length

      return {
        totalDays,
        occupiedDays,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        upcomingBookings,
        platforms
      }
    } catch (error) {
      console.error('Error getting occupancy stats:', error)
      return {
        totalDays: 0,
        occupiedDays: 0,
        occupancyRate: 0,
        upcomingBookings: 0,
        platforms: {}
      }
    }
  }
} 