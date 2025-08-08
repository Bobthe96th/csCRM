'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import { ListingService } from '@/lib/listing-service'

interface OccupancyStatsProps {
  propertyId: string
}

interface OccupancyStatsData {
  totalDays: number
  occupiedDays: number
  occupancyRate: number
  upcomingBookings: number
  airbnb_ical_url?: string
  booking_ical_url?: string
  vrbo_ical_url?: string
  manual_ical_url?: string
}

export default function OccupancyStats({ propertyId }: OccupancyStatsProps) {
  const [stats, setStats] = useState<OccupancyStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (propertyId) {
      loadStats()
    }
  }, [propertyId])

  const loadStats = async () => {
    try {
      // For now, we'll create mock stats based on the iCal URLs
      // In a real implementation, you'd calculate actual occupancy from iCal data
      const urls = await ListingService.getListingICalUrls(parseInt(propertyId))
      const hasICalUrls = urls.airbnb_ical_url || urls.booking_ical_url || urls.vrbo_ical_url || urls.manual_ical_url
      
      const mockStats: OccupancyStatsData = {
        totalDays: 30,
        occupiedDays: hasICalUrls ? 15 : 0,
        occupancyRate: hasICalUrls ? 50 : 0,
        upcomingBookings: hasICalUrls ? 3 : 0,
        airbnb_ical_url: urls.airbnb_ical_url,
        booking_ical_url: urls.booking_ical_url,
        vrbo_ical_url: urls.vrbo_ical_url,
        manual_ical_url: urls.manual_ical_url
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Error loading occupancy stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No occupancy data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Days',
      value: stats.totalDays,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Occupied Days',
      value: stats.occupiedDays,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Occupancy Statistics (Next 30 Days)</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.color} bg-opacity-10 mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Platform Breakdown */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-4">iCal URLs Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Airbnb', icon: '🏠', hasUrl: !!stats.airbnb_ical_url },
              { name: 'Booking.com', icon: '🏨', hasUrl: !!stats.booking_ical_url },
              { name: 'VRBO', icon: '🏡', hasUrl: !!stats.vrbo_ical_url },
              { name: 'Manual', icon: '📅', hasUrl: !!stats.manual_ical_url }
            ].map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{platform.icon}</span>
                  <span className="font-medium text-sm">{platform.name}</span>
                </div>
                <span className={`text-sm font-medium ${platform.hasUrl ? 'text-green-600' : 'text-gray-400'}`}>
                  {platform.hasUrl ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 