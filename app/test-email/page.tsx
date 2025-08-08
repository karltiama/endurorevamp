'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [template, setTemplate] = useState('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<{
    config: {
      resendApiKey: string;
      fromEmail: string;
      adminEmail: string;
      resendDomain: string;
      nodeEnv: string;
    };
    recommendations: string[];
    nextSteps: string[];
  } | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/test/email-config')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error checking config:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email, template }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Failed to send test email')
    } finally {
      setIsLoading(false)
    }
  }

  // Check config on component mount
  useEffect(() => {
    checkConfig()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Current email setup status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading ? (
              <div className="text-center py-4">Loading configuration...</div>
            ) : config ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Resend API Key:</span>
                  <span className={config.config.resendApiKey.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                    {config.config.resendApiKey}
                  </span>
                  
                  <span className="font-medium">From Email:</span>
                  <span className={config.config.fromEmail.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                    {config.config.fromEmail}
                  </span>
                  
                  <span className="font-medium">Admin Email:</span>
                  <span className={config.config.adminEmail.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                    {config.config.adminEmail}
                  </span>
                  
                  <span className="font-medium">Domain:</span>
                  <span className={config.config.resendDomain.includes('❌') ? 'text-yellow-600' : 'text-green-600'}>
                    {config.config.resendDomain}
                  </span>
                </div>

                {config.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {config.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Next Steps:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {config.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-red-600">Failed to load configuration</div>
            )}
          </CardContent>
        </Card>

        {/* Test Email Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Email Functionality</CardTitle>
            <CardDescription>
              Send test emails to verify your setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="contact">Contact Form Notification</SelectItem>
                  <SelectItem value="weekly">Weekly Progress Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendTestEmail} 
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Test Email'}
            </Button>

            <Button 
              onClick={checkConfig} 
              variant="outline"
              className="w-full"
            >
              Refresh Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
