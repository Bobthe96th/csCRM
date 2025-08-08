import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  formatCairoDateTime, 
  getCurrentCairoDateTimeForInput, 
  cairoDateTimeInputToUTC, 
  getCairoTimeWithAddedHours,
  getCairoTimezoneInfo
} from '@/lib/timezone-utils'

interface ScheduledMessage {
  id: number
  message_text: string
  recipient_number: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'cancelled'
  created_at: string
}

interface ScheduledMessagesPanelProps {
  conversations?: Array<{ sender_number: string; last_message: string; last_message_time: string; unread_count: number; status: string }>
}

export default function ScheduledMessagesPanel({ conversations = [] }: ScheduledMessagesPanelProps) {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])
  const [newScheduledMessage, setNewScheduledMessage] = useState('')
  const [newScheduledRecipient, setNewScheduledRecipient] = useState('')
  const [newScheduledTime, setNewScheduledTime] = useState('')
  const [previewUtc, setPreviewUtc] = useState('')
  const [previewCairo, setPreviewCairo] = useState('')

  // Load data from Supabase on component mount
  useEffect(() => {
    fetchScheduledMessages()
    // Set default time to current Cairo time + 1 hour
    const defaultTime = getCairoTimeWithAddedHours(1)
    setNewScheduledTime(defaultTime)
  }, [])

  // Keep a live preview so you can verify what will be saved and displayed
  useEffect(() => {
    if (!newScheduledTime) {
      setPreviewUtc('')
      setPreviewCairo('')
      return
    }
    try {
      const utcIso = cairoDateTimeInputToUTC(newScheduledTime)
      setPreviewUtc(utcIso)
      setPreviewCairo(formatCairoDateTime(utcIso))
    } catch (e) {
      // ignore preview errors
    }
  }, [newScheduledTime])

  // Fetch scheduled messages from Supabase
  const fetchScheduledMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .order('scheduled_time', { ascending: true })

      if (error) throw error
      setScheduledMessages(data || [])
    } catch (error) {
      console.error('Error fetching scheduled messages:', error)
    }
  }

  // Scheduled Messages Functions
  const addScheduledMessage = async () => {
    if (newScheduledMessage.trim() && newScheduledRecipient.trim() && newScheduledTime) {
      try {
        // Convert the Cairo time to UTC for storage
        const utcTime = cairoDateTimeInputToUTC(newScheduledTime)
        
        const { data, error } = await supabase
          .from('scheduled_messages')
          .insert({
            message_text: newScheduledMessage,
            recipient_number: newScheduledRecipient,
            scheduled_time: utcTime,
            status: 'pending'
          })
          .select()

        if (error) throw error
        
        // Refresh the list
        fetchScheduledMessages()
        setNewScheduledMessage('')
        setNewScheduledRecipient('')
        // Reset to default time (current + 1 hour)
        setNewScheduledTime(getCairoTimeWithAddedHours(1))
      } catch (error) {
        console.error('Error adding scheduled message:', error)
      }
    }
  }

  const cancelScheduledMessage = async (id: number) => {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error
      
      // Refresh the list
      fetchScheduledMessages()
    } catch (error) {
      console.error('Error cancelling scheduled message:', error)
    }
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'sent': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Scheduled Messages</h3>
      </div>

      {/* Add New Scheduled Message */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Schedule Message</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Recipient</label>
            <select
              value={newScheduledRecipient}
              onChange={(e) => setNewScheduledRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select from existing chats...</option>
              {conversations.map((conv) => (
                <option key={conv.sender_number} value={conv.sender_number}>
                  {conv.sender_number} - {conv.last_message.substring(0, 30)}...
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newScheduledRecipient}
              onChange={(e) => setNewScheduledRecipient(e.target.value)}
              placeholder="Or enter custom phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Schedule Time (Cairo Timezone - {getCairoTimezoneInfo()})
            </label>
            <input
              type="datetime-local"
              value={newScheduledTime}
              onChange={(e) => setNewScheduledTime(e.target.value)}
              min={getCurrentCairoDateTimeForInput()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500">
              Time will be scheduled in Cairo timezone ({getCairoTimezoneInfo()})
            </p>
            {previewUtc && (
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>Will save (UTC): <span className="font-mono">{previewUtc}</span></div>
                <div>Will show (Cairo): <span className="font-mono">{previewCairo}</span></div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Message</label>
            <textarea
              value={newScheduledMessage}
              onChange={(e) => setNewScheduledMessage(e.target.value)}
              placeholder="Message to send..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={addScheduledMessage}
            disabled={!newScheduledMessage.trim() || !newScheduledRecipient.trim() || !newScheduledTime}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            Schedule Message
          </button>
        </div>
      </div>

      {/* Scheduled Messages List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        {scheduledMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-gray-400 text-4xl mb-2">⏰</div>
            <p className="text-sm">No scheduled messages</p>
          </div>
        ) : (
          scheduledMessages.map((message) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(message.status)}`}>
                  {message.status}
                </span>
                {message.status === 'pending' && (
                  <button
                    onClick={() => cancelScheduledMessage(message.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">To: {message.recipient_number}</p>
              <p className="text-xs text-gray-500 mb-2">When: {formatCairoDateTime(message.scheduled_time)} (Cairo Time)</p>
              <p className="text-sm text-gray-900">{message.message_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 