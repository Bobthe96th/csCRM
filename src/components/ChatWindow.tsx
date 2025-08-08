import { useState, useRef, useEffect } from 'react'
import { type WhatsAppMessage } from '@/lib/supabase'
import QuickMessagesPopup from './QuickMessagesPopup'

interface ChatWindowProps {
  messages: WhatsAppMessage[]
  selectedConversation: string | null
  onSendMessage: (messageText: string) => void
  onTypingFieldClick?: () => void
  onTestAutoResponse?: () => void
  showAutoResponseTester?: boolean
  onToggleScheduledMessages?: () => void
  showScheduledMessages?: boolean
}

export default function ChatWindow({
  messages,
  selectedConversation,
  onSendMessage,
  onTypingFieldClick,
  onTestAutoResponse,
  showAutoResponseTester,
  onToggleScheduledMessages,
  showScheduledMessages
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const [quickMessagesPosition, setQuickMessagesPosition] = useState<{ x: number; y: number } | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const quickMessagesButtonRef = useRef<HTMLButtonElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && selectedConversation) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }

  const handleQuickMessagesToggle = () => {
    if (quickMessagesButtonRef.current) {
      const rect = quickMessagesButtonRef.current.getBoundingClientRect()
      setQuickMessagesPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
    setShowQuickMessages(!showQuickMessages)
  }

  const handleQuickReplySelect = (reply: string) => {
    setNewMessage(reply)
    setShowQuickMessages(false)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Select a conversation
          </h2>
          <p className="text-gray-500">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">
              {selectedConversation}
            </h2>
            <p className="text-sm text-black">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Navigation Buttons */}
            <a
              href="/occupancy"
              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-medium flex items-center"
            >
              <span className="mr-1">📅</span>
              Occupancy
            </a>
            {onTestAutoResponse && (
              <button
                onClick={onTestAutoResponse}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium flex items-center"
              >
                <span className="mr-1">{showAutoResponseTester ? '←' : '🧪'}</span>
                {showAutoResponseTester ? 'Back to Chat' : 'Test Auto-Response'}
              </button>
            )}
            {onToggleScheduledMessages && (
              <button
                onClick={onToggleScheduledMessages}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg shadow-sm hover:from-orange-700 hover:to-red-700 transition-all duration-200 text-sm font-medium flex items-center"
              >
                <span className="mr-1">⏰</span>
                {showScheduledMessages ? 'Properties' : 'Schedule'}
              </button>
            )}
                          <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-black">Online</span>
              </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.direction === 'inbound'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs opacity-75">
                    {message.agent}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <p className="text-sm">{message.message_text}</p>
                {message.status !== 'open' && (
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      message.status === 'closed' 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {message.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <button
            type="button"
            ref={quickMessagesButtonRef}
            onClick={handleQuickMessagesToggle}
            disabled={!selectedConversation}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Quick Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onClick={() => onTypingFieldClick?.()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!selectedConversation}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedConversation}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Quick Messages Popup */}
      <QuickMessagesPopup
        isOpen={showQuickMessages}
        onClose={() => setShowQuickMessages(false)}
        onQuickReplySelect={handleQuickReplySelect}
        position={quickMessagesPosition}
      />
    </div>
  )
} 