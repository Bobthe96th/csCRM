'use client'

import { useState, useEffect } from 'react'
import { supabase, type WhatsAppMessage, type Conversation } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import ChatWindow from '@/components/ChatWindow'
import TabbedInterface from '@/components/TabbedInterface'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...')
    const channel = supabase
      .channel('whatsapp_inbox')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_inbox'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          // Play notification sound for new messages
          if (payload.eventType === 'INSERT') {
            playNotificationSound()
          }
          
          // Refresh conversations and messages
          fetchConversations()
          if (selectedConversation) {
            fetchMessages(selectedConversation)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up real-time subscription...')
      supabase.removeChannel(channel)
    }
  }, [selectedConversation])

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Higher frequency and longer duration
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.4)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.8)
      
      // Higher volume and longer duration
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1.5)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }

  const playTypingSound = () => {
    try {
      // Create a typing field click sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Quick, high-pitched click sound
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05)
      
      gainNode.gain.setValueAtTime(0.6, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Could not play typing sound:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations from Supabase...')
      console.log('Supabase client:', supabase)
      
      // First, let's test a simple query to see if connection works
      console.log('Testing basic connection...')
      const { data: testData, error: testError } = await supabase
        .from('whatsapp_inbox')
        .select('*')
        .limit(1)
      
      console.log('Test query result:', { testData, testError })
      
      // Let's also try to see what tables are available
      console.log('Checking available tables...')
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      console.log('Available tables:', { tablesData, tablesError })
      
      const { data, error } = await supabase
        .from('whatsapp_inbox')
        .select('sender_number, message_text, created_at, status')
        .order('created_at', { ascending: false })

      console.log('Raw Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        console.error('Error message:', error.message)
        console.error('Error hint:', error.hint)
        throw error
      }

      console.log('Received data from Supabase:', data)

      // Group by sender_number and create conversation objects
      const conversationMap = new Map<string, Conversation>()
      
      data?.forEach((message) => {
        const existing = conversationMap.get(message.sender_number)
        if (!existing || new Date(message.created_at) > new Date(existing.last_message_time)) {
          conversationMap.set(message.sender_number, {
            sender_number: message.sender_number,
            last_message: message.message_text,
            last_message_time: message.created_at,
            unread_count: 0, // TODO: implement unread count
            status: message.status
          })
        }
      })

      const conversations = Array.from(conversationMap.values())
      console.log('Processed conversations:', conversations)
      setConversations(conversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      // Try to stringify the error to see its contents
      try {
        console.error('Error stringified:', JSON.stringify(error, null, 2))
      } catch (stringifyError) {
        console.error('Could not stringify error:', stringifyError)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (senderNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_inbox')
        .select('*')
        .eq('sender_number', senderNumber)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (messageText: string) => {
    if (!selectedConversation || !messageText.trim()) return

    try {
      // Insert the message into Supabase
      const { error: supabaseError } = await supabase
        .from('whatsapp_inbox')
        .insert({
          sender_number: selectedConversation,
          message_text: messageText,
          direction: 'outbound',
          agent: 'Human',
          status: 'open'
        })

      if (supabaseError) throw supabaseError

    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleQuickReplySelect = (replyText: string) => {
    // This will be handled by the ChatWindow component
    // We'll pass this function to ChatWindow to update the input field
    if (selectedConversation) {
      sendMessage(replyText)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        loading={loading}
      />
      <ChatWindow
        messages={messages}
        selectedConversation={selectedConversation}
        onSendMessage={sendMessage}
        onTypingFieldClick={playTypingSound}
      />
      <TabbedInterface
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
        onQuickReplySelect={handleQuickReplySelect}
      />
    </div>
  )
} 