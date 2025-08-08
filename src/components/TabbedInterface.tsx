import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import StatusIndicator from './StatusIndicator'
import PropertyManager from './PropertyManager'

interface QuickReply {
  id: string
  text: string
  language: string
}

interface MessageCategory {
  id: number
  name: string
  color: string
  created_at: string
}

interface CustomMessage {
  id: number
  text: string
  category_id: number
  created_at: string
  category?: MessageCategory // For joined data
}

interface ScheduledMessage {
  id: number
  message_text: string
  recipient_number: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'cancelled'
  created_at: string
}

interface TabbedInterfaceProps {
  supabaseUrl?: string
  onQuickReplySelect: (reply: string) => void
  conversations?: Array<{ sender_number: string; last_message: string; last_message_time: string; unread_count: number; status: string }>
}

export default function TabbedInterface({ supabaseUrl, onQuickReplySelect, conversations = [] }: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'quickreplies' | 'custom' | 'scheduled' | 'status' | 'properties'>('quickreplies')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  
  // Categories State
  const [categories, setCategories] = useState<MessageCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Custom Messages State
  const [customMessages, setCustomMessages] = useState<CustomMessage[]>([])
  const [newCustomMessage, setNewCustomMessage] = useState('')
  const [newMessageCategoryId, setNewMessageCategoryId] = useState<number | null>(null)
  
  // Scheduled Messages State
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])
  const [newScheduledMessage, setNewScheduledMessage] = useState('')
  const [newScheduledRecipient, setNewScheduledRecipient] = useState('')
  const [newScheduledTime, setNewScheduledTime] = useState('')

  // Load data from Supabase on component mount
  useEffect(() => {
    fetchCategories()
    fetchCustomMessages()
    fetchScheduledMessages()
  }, [])

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('message_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
      
      // Set default category if none selected
      if (data && data.length > 0 && !newMessageCategoryId) {
        setNewMessageCategoryId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch custom messages from Supabase
  const fetchCustomMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_messages')
        .select(`
          *,
          category:message_categories(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomMessages(data || [])
    } catch (error) {
      console.error('Error fetching custom messages:', error)
    }
  }

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

  const quickReplies: QuickReply[] = [
    { id: '1', text: 'Hello! How can I help you today?', language: 'en' },
    { id: '2', text: 'Thank you for contacting us. We\'ll get back to you soon.', language: 'en' },
    { id: '3', text: 'Your order has been confirmed and will be delivered soon.', language: 'en' },
    { id: '4', text: 'I apologize for the inconvenience. Let me assist you.', language: 'en' },
    { id: '5', text: 'مرحباً! كيف يمكنني مساعدتك اليوم؟', language: 'ar' },
    { id: '6', text: 'شكراً لتواصلكم معنا. سنعود إليكم قريباً.', language: 'ar' },
    { id: '7', text: 'تم تأكيد طلبك وسيتم تسليمه قريباً.', language: 'ar' },
    { id: '8', text: 'أعتذر عن الإزعاج. دعني أساعدك.', language: 'ar' },
    { id: '9', text: '¡Hola! ¿Cómo puedo ayudarte hoy?', language: 'es' },
    { id: '10', text: 'Gracias por contactarnos. Te responderemos pronto.', language: 'es' },
    { id: '11', text: 'Tu pedido ha sido confirmado y será entregado pronto.', language: 'es' },
    { id: '12', text: 'Me disculpo por las molestias. Déjame ayudarte.', language: 'es' },
  ]

  const filteredReplies = quickReplies.filter(reply => reply.language === selectedLanguage)
  
  // Filter custom messages based on category and search
  const filteredCustomMessages = customMessages.filter(message => {
    const matchesCategory = selectedCategoryFilter === null || message.category_id === selectedCategoryFilter
    const matchesSearch = searchTerm === '' || message.text.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  // Category management functions
  const addCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const { data, error } = await supabase
          .from('message_categories')
          .insert({
            name: newCategoryName.trim(),
            color: newCategoryColor
          })
          .select()

        if (error) throw error
        
        // Refresh categories
        fetchCategories()
        setNewCategoryName('')
        setShowAddCategory(false)
      } catch (error) {
        console.error('Error adding category:', error)
      }
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      const { error } = await supabase
        .from('message_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Refresh categories
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  // Custom Messages Functions
  const addCustomMessage = async () => {
    if (newCustomMessage.trim() && newMessageCategoryId) {
      try {
        const { data, error } = await supabase
          .from('custom_messages')
          .insert({
            text: newCustomMessage,
            category_id: newMessageCategoryId
          })
          .select()

        if (error) throw error
        
        // Refresh the list
        fetchCustomMessages()
        setNewCustomMessage('')
      } catch (error) {
        console.error('Error adding custom message:', error)
      }
    }
  }

  const deleteCustomMessage = async (id: number) => {
    try {
      const { error } = await supabase
        .from('custom_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Refresh the list
      fetchCustomMessages()
    } catch (error) {
      console.error('Error deleting custom message:', error)
    }
  }

  // Scheduled Messages Functions
  const addScheduledMessage = async () => {
    if (newScheduledMessage.trim() && newScheduledRecipient.trim() && newScheduledTime) {
      try {
        const { data, error } = await supabase
          .from('scheduled_messages')
          .insert({
            message_text: newScheduledMessage,
            recipient_number: newScheduledRecipient,
            scheduled_time: newScheduledTime,
            status: 'pending'
          })
          .select()

        if (error) throw error
        
        // Refresh the list
        fetchScheduledMessages()
        setNewScheduledMessage('')
        setNewScheduledRecipient('')
        setNewScheduledTime('')
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

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('quickreplies')}
          className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
            activeTab === 'quickreplies'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Quick
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Custom
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
            activeTab === 'scheduled'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Schedule
        </button>
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
      <div className="flex-1 overflow-hidden">
        {activeTab === 'quickreplies' && (
          <div className="h-full flex flex-col">
            {/* Language Selector */}
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Language
              </label>
              <div className="flex space-x-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Replies List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => onQuickReplySelect(reply.text)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm text-gray-900">{reply.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="h-full flex flex-col">
            {/* Header with Add Category Button */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Custom Messages</h3>
                <button
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                >
                  {showAddCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>
              
              {showAddCategory && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={addCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Filter by category:</label>
                <select
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Messages ({customMessages.length})</option>
                  {categories.map((category) => {
                    const messageCount = customMessages.filter(m => m.category_id === category.id).length
                    return (
                      <option key={category.id} value={category.id}>
                        {category.name} ({messageCount})
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredCustomMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💬</div>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchTerm 
                        ? 'No messages found matching your search.' 
                        : selectedCategoryFilter 
                          ? 'No messages in this category yet.'
                          : 'No messages yet. Create your first one!'
                      }
                    </p>
                    {!searchTerm && !selectedCategoryFilter && (
                      <button
                        onClick={() => setShowAddCategory(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                      >
                        Create Your First Message
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomMessages.map((message) => (
                      <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          {message.category && (
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: message.category.color + '20', 
                                color: message.category.color 
                              }}
                            >
                              {message.category.name}
                            </span>
                          )}
                          <button
                            onClick={() => deleteCustomMessage(message.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 mb-3 leading-relaxed">{message.text}</p>
                        <button
                          onClick={() => onQuickReplySelect(message.text)}
                          className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          Use This Message
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Add Message (Floating) */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={newMessageCategoryId || ''}
                    onChange={(e) => setNewMessageCategoryId(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <textarea
                    value={newCustomMessage}
                    onChange={(e) => setNewCustomMessage(e.target.value)}
                    placeholder="Type a new message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    onClick={addCustomMessage}
                    disabled={!newCustomMessage.trim() || !newMessageCategoryId}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="h-full flex flex-col">
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
                  <label className="block text-xs font-medium text-gray-600">Schedule Time</label>
                  <input
                    type="datetime-local"
                    value={newScheduledTime}
                    onChange={(e) => setNewScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {scheduledMessages.map((message) => (
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
                  <p className="text-xs text-gray-500 mb-2">When: {formatDateTime(message.scheduled_time)}</p>
                  <p className="text-sm text-gray-900">{message.message_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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