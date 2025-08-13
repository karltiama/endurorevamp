# Automatic Sync Testing Guide

## 🧪 **Testing Overview**

This guide provides comprehensive testing strategies for your automatic Strava sync functionality. We'll test webhooks, background sync, token management, and real-world scenarios.

## 🛠 **Testing Tools Available**

### **1. Testing Dashboard** (`/test-automatic-sync`)

- Interactive UI for testing all sync functionality
- Webhook simulation tools
- Sync status monitoring
- Real-time test results

### **2. API Endpoints for Testing**

- `POST /api/test/webhook-simulator` - Simulate webhook events
- `GET /api/test/sync-status` - Get detailed sync status
- `POST /api/sync/background` - Trigger background sync
- `GET /api/webhooks/setup` - Check webhook subscription status

### **3. Enhanced Logging**

- Webhook events logged with unique IDs
- Detailed sync result tracking
- Error tracking and debugging

## 📋 **Testing Checklist**

### **Phase 1: Setup Verification**

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Strava connection active
- [ ] App publicly accessible (for webhooks)

### **Phase 2: Webhook Testing**

- [ ] Webhook subscription created
- [ ] Webhook verification endpoint responds correctly
- [ ] Simulated webhook events processed
- [ ] Real webhook events received (manual Strava activity)

### **Phase 3: Background Sync Testing**

- [ ] Background sync API accessible
- [ ] Sync processes users correctly
- [ ] Rate limiting respected
- [ ] Error handling works

### **Phase 4: Integration Testing**

- [ ] Token refresh during sync
- [ ] Activity deduplication
- [ ] Error recovery
- [ ] Performance under load

## 🎯 **Step-by-Step Testing Procedures**

### **Test 1: Webhook Verification Setup**

```bash
# 1. Create webhook subscription
curl -X POST "https://yourdomain.com/api/webhooks/setup"

# 2. Verify subscription exists
curl "https://yourdomain.com/api/webhooks/setup"

# Expected response: { "hasActiveWebhook": true, "subscriptions": [...] }
```

### **Test 2: Webhook Event Simulation**

```bash
# Simulate new activity webhook
curl -X POST "https://yourdomain.com/api/test/webhook-simulator" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "activity",
    "aspectType": "create",
    "ownerID": "YOUR_STRAVA_ATHLETE_ID"
  }'

# Check your server logs for webhook processing messages
# Look for: 🔔 [webhookId] Webhook received from...
```

### **Test 3: Background Sync Validation**

```bash
# Trigger background sync
curl -X POST "https://yourdomain.com/api/sync/background" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "syncType": "quick",
    "maxUsers": 10,
    "skipRecentlySynced": false
  }'

# Expected response: { "success": true, "stats": { ... } }
```

### **Test 4: Real-World Activity Test**

1. **Complete an activity on Strava** (run, bike, etc.)
2. **Wait 1-2 minutes** for webhook delivery
3. **Check your app** for the new activity
4. **If not appeared**, check logs and trigger manual sync

### **Test 5: Token Refresh Validation**

```bash
# Check current token status
curl "https://yourdomain.com/api/test/sync-status"

# Look for tokenExpiresIn field
# If < 3600 seconds (1 hour), token will refresh on next sync
```

## 🔍 **Debugging Common Issues**

### **Webhook Not Received**

**Symptoms:**

- Completed Strava activity doesn't appear in app
- No webhook logs in server

**Debug Steps:**

1. Check webhook subscription status: `GET /api/webhooks/setup`
2. Verify app URL is publicly accessible
3. Test with webhook simulator first
4. Check Strava webhook delivery status (if available)

**Fix:**

```bash
# Re-create webhook subscription
curl -X DELETE "https://yourdomain.com/api/webhooks/setup"
curl -X POST "https://yourdomain.com/api/webhooks/setup"
```

### **Background Sync Failing**

**Symptoms:**

- Manual sync works, background sync fails
- High error count in sync stats

**Debug Steps:**

1. Check API key: `echo $BACKGROUND_SYNC_API_KEY`
2. Test sync endpoint directly
3. Review user token status
4. Check rate limits

**Fix:**

```bash
# Test individual user sync
curl -X POST "https://yourdomain.com/api/strava/sync" \
  -H "Content-Type: application/json" \
  -d '{"syncType": "quick"}'
```

### **Token Refresh Issues**

**Symptoms:**

- 401 unauthorized errors
- Users need to reconnect frequently

**Debug Steps:**

1. Check token expiration: `GET /api/test/sync-status`
2. Verify refresh token exists
3. Test manual refresh: `PUT /api/auth/strava/token`

**Fix:**

- User must re-authorize Strava connection
- Check for token storage issues

## 📊 **Performance Testing**

### **Load Testing Webhooks**

```bash
# Simulate multiple concurrent webhooks
for i in {1..10}; do
  curl -X POST "https://yourdomain.com/api/test/webhook-simulator" \
    -H "Content-Type: application/json" \
    -d '{"eventType": "activity", "aspectType": "create", "ownerID": "12345"}' &
done
wait

# Check logs for processing times and errors
```

### **Background Sync Performance**

```bash
# Test with larger user batch
curl -X POST "https://yourdomain.com/api/sync/background" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "syncType": "quick",
    "maxUsers": 100,
    "delayBetweenUsers": 100
  }'

# Monitor response time and success rate
```

## 🎛 **Monitoring in Production**

### **Key Metrics to Track**

1. **Webhook Delivery Rate**
   - Expected: >95% delivery success
   - Monitor: Server logs for webhook receipts

2. **Background Sync Success Rate**
   - Expected: >90% user sync success
   - Monitor: Sync stats API response

3. **Token Refresh Rate**
   - Expected: Automatic refresh before expiration
   - Monitor: Token expiration times

4. **Sync Latency**
   - Expected: Activities appear within 2-5 minutes
   - Monitor: Time between Strava activity and app appearance

### **Alerting Setup**

```bash
# Example monitoring script (run every 15 minutes)
#!/bin/bash

# Check webhook subscription status
WEBHOOK_STATUS=$(curl -s "https://yourdomain.com/api/webhooks/setup" | jq -r '.hasActiveWebhook')

if [ "$WEBHOOK_STATUS" != "true" ]; then
  echo "ALERT: Webhook subscription is inactive!"
  # Send notification (email, Slack, etc.)
fi

# Check sync statistics
SYNC_STATS=$(curl -s "https://yourdomain.com/api/sync/background")
STALE_SYNCS=$(echo $SYNC_STATS | jq -r '.stats.staleSyncs')

if [ "$STALE_SYNCS" -gt 10 ]; then
  echo "ALERT: High number of stale syncs: $STALE_SYNCS"
  # Send notification
fi
```

## ✅ **Test Success Criteria**

### **Webhook Tests Pass When:**

- [ ] Subscription can be created/deleted
- [ ] Verification endpoint responds correctly
- [ ] Simulated events process without errors
- [ ] Real Strava activities trigger webhooks
- [ ] Webhook logs show successful processing

### **Background Sync Tests Pass When:**

- [ ] API responds with success status
- [ ] Users are processed within rate limits
- [ ] Failed users don't stop batch processing
- [ ] Sync statistics are accurate
- [ ] Last sync timestamps are updated

### **Integration Tests Pass When:**

- [ ] New activities appear within 5 minutes
- [ ] Token refresh happens automatically
- [ ] Activity updates are reflected
- [ ] Deleted activities are removed
- [ ] User deauthorization is handled

## 🚀 **Next Steps After Testing**

1. **Deploy to Production**
   - Ensure all tests pass in staging
   - Set up monitoring and alerting
   - Configure cron jobs for background sync

2. **Monitor Initial Performance**
   - Watch webhook delivery rates
   - Monitor sync success rates
   - Check user experience metrics

3. **Optimize Based on Data**
   - Adjust sync frequency based on usage
   - Fine-tune rate limiting
   - Optimize error handling

---

## 🎯 **Quick Test Summary**

**To quickly verify everything is working:**

1. Go to `/test-automatic-sync`
2. Set up webhook subscription
3. Run "Simulate New Activity" test
4. Check results for success
5. Complete a real Strava activity
6. Verify it appears in your app within 2-5 minutes

If all steps pass, your automatic sync is working correctly! 🎉
