import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateToken, normalizePhoneNumber } from "@/lib/utils";
import { getWebhookRateLimiter, getClientIP } from "@/lib/ratelimit";

/**
 * Verify WhatsApp webhook signature using HMAC-SHA256
 * @param rawBody - The raw request body as a string
 * @param signature - The X-Hub-Signature-256 header value
 * @returns true if signature is valid, false otherwise
 */
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    console.error("[webhook] No X-Hub-Signature-256 header received");
    return false;
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!appSecret) {
    console.error("[webhook] CRITICAL: WHATSAPP_APP_SECRET is not configured in environment variables!");
    console.error("[webhook] Commands (STOP, PAUSE, SETTINGS, etc.) will NOT work until this is fixed.");
    console.error("[webhook] Set WHATSAPP_APP_SECRET in Vercel Dashboard > Settings > Environment Variables");
    return false;
  }

  // Signature format: "sha256=<hex_digest>"
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const receivedSignature = signature.slice(expectedPrefix.length);
  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// Webhook verification (GET)
export async function GET(request: NextRequest) {
  // Rate limiting check (optional - only if Upstash is configured)
  const rateLimiter = getWebhookRateLimiter();
  if (rateLimiter) {
    const ip = getClientIP(request);
    const { success, limit, remaining, reset } = await rateLimiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Use constant-time comparison to prevent timing attacks
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && token && verifyToken) {
    try {
      const tokenBuffer = Buffer.from(token);
      const expectedBuffer = Buffer.from(verifyToken);
      if (tokenBuffer.length === expectedBuffer.length && timingSafeEqual(tokenBuffer, expectedBuffer)) {
        return new Response(challenge, { status: 200 });
      }
    } catch {
      // Fall through to verification failed
    }
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Handle incoming messages (POST)
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification BEFORE parsing JSON
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[webhook] Signature verification failed - command NOT processed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log("[webhook] Signature verified successfully");

    // Rate limiting check (optional - only if Upstash is configured)
    const rateLimiter = getWebhookRateLimiter();
    if (rateLimiter) {
      const ip = getClientIP(request);
      const { success, limit, remaining, reset } = await rateLimiter.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    }

    // Parse the raw body as JSON
    const body = JSON.parse(rawBody);

    // Extract message data with validation
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Could be a status update or delivery receipt, ignore silently
      return NextResponse.json({ success: true });
    }

    const message = messages[0];
    const from = message?.from; // Phone number
    const text = message?.text?.body?.toUpperCase().trim();

    // Validate message structure
    if (!from) {
      console.warn("Webhook received message without 'from' field:", JSON.stringify(message));
      return NextResponse.json({ success: true });
    }

    if (!text) {
      return NextResponse.json({ success: true });
    }

    // Find the subscriber using normalized phone number
    const normalizedPhone = normalizePhoneNumber(from);
    const { data: subscriber } = await supabaseAdmin
      .from("subscribers")
      .select("*, mosques(*)")
      .eq("phone_number", normalizedPhone)
      .single();

    if (!subscriber) {
      // Unknown number, send help message
      console.log(`[webhook] Unknown phone number: ${normalizedPhone} - not subscribed`);
      await sendWhatsAppMessage(
        from,
        "Hi! You're not currently subscribed to any mosque. Visit our website to subscribe."
      );
      return NextResponse.json({ success: true });
    }

    console.log(`[webhook] Processing command '${text}' from ${normalizedPhone} (status: ${subscriber.status})`);

    // Safely extract mosque data with null check
    const mosqueData = subscriber.mosques as { name: string; id: string } | null;
    if (!mosqueData) {
      console.error("Subscriber has no associated mosque:", normalizedPhone);
      return NextResponse.json({ success: true });
    }
    const mosque = mosqueData;

    // Log the incoming command to messages table with error handling
    const logCommand = async (command: string) => {
      try {
        const { error } = await supabaseAdmin.from("messages").insert({
          mosque_id: mosque.id,
          type: "webhook_command",
          content: `User sent: ${command}`,
          sent_to_count: 1,
          status: "received",
          metadata: { command, phone: normalizedPhone },
        });
        if (error) {
          console.error("[webhook] Failed to log command:", error.message, error.code);
        }
      } catch (err) {
        console.error("[webhook] Error logging command:", err);
      }
    };

    // Handle commands
    switch (true) {
      case text === "STOP" || text === "UNSUBSCRIBE":
        await logCommand(text);
        await handleStop(subscriber.id, from, mosque.name);
        break;

      case text === "SETTINGS" || text === "PREFERENCES":
        await logCommand(text);
        await handleSettings(subscriber.id, from, mosque.name);
        break;

      case text === "HELP" || text === "INFO":
        await logCommand(text);
        await handleHelp(from, mosque.name);
        break;

      case text.startsWith("PAUSE"):
        await logCommand(text);
        await handlePause(subscriber.id, from, text, mosque.name);
        break;

      case text === "RESUME" || text === "START":
        await logCommand(text);
        await handleResume(subscriber.id, from, mosque.name, subscriber.status);
        break;

      default:
        // Unknown command - also log it
        await logCommand(text);
        await sendWhatsAppMessage(
          from,
          `Commands:\n• STOP - Unsubscribe\n• SETTINGS - Update preferences\n• PAUSE 7 - Pause for 7 days\n• RESUME - Resume notifications\n• HELP - Get assistance\n\n${mosque.name}`
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: true }); // Always return 200 to WhatsApp
  }
}

async function handleStop(subscriberId: string, phone: string, mosqueName: string) {
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("id", subscriberId);

  if (error) {
    console.error("[webhook] STOP command failed to update database:", error.message);
    await sendWhatsAppMessage(
      phone,
      `Sorry, there was an error processing your request. Please try again later.`
    );
    return;
  }

  console.log(`[webhook] STOP: Subscriber ${subscriberId} unsubscribed successfully`);

  await sendWhatsAppMessage(
    phone,
    `You have been unsubscribed from ${mosqueName}.\n\nYou will no longer receive notifications.\n\nReply START to resubscribe anytime.`
  );
}

async function handleSettings(subscriberId: string, phone: string, mosqueName: string) {
  // Generate a unique settings token
  const token = generateToken(32);

  // Calculate expiry time (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Store the token in the database
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({
      settings_token: token,
      settings_token_expires: expiresAt.toISOString(),
    })
    .eq("id", subscriberId);

  if (error) {
    console.error("[webhook] SETTINGS command failed to update database:", error.message);
    await sendWhatsAppMessage(
      phone,
      `Sorry, there was an error generating your settings link. Please try again later.`
    );
    return;
  }

  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/${token}`;

  console.log(`[webhook] SETTINGS: Generated settings link for subscriber ${subscriberId}`);

  await sendWhatsAppMessage(
    phone,
    `Update your notification preferences:\n\n${settingsUrl}\n\nThis link expires in 24 hours.\n\n${mosqueName}`
  );
}

async function handleHelp(phone: string, mosqueName: string) {
  await sendWhatsAppMessage(
    phone,
    `${mosqueName} Notifications Help\n\nCommands:\n• STOP - Unsubscribe completely\n• PAUSE 7 - Pause for 7 days\n• SETTINGS - Update preferences\n• RESUME - Resume notifications\n\nFor support, contact the mosque directly.\n\nPowered by Masjid Notify`
  );
}

async function handlePause(
  subscriberId: string,
  phone: string,
  text: string,
  mosqueName: string
) {
  // Extract number of days
  const match = text.match(/PAUSE\s*(\d+)?/);
  const days = match?.[1] ? parseInt(match[1], 10) : 7;
  const pauseDays = Math.min(Math.max(days, 1), 30); // 1-30 days

  const pauseUntil = new Date();
  pauseUntil.setDate(pauseUntil.getDate() + pauseDays);

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({
      status: "paused",
      pause_until: pauseUntil.toISOString(),
    })
    .eq("id", subscriberId);

  if (error) {
    console.error("[webhook] PAUSE command failed to update database:", error.message);
    await sendWhatsAppMessage(
      phone,
      `Sorry, there was an error processing your request. Please try again later.`
    );
    return;
  }

  console.log(`[webhook] PAUSE: Subscriber ${subscriberId} paused for ${pauseDays} days until ${pauseUntil.toISOString()}`);

  await sendWhatsAppMessage(
    phone,
    `Notifications paused for ${pauseDays} days.\n\nThey will resume on ${pauseUntil.toLocaleDateString()}.\n\nReply RESUME to start receiving them again.\n\n${mosqueName}`
  );
}

async function handleResume(subscriberId: string, phone: string, mosqueName: string, currentStatus: string) {
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({
      status: "active",
      pause_until: null,
    })
    .eq("id", subscriberId);

  if (error) {
    console.error("[webhook] RESUME/START command failed to update database:", error.message);
    await sendWhatsAppMessage(
      phone,
      `Sorry, there was an error processing your request. Please try again later.`
    );
    return;
  }

  console.log(`[webhook] RESUME: Subscriber ${subscriberId} resumed from status '${currentStatus}'`);

  // Send appropriate message based on previous status
  if (currentStatus === "unsubscribed") {
    await sendWhatsAppMessage(
      phone,
      `Welcome back! You have been resubscribed to ${mosqueName}.\n\nYou will now receive notifications again.\n\nReply SETTINGS to update your preferences.`
    );
  } else {
    await sendWhatsAppMessage(
      phone,
      `Welcome back! You will now receive notifications from ${mosqueName}.\n\nReply SETTINGS to update your preferences.`
    );
  }
}
