import React, { useState, useEffect } from 'react'
import { 
  formatCairoDateTime, 
  getCurrentCairoDateTimeForInput, 
  cairoDateTimeInputToUTC, 
  getCairoTimeWithAddedHours,
  getCairoTimezoneInfo,
  getCurrentCairoTime
} from '@/lib/timezone-utils'

export default function TimezoneTest() {
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    const results: string[] = []
    
    // Test current Cairo time (render via Cairo-aware formatter)
    results.push(`Current Cairo Time: ${formatCairoDateTime(new Date())}`)
    
    // Test timezone info
    results.push(`Cairo Timezone Info: ${getCairoTimezoneInfo()}`)
    
    // Test datetime input format
    const inputFormat = getCurrentCairoDateTimeForInput()
    results.push(`Current Cairo for Input: ${inputFormat}`)
    
    // Test Cairo time + 1 hour
    const cairoPlus1 = getCairoTimeWithAddedHours(1)
    results.push(`Cairo + 1 hour: ${cairoPlus1}`)
    
    // Test conversion to UTC
    const testDateTime = '2024-12-25T15:30'
    const utcConverted = cairoDateTimeInputToUTC(testDateTime)
    results.push(`Test Input: ${testDateTime} -> UTC: ${utcConverted}`)
    
    // Test formatting UTC back to Cairo
    const formatted = formatCairoDateTime(utcConverted)
    results.push(`UTC back to Cairo: ${formatted}`)
    
    setTestResults(results)
  }, [])

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-lg mb-2">Timezone Test Results</h3>
      <div className="space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
            {result}
          </div>
        ))}
      </div>
    </div>
  )
}
