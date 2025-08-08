'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Settings, RefreshCw, Eye, Calendar as CalendarIcon } from 'lucide-react'
import { ListingData } from '@/lib/listing-types'
import { ListingService } from '@/lib/listing-service'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import OccupancyStats from '@/components/OccupancyStats'

interface ICalUrlData {
  airbnb_ical_url?: string
  booking_ical_url?: string
  vrbo_ical_url?: string
  manual_ical_url?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps?: {
    platform?: string
    propertyId?: string
  }
}

export default function OccupancyPage() {
  const [properties, setProperties] = useState<ListingData[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [icalUrls, setIcalUrls] = useState<ICalUrlData>({})
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      loadICalUrls()
    }
  }, [selectedProperty])

  useEffect(() => {
    if (selectedProperty && Object.keys(icalUrls).length > 0) {
      loadEvents()
    }
  }, [selectedProperty, icalUrls])

  const loadProperties = async () => {
    try {
      const data = await ListingService.fetchAllListings()
      setProperties(data)
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0].property_id)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadICalUrls = async () => {
    if (!selectedProperty) return
    try {
      const urls = await ListingService.getListingICalUrls(parseInt(selectedProperty))
      setIcalUrls(urls)
    } catch (error) {
      console.error('Error loading iCal URLs:', error)
    }
  }

  const loadEvents = async () => {
    if (!selectedProperty) return
    try {
      // For now, we'll create mock events based on the iCal URLs
      // In a real implementation, you'd parse the actual iCal data
      const mockEvents: CalendarEvent[] = []
      
      if (icalUrls.airbnb_ical_url) {
        mockEvents.push({
          id: 'airbnb-1',
          title: 'Airbnb Booking',
          start: new Date().toISOString(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          backgroundColor: '#ff5a5f',
          borderColor: '#ff5a5f',
          textColor: '#ffffff',
          extendedProps: { platform: 'Airbnb', propertyId: selectedProperty }
        })
      }
      
      if (icalUrls.booking_ical_url) {
        mockEvents.push({
          id: 'booking-1',
          title: 'Booking.com Reservation',
          start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          backgroundColor: '#003580',
          borderColor: '#003580',
          textColor: '#ffffff',
          extendedProps: { platform: 'Booking.com', propertyId: selectedProperty }
        })
      }
      
      setEvents(mockEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      // In a real implementation, you'd sync all iCal URLs
      await loadEvents()
    } catch (error) {
      console.error('Error syncing iCal data:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateICalUrls = async (urls: ICalUrlData) => {
    try {
      const result = await ListingService.updateListingICalUrls(parseInt(selectedProperty), urls)
      if (result.success) {
        setIcalUrls(urls)
        await loadEvents()
      }
    } catch (error) {
      console.error('Error updating iCal URLs:', error)
    }
  }

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor || '#6B7280',
    borderColor: event.borderColor || '#6B7280',
    textColor: event.textColor || '#ffffff',
    extendedProps: event.extendedProps
  }))

  const selectedPropertyData = properties.find(p => p.property_id === selectedProperty)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Occupancy Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage iCal URLs and view occupancy for your properties
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Calendar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
              <div className="space-y-2">
                {properties.map((property) => (
                  <button
                    key={property.property_id}
                    onClick={() => setSelectedProperty(property.property_id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProperty === property.property_id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{property["Listing Name"] || `Property ${property.property_id}`}</div>
                    <div className="text-sm text-gray-500">{property["Address"]}</div>
                  </button>
                ))}
              </div>

              {selectedPropertyData && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">iCal URLs</h3>
                  <div className="space-y-3">
                    {/* Airbnb iCal URL */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🏠</span>
                          <span className="font-medium text-sm">Airbnb</span>
                        </div>
                        <button
                          onClick={() => {
                            const url = prompt('Enter Airbnb iCal URL:', icalUrls.airbnb_ical_url || '')
                            if (url !== null) {
                              handleUpdateICalUrls({ ...icalUrls, airbnb_ical_url: url })
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          {icalUrls.airbnb_ical_url ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {icalUrls.airbnb_ical_url ? (
                        <div className="text-xs text-gray-500 truncate">{icalUrls.airbnb_ical_url}</div>
                      ) : (
                        <div className="text-xs text-gray-400">No URL added</div>
                      )}
                    </div>

                    {/* Booking.com iCal URL */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🏨</span>
                          <span className="font-medium text-sm">Booking.com</span>
                        </div>
                        <button
                          onClick={() => {
                            const url = prompt('Enter Booking.com iCal URL:', icalUrls.booking_ical_url || '')
                            if (url !== null) {
                              handleUpdateICalUrls({ ...icalUrls, booking_ical_url: url })
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          {icalUrls.booking_ical_url ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {icalUrls.booking_ical_url ? (
                        <div className="text-xs text-gray-500 truncate">{icalUrls.booking_ical_url}</div>
                      ) : (
                        <div className="text-xs text-gray-400">No URL added</div>
                      )}
                    </div>

                    {/* VRBO iCal URL */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🏡</span>
                          <span className="font-medium text-sm">VRBO</span>
                        </div>
                        <button
                          onClick={() => {
                            const url = prompt('Enter VRBO iCal URL:', icalUrls.vrbo_ical_url || '')
                            if (url !== null) {
                              handleUpdateICalUrls({ ...icalUrls, vrbo_ical_url: url })
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          {icalUrls.vrbo_ical_url ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {icalUrls.vrbo_ical_url ? (
                        <div className="text-xs text-gray-500 truncate">{icalUrls.vrbo_ical_url}</div>
                      ) : (
                        <div className="text-xs text-gray-400">No URL added</div>
                      )}
                    </div>

                    {/* Manual iCal URL */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">📅</span>
                          <span className="font-medium text-sm">Manual</span>
                        </div>
                        <button
                          onClick={() => {
                            const url = prompt('Enter Manual iCal URL:', icalUrls.manual_ical_url || '')
                            if (url !== null) {
                              handleUpdateICalUrls({ ...icalUrls, manual_ical_url: url })
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          {icalUrls.manual_ical_url ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {icalUrls.manual_ical_url ? (
                        <div className="text-xs text-gray-500 truncate">{icalUrls.manual_ical_url}</div>
                      ) : (
                        <div className="text-xs text-gray-400">No URL added</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedPropertyData ? (
              <div className="space-y-6">
                {/* Property Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedPropertyData["Listing Name"] || `Property ${selectedPropertyData.property_id}`}
                  </h2>
                  <p className="text-gray-600">{selectedPropertyData["Address"]}</p>
                </div>

                {/* Occupancy Stats */}
                <OccupancyStats propertyId={selectedProperty} />

                {/* Calendar */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Occupancy Calendar</h3>
                  </div>
                  <div className="p-6">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                      }}
                      initialView="dayGridMonth"
                      editable={false}
                      selectable={true}
                      selectMirror={true}
                      dayMaxEvents={true}
                      weekends={true}
                      events={calendarEvents}
                      height="auto"
                      eventContent={(arg) => (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">{arg.event.title}</span>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Selected</h3>
                <p className="text-gray-500">Please select a property from the sidebar to view its occupancy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

           </div>
   )
 } 