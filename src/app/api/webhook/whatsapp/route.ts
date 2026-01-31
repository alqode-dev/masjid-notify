import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateToken } from "@/lib/utils";
import { getWebhookRateLimiter, getClientIP } from "@/lib/ratelimit";

/**
 * Verify WhatsApp webhook signature using HMAC-SHA256
 * @param rawBody - The raw request body as a string
 * @param signature - The X-Hub-Signature-256 header value
 * @returns true if signature is valid, false otherwise
 */
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("WHATSAPP_APP_SECRET is not configured");
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
  // Rate limiting check
  const ip = getClientIP(request);
  const rateLimiter = getWebhookRateLimiter();
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

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
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
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Rate limiting check (after signature verification to avoid resource exhaustion)
    const ip = getClientIP(request);
    const rateLimiter = getWebhookRateLimiter();
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

    // Parse the raw body as JSON
    const body = JSON.parse(rawBody);

    // Extract message data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Could be a status update, ignore
      return NextResponse.json({ success: true });
    }

    const message = messages[0];
    const from = message.from; // Phone number
    const text = message.text?.body?.toUpperCase().trim();

    if (!text) {
      return NextResponse.json({ success: true });
    }

    // Find the subscriber
    const { data: subscriber } = await supabaseAdmin
      .from("subscribers")
      .select("*, mosques(*)")
      .eq("phone_number", "+" + from)
      .single();

    if (!subscriber) {
      // Unknown number, send help message
      await sendWhatsAppMessage(
        from,
        "Hi! You're not currently subscribed to any mosque. Visit our website to subscribe."
      );
      return NextResponse.json({ success: true });
    }

    const mosque = subscriber.mosques as { name: string; id: string };

    // Handle commands
    switch (true) {
      case text === "STOP" || text === "UNSUBSCRIBE":
        await handleStop(subscriber.id, from, mosque.name);
        break;

      case text === "SETTINGS" || text === "PREFERENCES":
        await handleSettings(subscriber.id, from, mosque.name);
        break;

      case text === "HELP" || text === "INFO":
        await handleHelp(from, mosque.name);
        break;

      case text.startsWith("PAUSE"):
        await handlePause(subscriber.id, from, text, mosque.name);
        break;

      case text === "RESUME" || text === "START":
        await handleResume(subscriber.id, from, mosque.name);
        break;

      default:
        // Unknown command
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
  await supabaseAdmin
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("id", subscriberId);

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
  await supabaseAdmin
    .from("subscribers")
    .update({
      settings_token: token,
      settings_token_expires: expiresAt.toISOString(),
    })
    .eq("id", subscriberId);

  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/${token}`;

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
  const days = match?.[1] ? parseInt(match[1]) : 7;
  const pauseDays = Math.min(Math.max(days, 1), 30); // 1-30 days

  const pauseUntil = new Date();
  pauseUntil.setDate(pauseUntil.getDate() + pauseDays);

  await supabaseAdmin
    .from("subscribers")
    .update({
      status: "paused",
      pause_until: pauseUntil.toISOString(),
    })
    .eq("id", subscriberId);

  await sendWhatsAppMessage(
    phone,
    `Notifications paused for ${pauseDays} days.\n\nThey will resume on ${pauseUntil.toLocaleDateString()}.\n\nReply RESUME to start receiving them again.\n\n${mosqueName}`
  );
}

async function handleResume(subscriberId: string, phone: string, mosqueName: string) {
  await supabaseAdmin
    .from("subscribers")
    .update({
      status: "active",
      pause_until: null,
    })
    .eq("id", subscriberId);

  await sendWhatsAppMessage(
    phone,
    `Welcome back! You will now receive notifications from ${mosqueName}.\n\nReply SETTINGS to update your preferences.`
  );
}
