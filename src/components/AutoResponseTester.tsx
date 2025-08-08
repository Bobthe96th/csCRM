'use client'

import { useState } from 'react'
import { Send, Bot, User, ArrowRight, TestTube } from 'lucide-react'

interface TestQuestion {
  question: string
  category: string
  expectedOutcome: 'auto-response' | 'escalation'
}

export default function AutoResponseTester() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [guestContext, setGuestContext] = useState<any>(null)

  const testQuestions: TestQuestion[] = [
    // Simple name verification
    {
      question: "My name is John Smith",
      category: "Name Verification",
      expectedOutcome: "auto-response"
    },
    {
      question: "I'm Sarah Johnson",
      category: "Name Verification",
      expectedOutcome: "auto-response"
    },
    {
      question: "This is Mike Wilson",
      category: "Name Verification",
      expectedOutcome: "auto-response"
    },
    
    // Property information
    {
      question: "Property 4",
      category: "Property ID",
      expectedOutcome: "auto-response"
    },
    {
      question: "I'm staying in Maadi",
      category: "Property Location",
      expectedOutcome: "auto-response"
    },
    {
      question: "Property ID 2",
      category: "Property ID",
      expectedOutcome: "auto-response"
    },
    
    // Questions AI can answer (after verification)
    {
      question: "What's the WiFi password for the apartment?",
      category: "Access Information",
      expectedOutcome: "auto-response"
    },
    {
      question: "How do I find the property?",
      category: "Location",
      expectedOutcome: "auto-response"
    },
    {
      question: "What amenities are included?",
      category: "Amenities",
      expectedOutcome: "auto-response"
    },
    {
      question: "What's the lockbox code?",
      category: "Access",
      expectedOutcome: "auto-response"
    },
    {
      question: "Tell me about the property in Maadi",
      category: "General Info",
      expectedOutcome: "auto-response"
    },
    
    // Questions that should escalate
    {
      question: "I want to cancel my booking",
      category: "Booking",
      expectedOutcome: "escalation"
    },
    {
      question: "There's a problem with the air conditioning",
      category: "Technical Issue",
      expectedOutcome: "escalation"
    },
    {
      question: "I need a refund",
      category: "Payment",
      expectedOutcome: "escalation"
    },
    {
      question: "I'm very unhappy with my stay",
      category: "Complaint",
      expectedOutcome: "escalation"
    },
    {
      question: "Can I speak to a human?",
      category: "Human Request",
      expectedOutcome: "escalation"
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setResponse('')
    setAnalysis(null)

    try {
      const res = await fetch('/api/auto-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                 body: JSON.stringify({
           question: question.trim(),
           guestId: 'test-guest-123',
           conversationId: 'test-conversation-456'
         })
      })

      const data = await res.json()
      
      if (data.success) {
        setResponse(data.data.response)
        setAnalysis(data.data)
        setGuestContext(data.data.guestContext)
      } else {
        setResponse('Error: ' + data.error)
      }
    } catch (error) {
      setResponse('Error: Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestQuestion = (testQuestion: TestQuestion) => {
    setQuestion(testQuestion.question)
  }

  const handleTestGuestVerification = async () => {
    try {
      const res = await fetch('/api/test-guest')
      const data = await res.json()
      console.log('Guest verification test result:', data)
      alert('Check console for guest verification test results')
    } catch (error) {
      console.error('Guest verification test error:', error)
      alert('Error testing guest verification')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <TestTube className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">AI Auto-Response Tester</h1>
              <p className="text-blue-100">Test the AI's ability to auto-respond or escalate questions</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Test Questions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Test Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testQuestions.map((testQ, index) => (
                <button
                  key={index}
                  onClick={() => handleTestQuestion(testQ)}
                  className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                    testQ.expectedOutcome === 'auto-response'
                      ? 'border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{testQ.question}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {testQ.category} • Expected: {testQ.expectedOutcome}
                  </div>
                </button>
              ))}
            </div>
          </div>

                     {/* Test Database Button */}
           <div className="mb-4">
             <button
               type="button"
               onClick={handleTestGuestVerification}
               className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
             >
               Test Database Connection
             </button>
           </div>

          {/* Question Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type a question to test auto-response..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-black"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Test</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Response */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Question:</span>
                </div>
                <span className="text-gray-900 font-medium">{question}</span>
              </div>

              <div className="flex items-start space-x-3">
                <Bot className="w-5 h-5 text-blue-500 mt-1" />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{response}</p>
                  </div>
                </div>
              </div>

                             {/* Analysis */}
               {analysis && (
                 <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                   <h3 className="text-sm font-semibold text-blue-900 mb-2">Analysis Results</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                     <div>
                       <span className="text-blue-700">Can Answer:</span>
                       <span className={`ml-1 font-medium ${analysis.canAnswer ? 'text-green-600' : 'text-red-600'}`}>
                         {analysis.canAnswer ? 'Yes' : 'No'}
                       </span>
                     </div>
                     <div>
                       <span className="text-blue-700">Confidence:</span>
                       <span className="ml-1 font-medium text-blue-900">{analysis.confidence}</span>
                     </div>
                     <div>
                       <span className="text-blue-700">Properties:</span>
                       <span className="ml-1 font-medium text-blue-900">{analysis.propertiesCount}</span>
                     </div>
                     <div>
                       <span className="text-blue-700">Type:</span>
                       <span className="ml-1 font-medium text-blue-900">
                         {analysis.analysis.isPropertyRelated ? 'Property' : 
                          analysis.analysis.isTechnicalIssue ? 'Technical' :
                          analysis.analysis.isPaymentRelated ? 'Payment' : 'General'}
                       </span>
                     </div>
                   </div>
                   <div className="mt-2 text-xs text-blue-700">
                     <strong>Reason:</strong> {analysis.reason}
                   </div>
                 </div>
               )}

                               
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 