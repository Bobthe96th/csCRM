import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PropertyManager from './PropertyManager'
import StatusIndicator from './StatusIndicator'

interface PropertyManagementPanelProps {
  supabaseUrl?: string
  onQuickReplySelect: (reply: string) => void
  conversations?: Array<{ sender_number: string; last_message: string; last_message_time: string; unread_count: number; status: string }>
}

export default function PropertyManagementPanel({ 
  supabaseUrl, 
  onQuickReplySelect, 
  conversations = [] 
}: PropertyManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'status'>('properties')

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
            activeTab === 'properties'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
            activeTab === 'status'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Status
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'properties' && (
          <div className="h-full">
            <PropertyManager onQuickReplySelect={onQuickReplySelect} />
          </div>
        )}

        {activeTab === 'status' && (
          <div className="p-4">
            <StatusIndicator supabaseUrl={supabaseUrl} />
          </div>
        )}
      </div>
    </div>
  )
} 