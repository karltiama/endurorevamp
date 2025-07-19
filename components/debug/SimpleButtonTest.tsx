'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SimpleButtonTest() {
  const [clickCount, setClickCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    console.log('Button clicked!')
    setClickCount(prev => prev + 1)
  }

  const handleAsyncClick = async () => {
    console.log('Async button clicked!')
    setIsLoading(true)
    
    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setClickCount(prev => prev + 1)
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Simple Button Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={handleClick}>
            Test Button (Clicked: {clickCount})
          </Button>
        </div>
        
        <div>
          <Button onClick={handleAsyncClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Async Test Button'}
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p>Click count: {clickCount}</p>
          <p>Loading state: {isLoading ? 'true' : 'false'}</p>
        </div>
      </CardContent>
    </Card>
  )
} 