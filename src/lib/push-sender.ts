import pLimit from "p-limit";
import { sendPushNotification } from "./web-push";
import type { PushPayload } from "./web-push";
import { supabaseAdmin } from "./supabase";
import type { Subscriber } from "./supabase";
import type { CronLogContext } from "./logger";
import { incrementMessageCount, logCronError } from "./logger";

const CONCURRENCY_LIMIT = 10;

interface PushSendResult {
  subscriberId: string;
  success: boolean;
  error?: string;
}

interface BatchPushResult {
  total: number;
  successful: number;
  failed: number;
  results: PushSendResult[];
}

/**
 * Send push notifications to multiple subscribers concurrently.
 * Uses p-limit to cap concurrent requests at CONCURRENCY_LIMIT (10).
 * Auto-unsubscribes expired push subscriptions (410 Gone).
 * Individual failures don't stop the batch.
 */
export async function sendPushNotificationsBatch(
  subscribers: Subscriber[],
  payload: PushPayload,
  logger?: CronLogContext
): Promise<BatchPushResult> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const results: PushSendResult[] = [];
  const expiredIds: string[] = [];

  const sendPromises = subscribers.map((sub) =>
    limit(async () => {
      if (!sub.push_endpoint || !sub.push_p256dh || !sub.push_auth) {
        const result: PushSendResult = {
          subscriberId: sub.id,
          success: false,
          error: "Missing push subscription data",
        };
        results.push(result);
        return result;
      }

      const pushResult = await sendPushNotification(
        {
          endpoint: sub.push_endpoint,
          keys: { p256dh: sub.push_p256dh, auth: sub.push_auth },
        },
        payload
      );

      const result: PushSendResult = {
        subscriberId: sub.id,
        success: pushResult.success,
        error: pushResult.error,
      };

      if (pushResult.success && logger) {
        incrementMessageCount(logger);
      } else if (!pushResult.success) {
        // 410 Gone = subscription expired, auto-unsubscribe
        if (pushResult.statusCode === 410) {
          expiredIds.push(sub.id);
          console.log(`[push-sender] Subscription expired for ${sub.id}, marking as unsubscribed`);
        }
        if (logger) {
          logCronError(logger, "Failed to send push notification", {
            subscriberId: sub.id,
            error: pushResult.error,
            statusCode: pushResult.statusCode,
          });
        }
      }

      results.push(result);
      return result;
    })
  );

  await Promise.all(sendPromises);

  // Auto-unsubscribe expired push subscriptions
  if (expiredIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ status: "unsubscribed" })
      .in("id", expiredIds);

    if (error) {
      console.error("[push-sender] Failed to auto-unsubscribe expired:", error.message);
    } else {
      console.log(`[push-sender] Auto-unsubscribed ${expiredIds.length} expired subscriptions`);
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { total: subscribers.length, successful, failed, results };
}

/**
 * Collect subscriber IDs that received push notifications successfully.
 */
export function getSuccessfulSubscriberIds(results: PushSendResult[]): string[] {
  return results.filter((r) => r.success).map((r) => r.subscriberId);
}

/**
 * Batch update last_message_at for multiple subscribers in a single query.
 */
const UPDATE_BATCH_SIZE = 100;

export async function batchUpdateLastMessageAt(
  subscriberIds: string[]
): Promise<void> {
  if (subscriberIds.length === 0) return;

  const now = new Date().toISOString();

  for (let i = 0; i < subscriberIds.length; i += UPDATE_BATCH_SIZE) {
    const batch = subscriberIds.slice(i, i + UPDATE_BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ last_message_at: now })
      .in("id", batch);

    if (error) {
      console.error("Failed to batch update last_message_at:", error.message, {
        subscriberCount: batch.length,
        code: error.code,
      });
    }
  }
}

/**
 * Store notifications in the notifications table for in-app notification center.
 */
export async function storeNotifications(
  subscribers: Subscriber[],
  payload: PushPayload,
  mosqueId: string,
  type: string
): Promise<void> {
  if (subscribers.length === 0) return;

  const rows = subscribers.map((sub) => ({
    subscriber_id: sub.id,
    mosque_id: mosqueId,
    type,
    title: payload.title,
    body: payload.body,
    data: payload.data || null,
    read: false,
  }));

  // Insert in batches to avoid large payloads
  for (let i = 0; i < rows.length; i += UPDATE_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPDATE_BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("notifications")
      .insert(batch);

    if (error) {
      console.error("[push-sender] Failed to store notifications:", error.message, {
        batchSize: batch.length,
      });
    }
  }
}
