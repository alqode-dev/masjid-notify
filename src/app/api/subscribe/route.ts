import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/web-push'
import { getSubscribeRateLimiter, getClientIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (optional - only if Upstash is configured)
    const rateLimiter = getSubscribeRateLimiter()
    if (rateLimiter) {
      const ip = getClientIP(request)
      const { success, limit, remaining, reset } = await rateLimiter.limit(ip)

      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          }
        )
      }
    }

    const body = await request.json()

    const {
      push_subscription,
      mosque_id,
      reminder_offset = 15,
      pref_daily_prayers = true,
      pref_jumuah = true,
      pref_ramadan = true,
      pref_nafl_salahs = false,
      pref_hadith = false,
      pref_announcements = true,
      user_agent = null,
    } = body

    // Validate required fields
    if (!push_subscription?.endpoint || !push_subscription?.keys?.p256dh || !push_subscription?.keys?.auth || !mosque_id) {
      return NextResponse.json(
        { error: 'Push subscription and mosque ID are required' },
        { status: 400 }
      )
    }

    // Validate push endpoint is a valid URL
    try {
      new URL(push_subscription.endpoint)
    } catch {
      return NextResponse.json(
        { error: 'Invalid push subscription endpoint' },
        { status: 400 }
      )
    }

    // Validate reminder_offset is one of the allowed values
    const validOffsets = [5, 10, 15, 30]
    if (!validOffsets.includes(reminder_offset)) {
      return NextResponse.json(
        { error: 'Invalid reminder offset. Must be 5, 10, 15, or 30 minutes.' },
        { status: 400 }
      )
    }

    // Get mosque details
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from('mosques')
      .select('id, name')
      .eq('id', mosque_id)
      .single()

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: 'Mosque not found' },
        { status: 404 }
      )
    }

    // Check if already subscribed (by push endpoint + mosque)
    const { data: existing } = await supabaseAdmin
      .from('subscribers')
      .select('id, status')
      .eq('push_endpoint', push_subscription.endpoint)
      .eq('mosque_id', mosque_id)
      .maybeSingle()

    let subscriberId: string

    if (existing) {
      // If previously unsubscribed, reactivate
      if (existing.status === 'unsubscribed') {
        const { error: updateError } = await supabaseAdmin
          .from('subscribers')
          .update({
            status: 'active',
            push_p256dh: push_subscription.keys.p256dh,
            push_auth: push_subscription.keys.auth,
            user_agent,
            pref_daily_prayers,
            pref_jumuah,
            pref_ramadan,
            pref_nafl_salahs,
            pref_hadith,
            pref_announcements,
            reminder_offset,
            subscribed_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error reactivating subscriber:', updateError)
          return NextResponse.json(
            { error: 'Failed to resubscribe' },
            { status: 500 }
          )
        }
        subscriberId = existing.id
      } else {
        // Already active - update push keys (might have changed) and return
        await supabaseAdmin
          .from('subscribers')
          .update({
            push_p256dh: push_subscription.keys.p256dh,
            push_auth: push_subscription.keys.auth,
            user_agent,
          })
          .eq('id', existing.id)

        return NextResponse.json({
          success: true,
          message: 'Already subscribed - push keys updated',
          subscriberId: existing.id,
        })
      }
    } else {
      // Create new subscriber
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('subscribers')
        .insert({
          push_endpoint: push_subscription.endpoint,
          push_p256dh: push_subscription.keys.p256dh,
          push_auth: push_subscription.keys.auth,
          user_agent,
          mosque_id,
          pref_daily_prayers,
          pref_jumuah,
          pref_ramadan,
          pref_nafl_salahs,
          pref_hadith,
          pref_announcements,
          reminder_offset,
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        console.error('Error creating subscriber:', insertError)
        return NextResponse.json(
          { error: 'Failed to subscribe' },
          { status: 500 }
        )
      }
      subscriberId = inserted.id
    }

    // Send welcome push notification
    const pushResult = await sendPushNotification(
      {
        endpoint: push_subscription.endpoint,
        keys: {
          p256dh: push_subscription.keys.p256dh,
          auth: push_subscription.keys.auth,
        },
      },
      {
        title: `Welcome to ${mosque.name}!`,
        body: "You'll receive prayer reminders and announcements. Tap to open the app.",
        icon: "/icon-192x192.png",
        tag: "welcome",
        url: "/",
      }
    )

    if (!pushResult.success) {
      console.error('Failed to send welcome push:', pushResult.error)
    }

    // Log the welcome message
    const welcomeContent = `Welcome to ${mosque.name}! You'll receive prayer reminders and announcements.`
    const { error: msgLogError } = await supabaseAdmin
      .from('messages')
      .insert({
        mosque_id,
        type: 'welcome',
        content: welcomeContent,
        sent_to_count: 1,
        status: pushResult.success ? 'sent' : 'failed',
      })

    if (msgLogError) {
      console.error('[subscribe] Failed to log welcome message:', msgLogError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed!',
      subscriberId,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
