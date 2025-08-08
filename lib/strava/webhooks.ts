/**
 * Strava Webhook Management
 * 
 * This module handles webhook subscription management for real-time
 * activity notifications from Strava.
 */

interface WebhookSubscription {
  id: number
  callback_url: string
  created_at: string
  updated_at: string
}

interface CreateSubscriptionResponse {
  id: number
}

export class StravaWebhooks {
  private static readonly WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/strava`
  private static readonly VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN

  /**
   * Create a webhook subscription with Strava
   */
  static async createSubscription(): Promise<CreateSubscriptionResponse | null> {
    try {
      const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          callback_url: this.WEBHOOK_URL,
          verify_token: this.VERIFY_TOKEN,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create webhook subscription: ${error}`)
      }

      const subscription = await response.json()
      console.log('✅ Webhook subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('❌ Error creating webhook subscription:', error)
      return null
    }
  }

  /**
   * List all webhook subscriptions
   */
  static async listSubscriptions(): Promise<WebhookSubscription[]> {
    try {
      const response = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to list subscriptions: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error listing webhook subscriptions:', error)
      return []
    }
  }

  /**
   * Delete a webhook subscription
   */
  static async deleteSubscription(subscriptionId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        console.log('✅ Webhook subscription deleted:', subscriptionId)
        return true
      } else {
        console.error('❌ Failed to delete subscription:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('❌ Error deleting webhook subscription:', error)
      return false
    }
  }

  /**
   * Setup webhook subscription (creates if none exists)
   */
  static async setupWebhook(): Promise<boolean> {
    try {
      // Check if subscription already exists
      const subscriptions = await this.listSubscriptions()
      
      if (subscriptions.length > 0) {
        console.log('✅ Webhook subscription already exists')
        return true
      }

      // Create new subscription
      const result = await this.createSubscription()
      return result !== null
    } catch (error) {
      console.error('❌ Error setting up webhook:', error)
      return false
    }
  }

  /**
   * Clean up all webhook subscriptions
   */
  static async cleanupWebhooks(): Promise<void> {
    try {
      const subscriptions = await this.listSubscriptions()
      
      for (const subscription of subscriptions) {
        await this.deleteSubscription(subscription.id)
      }
    } catch (error) {
      console.error('❌ Error cleaning up webhooks:', error)
    }
  }
}

/**
 * Webhook event types from Strava
 */
export interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete'
  object_id: number
  aspect_type: 'create' | 'update' | 'delete'
  updates?: {
    title?: string
    type?: string
    private?: string
    authorized?: string
  }
  owner_id: number
  subscription_id: number
  event_time: number
}

/**
 * Utility function to validate webhook events
 */
export function isValidWebhookEvent(event: Record<string, unknown>): event is StravaWebhookEvent {
  return (
    event &&
    typeof event.object_type === 'string' &&
    typeof event.object_id === 'number' &&
    typeof event.aspect_type === 'string' &&
    typeof event.owner_id === 'number' &&
    typeof event.subscription_id === 'number' &&
    typeof event.event_time === 'number'
  )
}
