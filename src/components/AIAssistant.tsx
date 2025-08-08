'use client'

import { useState } from 'react'
import { Sparkles, Send, Edit3, Copy, Check, Loader2, X } from 'lucide-react'
import { AIService, PropertyContext, AIResponse } from '@/lib/ai-service'
import { ListingData } from '@/lib/listing-types'

interface AIAssistantProps {
  listing: ListingData
  onResponseGenerated: (response: string) => void
  onClose: () => void
}

export default function AIAssistant({ listing, onResponseGenerated, onClose }: AIAssistantProps) {
  const [userQuery, setUserQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [responseType, setResponseType] = useState<'custom' | 'location' | 'access' | 'amenities'>('custom')
  const [isEditing, setIsEditing] = useState(false)
  const [editedResponse, setEditedResponse] = useState('')
  const [copied, setCopied] = useState(false)
  const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'success' | 'error'>('unknown')

  const convertListingToContext = (listing: ListingData): PropertyContext => {
    return {
      propertyName: listing["Listing Name"] || `Property ${listing.property_id}`,
      address: listing["Address"] || 'Address not available',
      district: listing["District where property is located"] || 'Unknown District',
      zone: listing["Zone"],
      rooms: listing["Number of Rooms"],
      beds: listing["Number of Beds"],
      bathrooms: listing["Number of Bathrooms"],
      size: listing["Apartment Size In Squaremeters"],
      wifiUsername: listing["WIFI Username"],
      wifiPassword: listing["WIFI Password"],
      lockboxCode: listing["Lockbox/Smartlock Code"],
      accessType: listing["Access type"],
      host: listing["Host"],
      gpsLink: listing["Listing GPS coordinate"],
      generalGuidance: listing["General guidance"],
      additionalNotes: listing["Additional notes"],
      kitchenAppliances: listing["Kitchen Appliances"],
      laundryAppliances: listing["Laundry Appliances"],
      electricityMeter: listing["Electricity meter code"],
      waterMeter: listing["Water meter code"],
      gasMeter: listing["Gas meter code"],
      buildingSecurity: listing["Mobile Number of building security guard"]
    }
  }

  const generateResponse = async () => {
    if (!userQuery.trim() && responseType === 'custom') return

    setIsGenerating(true)
    setAiResponse('')

    try {
      const context = convertListingToContext(listing)
      let response: AIResponse

      switch (responseType) {
        case 'location':
          response = await AIService.generateLocationResponse(context)
          break
        case 'access':
          response = await AIService.generateAccessResponse(context)
          break
        case 'amenities':
          response = await AIService.generateAmenitiesResponse(context)
          break
        default:
          response = await AIService.generatePropertyResponse(context, userQuery, 'general')
      }

      if (response.success && response.message) {
        setAiResponse(response.message)
        setEditedResponse(response.message)
      } else {
        setAiResponse(`Error: ${response.error || 'Failed to generate response'}`)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      setAiResponse('Error: Failed to generate response. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendResponse = () => {
    const finalResponse = isEditing ? editedResponse : aiResponse
    onResponseGenerated(finalResponse)
    onClose()
  }

  const handleCopyResponse = async () => {
    const textToCopy = isEditing ? editedResponse : aiResponse
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const testAPIConnection = async () => {
    setApiStatus('testing')
    try {
      const response = await fetch('/api/test-ai')
      const data = await response.json()
      
      if (data.success) {
        setApiStatus('success')
        setTimeout(() => setApiStatus('unknown'), 3000)
      } else {
        setApiStatus('error')
        setTimeout(() => setApiStatus('unknown'), 5000)
      }
    } catch (error) {
      console.error('API test failed:', error)
      setApiStatus('error')
      setTimeout(() => setApiStatus('unknown'), 5000)
    }
  }

  const quickQueries = [
    "How do I find the property?",
    "What's the check-in process?",
    "Tell me about the WiFi",
    "What amenities are included?",
    "How do I access the building?",
    "What's the parking situation?"
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">AI Assistant</h2>
                <p className="text-gray-600">Generate professional responses for {listing["Listing Name"] || `Property ${listing.property_id}`}</p>
              </div>
            </div>
                         <div className="flex items-center space-x-2">
               <button
                 onClick={testAPIConnection}
                 className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                   apiStatus === 'testing' 
                     ? 'bg-yellow-100 text-yellow-700' 
                     : apiStatus === 'success'
                     ? 'bg-green-100 text-green-700'
                     : apiStatus === 'error'
                     ? 'bg-red-100 text-red-700'
                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                 }`}
                 disabled={apiStatus === 'testing'}
               >
                 {apiStatus === 'testing' ? 'Testing...' : 
                  apiStatus === 'success' ? '✓ Connected' :
                  apiStatus === 'error' ? '✗ Error' : 'Test API'}
               </button>
               <button
                 onClick={onClose}
                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Response Type Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'custom', label: 'Custom Query', icon: '💬' },
                { value: 'location', label: 'Location Help', icon: '📍' },
                { value: 'access', label: 'Access Info', icon: '🔑' },
                { value: 'amenities', label: 'Amenities', icon: '🏠' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setResponseType(type.value as any)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                    responseType === type.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>

            {/* Quick Queries */}
            {responseType === 'custom' && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick queries:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setUserQuery(query)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex space-x-2">
              {responseType === 'custom' && (
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ask about the property..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-black"
                  onKeyPress={(e) => e.key === 'Enter' && generateResponse()}
                />
              )}
              <button
                onClick={generateResponse}
                disabled={isGenerating || (responseType === 'custom' && !userQuery.trim())}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {aiResponse ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-black">AI Generated Response</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isEditing ? 'Preview' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={handleCopyResponse}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedResponse}
                    onChange={(e) => setEditedResponse(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-black resize-none"
                    placeholder="Edit the AI response..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-black whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendResponse}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Response</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {responseType === 'custom' ? 'Ask a question about the property' : 'Click Generate to create a response'}
                </h3>
                <p className="text-gray-500">
                  {responseType === 'custom' 
                    ? 'Type your question above and click Generate to get an AI-powered response.'
                    : 'The AI will generate a professional response based on the property information.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 