import { type Conversation } from '@/lib/supabase'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (senderNumber: string) => void
  loading: boolean
}

export default function Sidebar({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  loading 
}: SidebarProps) {
  console.log('Sidebar received conversations:', conversations)
  console.log('Sidebar loading state:', loading)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'closed':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Conversations</h1>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Conversations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.sender_number}
                onClick={() => onSelectConversation(conversation.sender_number)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.sender_number
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`} />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.sender_number}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.last_message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(conversation.last_message_time)}
                    </p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 