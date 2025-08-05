import { useState } from 'react'
import StatusIndicator from './StatusIndicator'

interface QuickReply {
  id: string
  text: string
  language: string
}

interface TabbedInterfaceProps {
  supabaseUrl?: string
  onQuickReplySelect: (reply: string) => void
}

export default function TabbedInterface({ supabaseUrl, onQuickReplySelect }: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'quickreplies' | 'status'>('quickreplies')
  const [selectedLanguage, setSelectedLanguage] = useState('en')

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

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('quickreplies')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'quickreplies'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Quick Replies
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'status'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          System Status
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

        {activeTab === 'status' && (
          <div className="p-4">
            <StatusIndicator supabaseUrl={supabaseUrl} />
          </div>
        )}
      </div>
    </div>
  )
} 