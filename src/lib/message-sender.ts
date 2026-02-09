import pLimit from "p-limit";
import { sendWhatsAppMessage, sendTemplateMessage } from "./whatsapp";
import { supabaseAdmin } from "./supabase";
import type { Subscriber } from "./supabase";
import type { CronLogContext } from "./logger";
import { incrementMessageCount, logCronError } from "./logger";
import type { TemplateDefinition } from "./whatsapp-templates";

// Concurrency limit for WhatsApp API calls
// 10 concurrent requests balances speed vs rate limits
const CONCURRENCY_LIMIT = 10;

interface SendResult {
  subscriberId: string;
  phoneNumber: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BatchSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}

/**
 * Send messages to multiple subscribers concurrently with controlled parallelism.
 * Uses p-limit to cap concurrent requests at CONCURRENCY_LIMIT (10).
 * Individual failures don't stop the batch - all subscribers are attempted.
 *
 * @param subscribers - Array of subscribers to send to
 * @param message - Message content to send
 * @param logger - Optional cron logger to track message counts and errors
 * @returns BatchSendResult with counts and individual results
 */
export async function sendMessagesConcurrently(
  subscribers: Subscriber[],
  message: string,
  logger?: CronLogContext
): Promise<BatchSendResult> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const results: SendResult[] = [];

  // Create array of limited promises
  const sendPromises = subscribers.map((sub) =>
    limit(async () => {
      const result = await sendWhatsAppMessage(sub.phone_number, message);

      const sendResult: SendResult = {
        subscriberId: sub.id,
        phoneNumber: sub.phone_number,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };

      if (result.success && logger) {
        incrementMessageCount(logger);
      } else if (!result.success && logger) {
        logCronError(logger, "Failed to send message", {
          subscriberId: sub.id,
          phone: sub.phone_number,
          error: result.error,
        });
      }

      results.push(sendResult);
      return sendResult;
    })
  );

  // Wait for all to complete (with concurrency control)
  await Promise.all(sendPromises);

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: subscribers.length,
    successful,
    failed,
    results,
  };
}

/**
 * Send template messages to multiple subscribers concurrently with controlled parallelism.
 * Uses p-limit to cap concurrent requests at CONCURRENCY_LIMIT (10).
 * Individual failures don't stop the batch - all subscribers are attempted.
 *
 * @param subscribers - Array of subscribers to send to
 * @param template - Template definition from whatsapp-templates.ts
 * @param variables - Variable values in order matching template.variables
 * @param logger - Optional cron logger to track message counts and errors
 * @returns BatchSendResult with counts and individual results
 */
export async function sendTemplatesConcurrently(
  subscribers: Subscriber[],
  template: TemplateDefinition,
  variables: string[],
  logger?: CronLogContext
): Promise<BatchSendResult> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const results: SendResult[] = [];

  // Create array of limited promises
  const sendPromises = subscribers.map((sub) =>
    limit(async () => {
      const result = await sendTemplateMessage(sub.phone_number, template, variables);

      const sendResult: SendResult = {
        subscriberId: sub.id,
        phoneNumber: sub.phone_number,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };

      if (result.success && logger) {
        incrementMessageCount(logger);
      } else if (!result.success && logger) {
        logCronError(logger, "Failed to send template message", {
          subscriberId: sub.id,
          phone: sub.phone_number,
          template: template.name,
          error: result.error,
        });
      }

      results.push(sendResult);
      return sendResult;
    })
  );

  // Wait for all to complete (with concurrency control)
  await Promise.all(sendPromises);

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: subscribers.length,
    successful,
    failed,
    results,
  };
}

/**
 * Collect subscriber IDs that received messages successfully.
 * Use with batchUpdateLastMessageAt for efficient updates.
 */
export function getSuccessfulSubscriberIds(results: SendResult[]): string[] {
  return results.filter((r) => r.success).map((r) => r.subscriberId);
}

/**
 * Batch update last_message_at for multiple subscribers in a single query.
 * Much more efficient than individual updates in a loop.
 *
 * @param subscriberIds - Array of subscriber IDs to update
 */
const UPDATE_BATCH_SIZE = 100;

export async function batchUpdateLastMessageAt(
  subscriberIds: string[]
): Promise<void> {
  if (subscriberIds.length === 0) return;

  const now = new Date().toISOString();

  // Process in batches to avoid overly large IN() clauses
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
      // Don't throw - this is a non-critical update for tracking purposes
    }
  }
}
