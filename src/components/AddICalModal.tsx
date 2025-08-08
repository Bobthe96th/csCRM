'use client'

import { useState } from 'react'
import { X, Plus, Globe, Calendar } from 'lucide-react'
import { ICalService } from '@/lib/ical-service'
import { ICalLink } from '@/lib/ical-types'

interface AddICalModalProps {
  propertyId: string
  propertyName: string
  onClose: () => void
  onAdd: (linkData: Omit<ICalLink, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export default function AddICalModal({ propertyId, propertyName, onClose, onAdd }: AddICalModalProps) {
  const [platform, setPlatform] = useState<'airbnb' | 'booking' | 'agoda' | 'tripadvisor' | 'nomads' | 'hive' | 'other'>('airbnb')
  const [icalUrl, setIcalUrl] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!icalUrl.trim()) return

    setLoading(true)
    try {
      await onAdd({
        property_id: propertyId,
        platform_name: platform,
        ical_url: icalUrl.trim(),
        display_name: displayName.trim() || undefined,
        is_active: true
      })
    } catch (error) {
      console.error('Error adding iCal link:', error)
    } finally {
      setLoading(false)
    }
  }

  const platforms = Object.entries(ICalService.PLATFORMS)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add iCal Link</h2>
              <p className="text-sm text-gray-500">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map(([key, platform]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlatform(key as any)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    platform.name === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-medium text-sm">{platform.displayName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* iCal URL */}
          <div>
            <label htmlFor="icalUrl" className="block text-sm font-medium text-gray-700 mb-2">
              iCal URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="icalUrl"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the iCal URL from your booking platform
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Main Airbnb Calendar"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              A custom name for this calendar link
            </p>
          </div>

          {/* Platform-specific instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              How to get your iCal URL:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              {platform === 'airbnb' && (
                <p>Go to your Airbnb hosting dashboard → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'booking' && (
                <p>Go to your Booking.com extranet → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'agoda' && (
                <p>Go to your Agoda extranet → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'tripadvisor' && (
                <p>Go to your TripAdvisor dashboard → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'nomads' && (
                <p>Go to your Nomads dashboard → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'hive' && (
                <p>Go to your Hive dashboard → Calendar → Export Calendar → Copy the iCal URL</p>
              )}
              {platform === 'other' && (
                <p>Look for "Export Calendar", "iCal", or "Calendar Feed" in your platform's settings</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !icalUrl.trim()}
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add iCal Link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 