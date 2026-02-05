import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTemplateMessage, WELCOME_TEMPLATE } from '@/lib/whatsapp'
import { normalizePhoneNumber, isValidSAPhoneNumber } from '@/lib/utils'
import { getSubscribeRateLimiter, getClientIP } from '@/lib/ratelimit'
import { previewTemplate } from '@/lib/whatsapp-templates'

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
      phone_number,
      mosque_id,
      reminder_offset = 15,
      pref_daily_prayers = true,
      pref_jumuah = true,
      pref_ramadan = true,
      pref_nafl_salahs = false,
      pref_hadith = false,
      pref_announcements = true,
    } = body

    // Validate required fields
    if (!phone_number || !mosque_id) {
      return NextResponse.json(
        { error: 'Phone number and mosque ID are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!isValidSAPhoneNumber(phone_number)) {
      return NextResponse.json(
        { error: 'Please enter a valid South African phone number' },
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

    // Normalize phone number to +27 format
    const formattedPhone = normalizePhoneNumber(phone_number)

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

    // Check if already subscribed
    const { data: existing } = await supabaseAdmin
      .from('subscribers')
      .select('id, status')
      .eq('phone_number', formattedPhone)
      .eq('mosque_id', mosque_id)
      .single()

    if (existing) {
      // If previously unsubscribed, reactivate
      if (existing.status === 'unsubscribed') {
        const { error: updateError } = await supabaseAdmin
          .from('subscribers')
          .update({
            status: 'active',
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
      } else {
        return NextResponse.json(
          { error: 'This number is already subscribed' },
          { status: 400 }
        )
      }
    } else {
      // Create new subscriber
      const { error: insertError } = await supabaseAdmin
        .from('subscribers')
        .insert({
          phone_number: formattedPhone,
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

      if (insertError) {
        console.error('Error creating subscriber:', insertError)
        return NextResponse.json(
          { error: 'Failed to subscribe' },
          { status: 500 }
        )
      }
    }

    // Send welcome message via WhatsApp using template
    const whatsappResult = await sendTemplateMessage(
      formattedPhone,
      WELCOME_TEMPLATE,
      [mosque.name]
    )

    if (!whatsappResult.success) {
      console.error('Failed to send WhatsApp message:', whatsappResult.error)
      // Don't fail the subscription, just log the error
    }

    // Generate message content for logging
    const welcomeMessage = previewTemplate(WELCOME_TEMPLATE, [mosque.name])

    // Log the welcome message
    const msgPayload = {
      mosque_id,
      type: 'welcome',
      content: welcomeMessage,
      sent_to_count: 1,
      status: whatsappResult.success ? 'sent' : 'failed',
    }
    const { error: msgLogError } = await supabaseAdmin
      .from('messages')
      .insert(msgPayload)

    if (msgLogError) {
      console.error('[subscribe] Failed to log welcome message:', msgLogError.message, msgLogError.details, msgLogError.code, 'payload:', JSON.stringify(msgPayload))
    } else {
      console.log('[subscribe] Welcome message logged for mosque_id:', mosque_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed!',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
