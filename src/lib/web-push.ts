import webpush from "web-push";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:admin@masjidnotify.com").trim();

  if (!publicKey || !privateKey) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("Failed to configure VAPID:", err);
    return false;
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a single subscription.
 * Returns { success: true } or { success: false, error, statusCode }.
 * A 410 statusCode means the subscription has expired and should be removed.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  if (!ensureVapidConfigured()) {
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour TTL
        urgency: "high",
      }
    );
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    return {
      success: false,
      error: error.message || "Unknown push error",
      statusCode: error.statusCode,
    };
  }
}
