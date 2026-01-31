import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage, getWelcomeMessage } from '@/lib/whatsapp'
import { normalizePhoneNumber, isValidSAPhoneNumber } from '@/lib/utils'
import { getSubscribeRateLimiter, getClientIP } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIP(request)
    const rateLimiter = getSubscribeRateLimiter()
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

    const body = await request.json()

    const {
      phone_number,
      mosque_id,
      reminder_offset = 15,
      pref_fajr = true,
      pref_all_prayers = false,
      pref_jumuah = true,
      pref_programs = true,
      pref_hadith = false,
      pref_ramadan = true,
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
            pref_fajr,
            pref_all_prayers,
            pref_jumuah,
            pref_programs,
            pref_hadith,
            pref_ramadan,
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
          pref_fajr,
          pref_all_prayers,
          pref_jumuah,
          pref_programs,
          pref_hadith,
          pref_ramadan,
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

    // Send welcome message via WhatsApp
    const welcomeMessage = getWelcomeMessage(mosque.name)
    const whatsappResult = await sendWhatsAppMessage(formattedPhone, welcomeMessage)

    if (!whatsappResult.success) {
      console.error('Failed to send WhatsApp message:', whatsappResult.error)
      // Don't fail the subscription, just log the error
    }

    // Log the welcome message
    await supabaseAdmin
      .from('messages')
      .insert({
        mosque_id,
        type: 'welcome',
        content: welcomeMessage,
        sent_to_count: 1,
        status: whatsappResult.success ? 'sent' : 'failed',
      })

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
