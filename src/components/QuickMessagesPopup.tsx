import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  category?: MessageCategory
}

interface QuickMessagesPopupProps {
  isOpen: boolean
  onClose: () => void
  onQuickReplySelect: (reply: string) => void
  position?: { x: number; y: number }
}

export default function QuickMessagesPopup({ 
  isOpen, 
  onClose, 
  onQuickReplySelect, 
  position 
}: QuickMessagesPopupProps) {
  const [activeTab, setActiveTab] = useState<'quickreplies' | 'custom'>('quickreplies')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [categories, setCategories] = useState<MessageCategory[]>([])
  const [customMessages, setCustomMessages] = useState<CustomMessage[]>([])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load data from Supabase on component mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchCustomMessages()
    }
  }, [isOpen])

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('message_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
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

  const handleQuickReplyClick = (reply: string) => {
    onQuickReplySelect(reply)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden"
        style={{
          top: position?.y ? `${position.y}px` : '50%',
          left: position?.x ? `${position.x}px` : '50%',
          transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
          marginTop: position ? '-10px' : '0'
        }}
      >
        {/* Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('quickreplies')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'quickreplies'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Quick Replies
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {activeTab === 'quickreplies' && (
            <div className="p-3">
              {/* Language Selector */}
              <div className="mb-3">
                <div className="flex space-x-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                                             className={`px-2 py-1 text-xs rounded border transition-colors ${
                         selectedLanguage === lang.code
                           ? 'bg-blue-100 border-blue-300 text-black'
                           : 'bg-white border-gray-300 text-black hover:bg-gray-50'
                       }`}
                    >
                      <span className="mr-1">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Replies List */}
              <div className="space-y-2">
                {filteredReplies.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReplyClick(reply.text)}
                    className="w-full text-left p-2 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="p-3">
              {/* Category Filter */}
              <div className="mb-3">
                <select
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              {/* Custom Messages List */}
              <div className="space-y-2">
                {filteredCustomMessages.length === 0 ? (
                                     <div className="text-center py-4 text-black text-sm">
                     No messages found
                   </div>
                ) : (
                  filteredCustomMessages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => handleQuickReplyClick(message.text)}
                      className="w-full text-left p-2 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {message.category && (
                            <span 
                              className="inline-block px-2 py-1 rounded text-xs font-medium mb-1"
                              style={{ 
                                backgroundColor: message.category.color + '20', 
                                color: message.category.color 
                              }}
                            >
                              {message.category.name}
                            </span>
                          )}
                                                     <p className="text-sm text-black">{message.text}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 