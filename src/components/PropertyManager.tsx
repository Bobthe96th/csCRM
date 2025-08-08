'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, ArrowLeft, MapPin, Wifi, Key, Car, Clock, Phone, Shield, Settings, Map, Home, Sparkles } from 'lucide-react'
import { 
  Property, 
  PropertyDetail, 
  PropertyContact, 
  PropertyAmenity,
  PropertyWithDetails,
  PropertyDetailGroup,
  PROPERTY_DETAIL_GROUP_CONFIG,
  PROPERTY_DETAIL_GROUPS
} from '@/lib/property-types'
import { ListingData } from '@/lib/listing-types'
import AIAssistant from './AIAssistant'

interface PropertyManagerProps {
  onQuickReplySelect: (message: string) => void
}

export default function PropertyManager({ onQuickReplySelect }: PropertyManagerProps) {
  const [listings, setListings] = useState<ListingData[]>([])
  const [selectedListing, setSelectedListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PropertyDetailGroup | null>(null)
  const [districts, setDistricts] = useState<string[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Listingdata')
        .select('*')
        .order('"Listing Name"')

      if (error) throw error
      
      const listingsData = data || []
      setListings(listingsData)
      
      // Extract unique districts
      const uniqueDistricts = Array.from(new Set(
        listingsData
          .map(listing => listing["District where property is located"])
          .filter(Boolean)
      )).sort()
      setDistricts(uniqueDistricts)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectListing = (listing: ListingData) => {
    setSelectedListing(listing)
    setShowPropertyModal(true)
    setSelectedCategory(null)
  }

  const filteredListings = searchTerm 
    ? listings.filter(listing => 
        listing["Listing Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing["District where property is located"]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedDistrict
    ? listings.filter(listing => listing["District where property is located"] === selectedDistrict)
    : listings

  // Convert listing data to property detail groups
  const getListingDetailGroups = (listing: ListingData) => {
    const groups: Record<PropertyDetailGroup, Array<{title: string, value: string, icon: string}>> = {
      access: [],
      connectivity: [],
      logistics: [],
      rules: [],
      safety: [],
      services: [],
      local: [],
      amenities: []
    }

    // Access Information
    if (listing["Lockbox/Smartlock Code"]) {
      groups.access.push({
        title: "Lockbox/Smartlock Code",
        value: listing["Lockbox/Smartlock Code"],
        icon: "🔑"
      })
    }
    if (listing["Access type"]) {
      groups.access.push({
        title: "Access Type",
        value: listing["Access type"],
        icon: "🚪"
      })
    }

    // Connectivity
    if (listing["WIFI Username"]) {
      groups.connectivity.push({
        title: "WiFi Network",
        value: listing["WIFI Username"],
        icon: "📶"
      })
    }
    if (listing["WIFI Password"]) {
      groups.connectivity.push({
        title: "WiFi Password",
        value: listing["WIFI Password"],
        icon: "🔒"
      })
    }

    // Logistics
    if (listing["Number of Rooms"]) {
      groups.logistics.push({
        title: "Number of Rooms",
        value: listing["Number of Rooms"],
        icon: "🏠"
      })
    }
    if (listing["Number of Beds"]) {
      groups.logistics.push({
        title: "Number of Beds",
        value: listing["Number of Beds"],
        icon: "🛏️"
      })
    }
    if (listing["Number of Bathrooms"]) {
      groups.logistics.push({
        title: "Number of Bathrooms",
        value: listing["Number of Bathrooms"].toString(),
        icon: "🚿"
      })
    }
    if (listing["Apartment Size In Squaremeters"]) {
      groups.logistics.push({
        title: "Apartment Size",
        value: `${listing["Apartment Size In Squaremeters"]} m²`,
        icon: "📏"
      })
    }

    // Services
    if (listing["Electricity meter code"]) {
      groups.services.push({
        title: "Electricity Meter Code",
        value: listing["Electricity meter code"],
        icon: "⚡"
      })
    }
    if (listing["Water meter code"]) {
      groups.services.push({
        title: "Water Meter Code",
        value: listing["Water meter code"],
        icon: "💧"
      })
    }
    if (listing["Gas meter code"]) {
      groups.services.push({
        title: "Gas Meter Code",
        value: listing["Gas meter code"],
        icon: "🔥"
      })
    }

    // Safety
    if (listing["Mobile Number of building security guard"]) {
      groups.safety.push({
        title: "Building Security",
        value: listing["Mobile Number of building security guard"],
        icon: "🛡️"
      })
    }

    // Local
    if (listing["General guidance"]) {
      groups.local.push({
        title: "General Guidance",
        value: listing["General guidance"],
        icon: "📋"
      })
    }
    if (listing["Additional notes"]) {
      groups.local.push({
        title: "Additional Notes",
        value: listing["Additional notes"],
        icon: "📝"
      })
    }

    // Amenities
    if (listing["Kitchen Appliances"]) {
      groups.amenities.push({
        title: "Kitchen Appliances",
        value: listing["Kitchen Appliances"],
        icon: "🍳"
      })
    }
    if (listing["Laundry Appliances"]) {
      groups.amenities.push({
        title: "Laundry Appliances",
        value: listing["Laundry Appliances"],
        icon: "🧺"
      })
    }

    return groups
  }

  const closeModal = () => {
    setShowPropertyModal(false)
    setSelectedListing(null)
    setSelectedCategory(null)
    setSearchTerm('')
  }

  const selectNewProperty = () => {
    setShowPropertyModal(false)
    setSelectedListing(null)
    setSelectedCategory(null)
    setSearchTerm('')
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  const handleAIResponseGenerated = (response: string) => {
    onQuickReplySelect(response)
  }

  const sendLocationBox = (listing: ListingData) => {
    const propertyName = listing["Listing Name"] || `Property ${listing.property_id}`
    const address = listing["Address"] || 'Address not available'
    const district = listing["District where property is located"] || 'Unknown District'
    const zone = listing["Zone"] || ''
    const gpsLink = listing["Listing GPS coordinate"] || ''
    
    const locationBox = `📍 **${propertyName}**

🏠 **Address:** ${address}
🏘️ **District:** ${district}${zone ? `\n📍 **Zone:** ${zone}` : ''}

🗺️ **Location:** ${gpsLink || 'Location link not available'}`

    onQuickReplySelect(locationBox)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading properties...</div>
      </div>
    )
  }

    return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 min-h-0">
      {/* Enhanced Header */}
      <div className="p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Property Information</h1>
            <p className="text-black mt-2 text-lg">Access property details from your listings</p>
          </div>
          <div className="text-black text-right">
            <div className="text-2xl font-bold">{listings.length}</div>
            <div className="text-sm">Total Properties</div>
          </div>
        </div>
      </div>

      {/* Enhanced Property Selection */}
      <div className="p-8 overflow-y-auto min-h-0 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Search Properties</label>
                <input
                  type="text"
                  placeholder="Search by name or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Filter by District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-black"
                >
                  <option value="">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchListings}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div 
                key={listing.property_id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => selectListing(listing)}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {listing["Listing Name"] || `Property ${listing.property_id}`}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                      {listing["District where property is located"] || 'Unknown District'}
                    </span>
                    {listing["Zone"] && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        {listing["Zone"]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Address */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                      {listing["Address"] || 'Address not available'}
                    </p>
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {listing["Number of Rooms"] && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">{listing["Number of Rooms"]}</div>
                        <div className="text-xs text-gray-600">Rooms</div>
                      </div>
                    )}
                    {listing["Number of Beds"] && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-green-600">{listing["Number of Beds"]}</div>
                        <div className="text-xs text-gray-600">Beds</div>
                      </div>
                    )}
                    {listing["Number of Bathrooms"] && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-purple-600">{listing["Number of Bathrooms"]}</div>
                        <div className="text-xs text-gray-600">Bathrooms</div>
                      </div>
                    )}
                    {listing["Apartment Size In Squaremeters"] && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-orange-600">{listing["Apartment Size In Squaremeters"]}</div>
                        <div className="text-xs text-gray-600">m²</div>
                      </div>
                    )}
                  </div>

                                     {/* Quick Info */}
                   <div className="space-y-2">
                     {listing["Host"] && (
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-600">Host:</span>
                         <span className="font-medium text-gray-900">{listing["Host"]}</span>
                       </div>
                     )}
                     {listing["Access type"] && (
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-600">Access:</span>
                         <span className="font-medium text-gray-900">{listing["Access type"]}</span>
                       </div>
                     )}
                   </div>

                   {/* Quick Actions */}
                   <div className="flex space-x-2 pt-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation()
                         selectListing(listing)
                       }}
                       className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors text-sm"
                     >
                       View Details
                     </button>
                                           {listing["Listing GPS coordinate"] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sendLocationBox(listing)
                          }}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors text-sm"
                          title="Send Location Box"
                        >
                          📍
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedListing(listing)
                          setShowAIAssistant(true)
                        }}
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition-colors text-sm"
                        title="AI Assistant"
                      >
                        ✨
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">
                {listings.length === 0 ? 'No properties found' : 'No properties match your search'}
              </h3>
              <p className="text-black">
                {listings.length === 0 
                  ? 'There are no properties in the database.' 
                  : 'Try adjusting your search terms or district filter.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Property Modal - Only show when modal is active */}
      {showPropertyModal && selectedListing && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-[9999]"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100 relative">
            {/* Close Button - Top Right */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-3 text-black hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 z-10 bg-white shadow-lg"
              title="Close"
            >
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
            
            {/* Enhanced Modal Header */}
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-black mb-2">
                    {selectedListing["Listing Name"] || `Property ${selectedListing.property_id}`}
                  </h2>
                  <p className="text-black text-lg">{selectedListing["Address"] || 'Address not available'}</p>
                  <p className="text-sm text-black mt-1">
                    {selectedListing["District where property is located"]}, {selectedListing["Zone"] || 'Unknown Zone'}
                  </p>
                </div>
                                 <div className="flex items-center space-x-4">
                   <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-black border border-green-200">
                     Active
                   </span>
                                       {selectedListing["Listing GPS coordinate"] && (
                      <button
                        onClick={() => sendLocationBox(selectedListing)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        📍 Send Location Box
                      </button>
                    )}
                    <button
                      onClick={() => setShowAIAssistant(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>AI Assistant</span>
                    </button>
                   <button
                     onClick={selectNewProperty}
                     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                   >
                     Choose Another
                   </button>
                 </div>
              </div>
            </div>

            {/* Enhanced Category Selection */}
            {!selectedCategory && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-black mb-6 text-center">Select Information Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(PROPERTY_DETAIL_GROUP_CONFIG).map(([group, config]) => {
                    const groups = getListingDetailGroups(selectedListing)
                    const hasData = groups[group as PropertyDetailGroup].length > 0
                    
                    return (
                      <button
                        key={group}
                        onClick={() => setSelectedCategory(group as PropertyDetailGroup)}
                        disabled={!hasData}
                        className={`p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                          hasData 
                            ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer shadow-lg hover:shadow-xl' 
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="text-4xl mb-3">{config.icon}</div>
                        <div className="font-semibold text-black text-lg">{config.title}</div>
                        <div className="text-sm text-black mt-2">
                          {groups[group as PropertyDetailGroup].length} items
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Enhanced Category Details */}
            {selectedCategory && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-3 text-black hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{PROPERTY_DETAIL_GROUP_CONFIG[selectedCategory].icon}</span>
                      <h3 className="text-2xl font-bold text-black">
                        {PROPERTY_DETAIL_GROUP_CONFIG[selectedCategory].title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-260px)] pr-2">
                  {getListingDetailGroups(selectedListing)[selectedCategory].map((detail, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{detail.icon}</span>
                            <div className="font-bold text-black text-lg">{detail.title}</div>
                          </div>
                          <div className="text-black text-base font-mono bg-gray-100 px-4 py-2 rounded-lg">
                            {detail.value}
                          </div>
                        </div>
                                                 <div className="flex space-x-2">
                                                    <div className="flex space-x-2">
                           <button
                             onClick={() => onQuickReplySelect(`${selectedListing["Listing Name"] || 'Property'} - ${detail.title}: ${detail.value}`)}
                             className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                           >
                             Use
                           </button>
                           <button
                             onClick={() => setShowAIAssistant(true)}
                             className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                           >
                             <Sparkles className="w-4 h-4" />
                             <span>AI</span>
                           </button>
                         </div>
                           {detail.title === "Address" && selectedListing["Listing GPS coordinate"] && (
                             <button
                               onClick={() => sendLocationBox(selectedListing)}
                               className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                             >
                               Send Location Box
                             </button>
                           )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
             )}

       {/* AI Assistant Modal */}
       {showAIAssistant && selectedListing && (
         <AIAssistant
           listing={selectedListing}
           onResponseGenerated={handleAIResponseGenerated}
           onClose={() => setShowAIAssistant(false)}
         />
       )}
     </div>
   )
 } 