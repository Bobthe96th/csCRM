import { useState, useRef, useEffect } from 'react'
import { type WhatsAppMessage } from '@/lib/supabase'

interface ChatWindowProps {
  messages: WhatsAppMessage[]
  selectedConversation: string | null
  onSendMessage: (messageText: string) => void
  onTypingFieldClick?: () => void
}

export default function ChatWindow({
  messages,
  selectedConversation,
  onSendMessage,
  onTypingFieldClick
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedConversation}
            </h2>
            <p className="text-sm text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    </div>
  )
} 