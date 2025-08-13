import { NextRequest, NextResponse } from 'next/server';

// Simulate webhook events for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventType = 'activity',
      aspectType = 'create',
      ownerID,
      objectID,
    } = body;

    if (!ownerID) {
      return NextResponse.json(
        { error: 'ownerID is required' },
        { status: 400 }
      );
    }

    // Create a mock webhook event payload
    const mockWebhookEvent = {
      object_type: eventType,
      object_id: objectID || Math.floor(Math.random() * 1000000),
      aspect_type: aspectType,
      updates:
        aspectType === 'update' ? { title: 'Updated Activity' } : undefined,
      owner_id: parseInt(ownerID),
      subscription_id: 12345,
      event_time: Math.floor(Date.now() / 1000),
    };

    console.log('🧪 Simulating webhook event:', mockWebhookEvent);

    // Send the simulated webhook to our actual webhook endpoint
    const webhookResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/strava`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockWebhookEvent),
      }
    );

    const webhookResult = await webhookResponse.text();

    return NextResponse.json({
      success: true,
      simulatedEvent: mockWebhookEvent,
      webhookResponse: {
        status: webhookResponse.status,
        body: webhookResult,
      },
      message: 'Webhook event simulated successfully',
    });
  } catch (error) {
    console.error('Webhook simulation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get webhook testing instructions
export async function GET() {
  return NextResponse.json({
    usage: {
      endpoint: '/api/test/webhook-simulator',
      method: 'POST',
      body: {
        eventType: 'activity | athlete',
        aspectType: 'create | update | delete',
        ownerID: 'strava_athlete_id (required)',
        objectID:
          'activity_id (optional, will generate random if not provided)',
      },
    },
    examples: [
      {
        description: 'Simulate new activity creation',
        payload: {
          eventType: 'activity',
          aspectType: 'create',
          ownerID: '12345678',
        },
      },
      {
        description: 'Simulate activity update',
        payload: {
          eventType: 'activity',
          aspectType: 'update',
          ownerID: '12345678',
          objectID: '987654321',
        },
      },
      {
        description: 'Simulate athlete deauthorization',
        payload: {
          eventType: 'athlete',
          aspectType: 'update',
          ownerID: '12345678',
        },
      },
    ],
  });
}
