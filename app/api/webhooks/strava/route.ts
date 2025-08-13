import { NextRequest } from 'next/server';
import { syncStravaActivities } from '@/lib/strava/sync-activities';
import { createClient } from '@/lib/supabase/server';

// Strava webhook verification
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Verify the webhook subscription
  if (
    mode === 'subscribe' &&
    token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log('✅ Strava webhook verified');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// Handle incoming webhooks from Strava
export async function POST(request: NextRequest) {
  const webhookId = Math.random().toString(36).substr(2, 9);

  try {
    console.log(
      `🔔 [${webhookId}] Webhook received from ${request.headers.get('user-agent')}`
    );

    const event = await request.json();

    console.log(`📬 [${webhookId}] Strava webhook payload:`, {
      object_type: event.object_type,
      object_id: event.object_id,
      aspect_type: event.aspect_type,
      owner_id: event.owner_id,
      subscription_id: event.subscription_id,
      event_time: event.event_time,
      updates: event.updates,
    });

    // Validate webhook structure
    if (!event.object_type || !event.owner_id) {
      console.error(
        `❌ [${webhookId}] Invalid webhook payload - missing required fields`
      );
      return new Response('Invalid webhook payload', { status: 400 });
    }

    // Process different event types
    if (event.object_type === 'activity') {
      console.log(`🏃 [${webhookId}] Processing activity event`);
      await handleActivityEvent(event, webhookId);
    } else if (event.object_type === 'athlete') {
      console.log(`👤 [${webhookId}] Processing athlete event`);
      await handleAthleteEvent(event, webhookId);
    } else {
      console.log(`⚠️ [${webhookId}] Unknown event type: ${event.object_type}`);
    }

    console.log(`✅ [${webhookId}] Webhook processed successfully`);
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error(`❌ [${webhookId}] Webhook processing error:`, error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleActivityEvent(
  event: { aspect_type: string; owner_id: number; object_id: number },
  webhookId: string = 'unknown'
) {
  const { aspect_type, owner_id, object_id } = event;

  try {
    const supabase = await createClient();

    // Find user by Strava athlete ID
    const { data: tokens } = await supabase
      .from('strava_tokens')
      .select('user_id')
      .eq('strava_athlete_id', owner_id)
      .single();

    if (!tokens) {
      console.log(
        `⚠️ [${webhookId}] No user found for Strava athlete ID: ${owner_id}`
      );
      return;
    }

    switch (aspect_type) {
      case 'create':
        console.log(
          `🏃 [${webhookId}] New activity ${object_id} for user ${tokens.user_id}`
        );
        // Sync recent activities to capture the new one
        const createResult = await syncStravaActivities({
          userId: tokens.user_id,
          syncType: 'quick',
          forceRefresh: false,
        });
        console.log(`📊 [${webhookId}] Create sync result:`, {
          success: createResult.success,
          activitiesSynced: createResult.activitiesSynced,
        });
        break;

      case 'update':
        console.log(
          `📝 [${webhookId}] Activity ${object_id} updated for user ${tokens.user_id}`
        );
        // Re-sync to get updated activity data
        const updateResult = await syncStravaActivities({
          userId: tokens.user_id,
          syncType: 'quick',
          forceRefresh: false,
        });
        console.log(`📊 [${webhookId}] Update sync result:`, {
          success: updateResult.success,
          activitiesSynced: updateResult.activitiesSynced,
        });
        break;

      case 'delete':
        console.log(
          `🗑️ [${webhookId}] Activity ${object_id} deleted for user ${tokens.user_id}`
        );
        // Remove from our database
        const { error: deleteError } = await supabase
          .from('activities')
          .delete()
          .eq('user_id', tokens.user_id)
          .eq('strava_activity_id', object_id);

        if (deleteError) {
          console.error(
            `❌ [${webhookId}] Failed to delete activity:`,
            deleteError
          );
        } else {
          console.log(
            `✅ [${webhookId}] Activity ${object_id} deleted from database`
          );
        }
        break;
    }
  } catch (error) {
    console.error('Error handling activity event:', error);
  }
}

async function handleAthleteEvent(
  event: {
    aspect_type: string;
    owner_id: number;
    updates?: { authorized?: string };
  },
  webhookId: string = 'unknown'
) {
  const { aspect_type, owner_id } = event;

  if (aspect_type === 'update' && event.updates?.authorized === 'false') {
    console.log(`🚫 [${webhookId}] User ${owner_id} revoked access`);

    // Remove their tokens
    const supabase = await createClient();
    const { error } = await supabase
      .from('strava_tokens')
      .delete()
      .eq('strava_athlete_id', owner_id);

    if (error) {
      console.error(`❌ [${webhookId}] Failed to remove tokens:`, error);
    } else {
      console.log(
        `✅ [${webhookId}] Tokens removed for deauthorized user ${owner_id}`
      );
    }
  }
}
