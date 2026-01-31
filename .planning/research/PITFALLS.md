# Domain Pitfalls: WhatsApp Notification System Production Deployment

**Domain:** WhatsApp Business API notification system on Vercel
**Researched:** 2026-01-31
**Confidence:** HIGH (verified with official documentation and multiple authoritative sources)

---

## Critical Pitfalls

Mistakes that cause service outages, account suspension, or major rewrites.

---

### Pitfall 1: Missing WABA-to-App Webhook Subscription

**What goes wrong:** Webhooks appear configured correctly but silently fail to deliver messages. You receive no error - messages simply never arrive at your endpoint. This is an undocumented gap in Meta's developer experience.

**Why it happens:** Developers configure the webhook URL in Meta's dashboard but miss the required WABA-to-App subscription step. The webhook verification passes, but actual message events are never sent.

**Consequences:**
- Complete failure to receive incoming messages
- No error messages or debugging information
- Application appears broken with no obvious cause
- Days lost debugging the wrong components

**Warning signs:**
- Webhook verification succeeds but no events arrive
- Logs show no incoming webhook requests
- Test messages to your WhatsApp number produce nothing

**Prevention:**
1. After webhook configuration, explicitly POST to `/{WABA_ID}/subscribed_apps` using Graph API Explorer
2. Verify subscription exists by GET to same endpoint
3. Test with actual message, not just webhook verification

**Detection:** Send a test message and check server logs within 30 seconds. No log entry = subscription missing.

**Phase to address:** Infrastructure setup phase (before going live)

**Sources:**
- [The Shadow Delivery Mystery - Medium](https://medium.com/@siri.prasad/the-shadow-delivery-mystery-why-your-whatsapp-cloud-api-webhooks-silently-fail-and-how-to-fix-2c7383fec59f)

---

### Pitfall 2: Missing Webhook Signature Verification

**What goes wrong:** Your webhook endpoint accepts any POST request without verifying it came from Meta. Attackers can send fake webhook events to trigger notifications, extract data, or abuse your system.

**Why it happens:** Developers skip signature verification to simplify implementation or because they don't realize it's necessary. Meta signs all webhook payloads with `X-Hub-Signature-256` header but doesn't enforce verification.

**Consequences:**
- Security vulnerability allowing spoofed webhook events
- Potential data breaches
- Abuse of your messaging system by attackers
- Meta compliance issues

**Warning signs:**
- No signature check in webhook handler code
- Using `express.json()` middleware before signature verification
- Webhook endpoint has no authentication at all

**Prevention:**
```typescript
// CORRECT: Verify signature BEFORE parsing body
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const expectedSignature = "sha256=" +
    crypto.createHmac("sha256", process.env.META_APP_SECRET)
      .update(req.body)
      .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).send("Invalid signature");
  }
  // Now safe to parse and process
});
```

**Detection:** Review webhook handler code for signature verification. Test by sending a request with invalid/missing signature - it should be rejected.

**Phase to address:** Infrastructure setup phase (before any webhook handling)

**Sources:**
- [How to Implement SHA256 Webhook Signature Verification - Hookdeck](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)
- [WhatsApp Webhook Authentication - MojoAuth](https://mojoauth.com/ciam-qna/how-to-handle-whatsapp-webhook-authentication-and-validation)

---

### Pitfall 3: Unsecured Vercel Cron Job Endpoints

**What goes wrong:** Your cron job endpoint (e.g., `/api/cron`) is publicly accessible. Anyone can trigger your scheduled tasks by visiting the URL directly, leading to abuse, duplicate operations, or resource exhaustion.

**Why it happens:** Cron jobs are just HTTP endpoints. Without explicit security, they respond to any request.

**Consequences:**
- Unauthorized triggering of notifications
- Duplicate message sends
- Resource exhaustion / billing spikes
- Data corruption from concurrent execution

**Warning signs:**
- Cron endpoint returns 200 when accessed manually without auth
- No `CRON_SECRET` environment variable configured
- No authorization header check in handler

**Prevention:**
```typescript
// app/api/cron/route.ts
export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Proceed with cron job logic
}
```

1. Add `CRON_SECRET` environment variable in Vercel (16+ character random string)
2. Vercel automatically sends this as `Authorization: Bearer {CRON_SECRET}` header
3. Always verify the header in your handler

**Detection:** Try to access your cron endpoint URL directly in browser - should return 401 Unauthorized.

**Phase to address:** Infrastructure setup phase

**Sources:**
- [Vercel Cron Jobs - Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [How to Secure Vercel Cron Job routes in Next.js 14](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)

---

### Pitfall 4: Account Suspension from Quality Score Degradation

**What goes wrong:** Meta suspends your WhatsApp Business Account or restricts messaging due to low quality score. Templates get disabled, messaging limits drop, and you may be unable to send any messages.

**Why it happens:** Users block or report your messages as spam. This can happen from:
- Sending to users who didn't explicitly opt in
- Sending too frequently
- Sending irrelevant or poorly timed messages
- Vague or promotional template content

**Consequences:**
- Template disabling (can't send business-initiated messages)
- Messaging limits reduced to 250/day or lower
- Complete account suspension in severe cases
- Weeks to recover quality score

**Warning signs:**
- Quality rating dropping from Green to Yellow to Red
- Users blocking your number
- Templates moving from "High" to "Medium" to "Low" quality
- Message delivery rate declining

**Prevention:**
1. **Explicit opt-in only:** Never message users who haven't explicitly opted in for WhatsApp
2. **Relevance first:** Only send messages users actually want (prayer times for a mosque, not promotions)
3. **Easy opt-out:** Provide clear unsubscribe option in every message
4. **Frequency limits:** Don't send more than users expect (once per prayer time change, not daily blasts)
5. **Monitor quality:** Check Quality Rating in Meta Business Manager weekly

**Detection:** Monitor Quality Rating in Meta Business Suite. Any drop from Green requires immediate investigation.

**Phase to address:** Pre-launch compliance phase + ongoing monitoring

**Sources:**
- [WhatsApp Business API Compliance 2026](https://gmcsco.com/your-simple-guide-to-whatsapp-api-compliance-2026/)
- [Scale WhatsApp Cloud API - Throughput Limits](https://www.wuseller.com/whatsapp-business-knowledge-hub/scale-whatsapp-cloud-api-master-throughput-limits-upgrades-2026/)

---

### Pitfall 5: Meta Business Verification Rejection Loop

**What goes wrong:** Meta repeatedly rejects your business verification, blocking access to higher messaging limits and template approvals. You're stuck in a loop of submission and rejection.

**Why it happens:**
- Business name doesn't match exactly across documents, website, and Meta Business Manager
- Documents are unclear, expired, or wrong type
- Display name is generic or doesn't match business branding
- Two-step verification not enabled

**Consequences:**
- Stuck at 250-1000 message limit forever
- Can't get templates approved for production use
- Business appears untrustworthy to Meta
- Weeks of delays

**Warning signs:**
- Verification pending for more than 14 days
- Rejection emails citing "mismatched information"
- Display name approved then rejected on edit
- Documents requested multiple times

**Prevention:**
1. **Exact name matching:** Business name on legal documents = Meta Business Manager = website
2. **Clear documents:** High-resolution, all text visible, not expired, official government documents
3. **Display name strategy:** Include actual business name (e.g., "Masjid Al-Noor Notifications" not "Prayer Bot")
4. **Enable 2FA:** Required for verification - enable before submitting
5. **Website consistency:** Ensure your website shows same business name, address, contact info

**Detection:** Verification taking longer than 7 days or any rejection email.

**Phase to address:** Pre-launch compliance phase (start this FIRST - it can take weeks)

**Sources:**
- [Meta Business Verification - respond.io](https://respond.io/help/whatsapp/meta-business-verification)
- [WhatsApp Business API Guide 2026](https://www.wuseller.com/whatsapp-business-knowledge-hub/whatsapp-business-api-guide-2026-setup-verification/)

---

## Moderate Pitfalls

Mistakes that cause delays, degraded service, or technical debt.

---

### Pitfall 6: Rate Limit (Error 130429) Without Proper Handling

**What goes wrong:** Application crashes or drops messages when hitting WhatsApp's throughput limits (80 messages/second default). Error 130429 returned but not handled gracefully.

**Why it happens:** Developers don't implement rate limiting on their side, assuming WhatsApp handles everything. When sending notifications to many users simultaneously (e.g., prayer time announcement), you exceed limits.

**Consequences:**
- Messages silently dropped
- Application errors visible to admins
- Inconsistent delivery (some users get messages, some don't)
- Poor user experience

**Warning signs:**
- Error 130429 in logs
- Message delivery inconsistencies during high-volume sends
- Complaints from users not receiving notifications

**Prevention:**
```typescript
// Implement client-side rate limiting with queue
const queue = new PQueue({
  concurrency: 10,  // Max concurrent requests
  interval: 1000,   // Per second
  intervalCap: 50   // Max 50 per second (below 80 limit)
});

// Add exponential backoff for 429 errors
async function sendWithRetry(message, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await sendWhatsAppMessage(message);
    } catch (err) {
      if (err.code === 130429 && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000 + Math.random() * 1000);
        continue;
      }
      throw err;
    }
  }
}
```

**Detection:** Monitor for error code 130429 in logs. Test high-volume sends in staging.

**Phase to address:** Notification sending implementation phase

**Sources:**
- [WhatsApp API Rate Limits - WATI](https://www.wati.io/en/blog/whatsapp-business-api/whatsapp-api-rate-limits/)
- [Navigate Meta's WhatsApp Rate Limits - Fyno](https://www.fyno.io/blog/whatsapp-rate-limits-for-developers-a-guide-to-smooth-sailing-clycvmek2006zuj1oof8uiktv)

---

### Pitfall 7: Vercel Cron Job Timeout on Bulk Sends

**What goes wrong:** Cron job that sends notifications times out before completing. Some users get messages, others don't. No retry happens automatically.

**Why it happens:** Vercel serverless functions have 10-60 second timeout limits. Sending hundreds of WhatsApp messages sequentially exceeds this.

**Consequences:**
- Partial notification delivery
- No automatic retry for failed portion
- Inconsistent user experience
- Debugging difficulty (which users got messages?)

**Warning signs:**
- Cron job logs showing timeout errors
- Execution time approaching limit
- Users reporting missed notifications inconsistently

**Prevention:**
1. **Batch processing:** Split large sends into smaller chunks
2. **Async queue:** Push to a queue (e.g., Vercel KV, external queue) and process in separate invocations
3. **Database tracking:** Mark each send attempt with status for retry
4. **Consider Fluid Compute:** Enables up to 800 second execution on Pro plan

```typescript
// Instead of sending all at once
// BAD:
for (const user of allUsers) {
  await sendMessage(user); // Will timeout
}

// GOOD: Batch and track
const BATCH_SIZE = 50;
const batch = users.slice(0, BATCH_SIZE);
for (const user of batch) {
  await sendMessage(user);
  await markSent(user.id);
}
// Next cron invocation picks up where this left off
```

**Detection:** Monitor cron execution times. Alert if approaching 80% of timeout limit.

**Phase to address:** Notification scheduling implementation phase

**Sources:**
- [Vercel Cron Jobs - Managing](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Troubleshooting Vercel Cron Jobs](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs)
- [Vercel Backend Limitations - Northflank](https://northflank.com/blog/vercel-backend-limitations)

---

### Pitfall 8: 24-Hour Window Misunderstanding

**What goes wrong:** You try to send messages outside the 24-hour customer service window without using approved templates, and messages fail silently or return errors.

**Why it happens:** Developers don't understand WhatsApp's messaging model:
- **Inside 24-hour window:** Can send any message type (user messaged you within 24 hours)
- **Outside window:** ONLY pre-approved templates allowed

**Consequences:**
- Failed message sends with confusing errors
- User complaints about not receiving messages
- Wasted API calls

**Warning signs:**
- Error codes related to template requirements
- Messages failing for users who haven't recently interacted
- Different behavior between active and inactive users

**Prevention:**
1. **Always use templates for business-initiated messages:** Prayer time notifications are business-initiated
2. **Track user's last message timestamp:** Know when you're inside/outside window
3. **Design templates for your use case:** Create templates specifically for notifications

```typescript
// For a notification system, ALWAYS use templates
// Templates are the only reliable way to reach users
const templateMessage = {
  messaging_product: "whatsapp",
  to: phoneNumber,
  type: "template",
  template: {
    name: "prayer_time_notification",
    language: { code: "en" },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: prayerName },
          { type: "text", text: prayerTime }
        ]
      }
    ]
  }
};
```

**Detection:** Track message failure rates by whether user was inside/outside window.

**Phase to address:** Template design and approval phase

**Sources:**
- [WhatsApp 24-Hour Rule - Polser](https://blog.polser.io/what-is-the-whatsapp-24-hour-rule-and-how-to-bypass-it/)
- [24-Hour Conversation Window - ActiveCampaign](https://help.activecampaign.com/hc/en-us/articles/20679458055964-Understanding-the-24-hour-conversation-window-in-WhatsApp-messaging)

---

### Pitfall 9: Template Rejection Loop

**What goes wrong:** Templates get rejected repeatedly by Meta with vague feedback. You're blocked from sending any business-initiated messages until approved.

**Why it happens:** Common template mistakes:
- Variables at start/end of message body
- Non-sequential variable numbering ({{1}}, {{3}} missing {{2}})
- Category mismatch (marking marketing as utility)
- URL domains not matching verified business
- Grammatical errors or "spammy" language
- Missing sample values for variables

**Consequences:**
- Can't send notifications until templates approved
- Days-to-weeks delay per rejection/resubmission cycle
- Must create new template name for each attempt (can't edit rejected)

**Warning signs:**
- Template status "Rejected" in Meta Business Manager
- Vague rejection reasons like "Policy violation"
- Templates stuck in "Pending" for days

**Prevention:**
Template approval checklist:
1. **Variables:** Sequential ({{1}}, {{2}}, {{3}}), not at start/end, with sample values
2. **Category:** Match actual use - prayer notifications are "Utility", not "Marketing"
3. **URLs:** Only use your verified domain
4. **Language:** Match selected language exactly, no mixed languages
5. **Tone:** Clear, professional, no urgency words ("Act now!", "Limited time!")
6. **Media:** If using images, include high-res sample (500x500 minimum)

Example good template:
```
Name: prayer_time_update
Category: UTILITY
Language: English
Body: "Assalamu Alaikum! {{1}} prayer time at {{2}} has been updated to {{3}}. Reply STOP to unsubscribe."
Sample: "Fajr", "Masjid Al-Noor", "5:30 AM"
```

**Detection:** Check template status in Meta Business Suite daily during approval phase.

**Phase to address:** Template design phase (start early, expect iterations)

**Sources:**
- [WhatsApp Template Approval Checklist - WUSeller](https://www.wuseller.com/blog/whatsapp-template-approval-checklist-27-reasons-meta-rejects-messages/)
- [How to Fix WhatsApp Template Rejection Errors](https://www.wuseller.com/whatsapp-business-knowledge-hub/how-to-fix-whatsapp-template-rejection-errors/)

---

### Pitfall 10: Cron Job Concurrency Race Conditions

**What goes wrong:** Cron job runs longer than the interval between invocations. Two instances run simultaneously, causing duplicate notifications or data corruption.

**Why it happens:** No locking mechanism. Vercel will start a new cron invocation even if previous one is still running.

**Consequences:**
- Duplicate messages sent to users
- Database race conditions
- Data corruption
- User complaints about spam

**Warning signs:**
- Users receiving duplicate notifications
- Database records showing overlapping timestamps
- Cron execution time exceeding interval

**Prevention:**
1. **Distributed lock:** Use Redis lock or database flag
2. **Idempotency keys:** Design operations to be safe when run twice
3. **Execution time < interval:** Ensure job completes before next scheduled run

```typescript
// Using a simple database lock
async function runCronWithLock() {
  const lockId = "prayer_notification_cron";

  // Try to acquire lock (returns false if already locked)
  const acquired = await acquireLock(lockId, 60); // 60 second TTL
  if (!acquired) {
    console.log("Previous cron still running, skipping");
    return;
  }

  try {
    await sendNotifications();
  } finally {
    await releaseLock(lockId);
  }
}
```

**Detection:** Log start/end times of cron jobs. Alert on overlapping executions.

**Phase to address:** Notification scheduling implementation phase

**Sources:**
- [Vercel Cron Jobs - Concurrency Control](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

---

## Minor Pitfalls

Mistakes that cause annoyance but are recoverable.

---

### Pitfall 11: Webhook Endpoint Caching

**What goes wrong:** Webhook handler returns cached response instead of processing each event. Messages are received but not acted upon.

**Why it happens:** Next.js App Router caches route handlers by default. Webhook endpoint returns cached "OK" without running the actual handler code.

**Consequences:**
- Webhooks appear to work (return 200) but events aren't processed
- Logs show no activity despite incoming messages
- Difficult to debug (looks like it's working)

**Warning signs:**
- Webhook returns 200 but no logs appear
- Same response regardless of payload
- Works in development, fails in production

**Prevention:**
```typescript
// app/api/webhook/route.ts
export const dynamic = 'force-dynamic'; // Disable caching
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Handler code here
}
```

**Detection:** Send test webhooks and verify unique responses/logs for each.

**Phase to address:** Webhook implementation phase

**Sources:**
- [Troubleshooting Vercel Cron Jobs](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs)

---

### Pitfall 12: Vercel Cron Trailing Slash Redirect

**What goes wrong:** Cron job silently fails because the path redirects due to trailing slash configuration. Vercel doesn't follow redirects for cron jobs.

**Why it happens:** Project has `trailingSlash: true` in Next.js config, but cron path doesn't include trailing slash (or vice versa). Redirect returns 308 which Vercel treats as final response.

**Consequences:**
- Cron job never executes
- No error in Vercel dashboard (shows 308 as success)
- Notifications never sent

**Warning signs:**
- Cron job shows 308 status in logs
- Job completes instantly with no processing
- Works when called manually with correct URL

**Prevention:**
1. Check `next.config.js` for `trailingSlash` setting
2. Match cron path in `vercel.json` to that setting
3. Test cron URL manually before deploying

```json
// If trailingSlash: true in next.config.js
{
  "crons": [
    {
      "path": "/api/cron/",  // Note trailing slash
      "schedule": "0 * * * *"
    }
  ]
}
```

**Detection:** Check cron job response status in Vercel dashboard. 308/301/302 = redirect problem.

**Phase to address:** Infrastructure setup phase

**Sources:**
- [Troubleshooting Vercel Cron Jobs](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs)

---

### Pitfall 13: Access Token Expiration

**What goes wrong:** WhatsApp API calls suddenly start failing with 401/authentication errors. Messages stop sending.

**Why it happens:** Using short-lived tokens that expired. User access tokens last ~60 days. System user tokens can be permanent but require setup.

**Consequences:**
- Service outage until token refreshed
- Manual intervention required
- Users miss notifications

**Warning signs:**
- Sudden spike in authentication errors
- Error code 190 (Invalid access token)
- Token approaching creation date + 60 days

**Prevention:**
1. **Use System User permanent tokens:** Create System User in Business Manager, generate permanent token
2. **Monitor token expiration:** Alert before expiration
3. **Implement token refresh:** If using user tokens, automate refresh

**Detection:** Monitor for authentication errors. Set calendar reminder for token expiration.

**Phase to address:** Initial API setup phase

**Sources:**
- [All Meta WhatsApp Cloud API Error Codes - Heltar](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)

---

### Pitfall 14: GDPR Opt-In Non-Compliance

**What goes wrong:** You message users without proper WhatsApp-specific consent. Users complain, quality score drops, and you may face regulatory issues.

**Why it happens:** Assuming email/SMS opt-in covers WhatsApp. GDPR requires explicit, specific consent for each channel.

**Consequences:**
- User complaints and blocks (quality score impact)
- Potential GDPR fines (up to 4% of revenue)
- Account restrictions from Meta

**Warning signs:**
- High block rate from users
- Complaints about unsolicited messages
- Using phone numbers without WhatsApp-specific consent

**Prevention:**
1. **Explicit WhatsApp opt-in:** "I agree to receive prayer time notifications via WhatsApp"
2. **Double opt-in:** Send confirmation message, user must respond to activate
3. **Record keeping:** Store when/how consent was given
4. **Easy opt-out:** Include "Reply STOP to unsubscribe" in every message

**Detection:** Track opt-in sources. Audit user list for proper consent records.

**Phase to address:** User management/subscription phase

**Sources:**
- [WhatsApp Business GDPR Compliance - heyData](https://heydata.eu/en/magazine/how-to-use-whats-app-for-business-while-staying-gdpr-compliant/)
- [WhatsApp Opt-In Rules Changes - Partoo](https://www.partoo.co/en/blog/whatsapp-business-opt-in-rules-changes/)

---

### Pitfall 15: Hobby Plan Cron Timing Inaccuracy

**What goes wrong:** Prayer time notifications sent at wrong time because Hobby plan cron jobs can trigger anywhere within the specified hour.

**Why it happens:** Vercel Hobby plan restriction - cron jobs may fire anytime within the hour, not at the exact minute. `0 5 * * *` could trigger at 5:47 AM.

**Consequences:**
- Fajr notification at 5:45 when prayer is at 5:15
- Users receive notifications after prayer time has passed
- Unreliable notification timing

**Warning signs:**
- On Hobby plan
- Cron job execution times vary widely
- Users complaining about late notifications

**Prevention:**
1. **Upgrade to Pro plan:** Exact minute timing guaranteed
2. **Design for latency:** If on Hobby, schedule cron well before needed time and use database to check actual send time
3. **External scheduler:** Use external service (e.g., cron-job.org) to call your endpoint at precise times

**Detection:** Log actual execution time vs scheduled time. Compare variance.

**Phase to address:** Infrastructure decision phase

**Sources:**
- [Vercel Cron Jobs - Usage and Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)

---

## Phase-Specific Warning Summary

| Phase | Likely Pitfall | Priority | Mitigation |
|-------|----------------|----------|------------|
| **Meta Business Setup** | Business verification rejection (#5) | CRITICAL | Start first, allow 2+ weeks, exact name matching |
| **Template Design** | Template rejection loop (#9) | HIGH | Follow checklist, expect iterations |
| **Webhook Setup** | Missing WABA subscription (#1) | CRITICAL | POST to subscribed_apps endpoint |
| **Webhook Security** | Missing signature verification (#2) | CRITICAL | Verify before parsing body |
| **Cron Setup** | Unsecured endpoints (#3) | CRITICAL | Implement CRON_SECRET |
| **Cron Setup** | Trailing slash redirect (#12) | MEDIUM | Match trailingSlash config |
| **Notification Sending** | Rate limiting (#6) | HIGH | Client-side queue + backoff |
| **Notification Sending** | Cron timeout (#7) | HIGH | Batch processing |
| **Notification Sending** | 24-hour window (#8) | MEDIUM | Always use templates |
| **Notification Scheduling** | Concurrency races (#10) | MEDIUM | Distributed lock |
| **User Management** | GDPR compliance (#14) | HIGH | Explicit WhatsApp opt-in |
| **Ongoing Operations** | Quality score (#4) | CRITICAL | Monitor weekly, easy opt-out |
| **Ongoing Operations** | Token expiration (#13) | MEDIUM | Use permanent system user token |

---

## Pre-Launch Checklist

Before going live, verify:

- [ ] Meta Business verification complete
- [ ] Templates approved for all notification types
- [ ] Webhook subscription confirmed (not just verification)
- [ ] Webhook signature verification implemented
- [ ] Cron endpoints secured with CRON_SECRET
- [ ] Rate limiting implemented in send logic
- [ ] Batch processing for bulk sends
- [ ] Quality score monitoring set up
- [ ] Explicit opt-in collection in place
- [ ] Opt-out mechanism working
- [ ] System user permanent token (not user token)
- [ ] Cron timing tested (especially on Hobby plan)

---

## Sources

### Official Documentation
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Jobs - Managing](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

### WhatsApp Cloud API
- [All Meta WhatsApp Cloud API Error Codes - Heltar](https://www.heltar.com/blogs/all-meta-error-codes-explained-along-with-complete-troubleshooting-guide-2025-cm69x5e0k000710xtwup66500)
- [WhatsApp API Rate Limits - WATI](https://www.wati.io/en/blog/whatsapp-business-api/whatsapp-api-rate-limits/)
- [WhatsApp Template Approval Checklist - WUSeller](https://www.wuseller.com/blog/whatsapp-template-approval-checklist-27-reasons-meta-rejects-messages/)
- [WhatsApp Business API Guide 2026](https://www.wuseller.com/whatsapp-business-knowledge-hub/whatsapp-business-api-guide-2026-setup-verification/)

### Webhook Security
- [The Shadow Delivery Mystery - Medium](https://medium.com/@siri.prasad/the-shadow-delivery-mystery-why-your-whatsapp-cloud-api-webhooks-silently-fail-and-how-to-fix-2c7383fec59f)
- [How to Implement SHA256 Webhook Signature Verification - Hookdeck](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)

### Compliance
- [WhatsApp Business GDPR Compliance - heyData](https://heydata.eu/en/magazine/how-to-use-whats-app-for-business-while-staying-gdpr-compliant/)
- [Meta Business Verification - respond.io](https://respond.io/help/whatsapp/meta-business-verification)

### Vercel Limitations
- [Troubleshooting Vercel Cron Jobs](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs)
- [Vercel Backend Limitations - Northflank](https://northflank.com/blog/vercel-backend-limitations)
