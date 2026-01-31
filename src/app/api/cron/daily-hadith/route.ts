import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DAILY_HADITH_TEMPLATE } from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import {
  createCronLogger,
  logCronError,
  setCronMetadata,
  finalizeCronLog,
} from "@/lib/logger";
import {
  sendTemplatesConcurrently,
  getSuccessfulSubscriberIds,
  batchUpdateLastMessageAt,
} from "@/lib/message-sender";
import { previewTemplate } from "@/lib/whatsapp-templates";
import type { Mosque, Subscriber, Hadith } from "@/lib/supabase";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// This should run once daily, after Fajr (e.g., 6:30 AM)
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logger = createCronLogger("daily-hadith");

  try {
    // Get a random hadith
    const { data: hadiths, error: hadithError } = await supabaseAdmin
      .from("hadith")
      .select("*")
      .eq("verified", true);

    if (hadithError || !hadiths || hadiths.length === 0) {
      logCronError(logger, "No hadith available", { error: hadithError });
      finalizeCronLog(logger);
      return NextResponse.json(
        { error: "No hadith available" },
        { status: 500 }
      );
    }

    // Select random hadith
    const hadith = hadiths[
      Math.floor(Math.random() * hadiths.length)
    ] as Hadith;

    setCronMetadata(logger, {
      hadithId: hadith.id,
      hadithSource: hadith.source,
    });

    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques) {
      logCronError(logger, "Failed to fetch mosques", { error: mosqueError });
      finalizeCronLog(logger);
      return NextResponse.json(
        { error: "Failed to fetch mosques" },
        { status: 500 }
      );
    }

    setCronMetadata(logger, { mosqueCount: mosques.length });

    for (const mosque of mosques as Mosque[]) {
      // Get subscribers who want daily hadith
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_hadith", true);

      if (!subscribers || subscribers.length === 0) continue;

      // Template variables: hadith_text, source, reference, mosque_name
      const templateVars = [
        hadith.text_english,
        hadith.source,
        hadith.reference,
        mosque.name,
      ];

      // Send messages concurrently with p-limit (max 10 concurrent) using template
      const batchResult = await sendTemplatesConcurrently(
        subscribers as Subscriber[],
        DAILY_HADITH_TEMPLATE,
        templateVars,
        logger
      );

      // Generate message content for logging (preview with actual values)
      const message = previewTemplate(DAILY_HADITH_TEMPLATE, templateVars);

      // Batch update last_message_at for successful sends
      const successfulIds = getSuccessfulSubscriberIds(batchResult.results);
      await batchUpdateLastMessageAt(successfulIds);

      const sentCount = batchResult.successful;

      // Log the message
      await supabaseAdmin.from("messages").insert({
        mosque_id: mosque.id,
        type: "hadith",
        content: message,
        sent_to_count: sentCount,
        status: "sent",
        metadata: {
          hadith_id: hadith.id,
          hadith_source: hadith.source,
          hadith_reference: hadith.reference,
        },
      });
    }

    const result = finalizeCronLog(logger);

    return NextResponse.json({
      success: true,
      sent: result.messagesSent,
      durationMs: result.durationMs,
    });
  } catch (error) {
    logCronError(logger, "Unexpected error during cron execution", {
      error: error instanceof Error ? error.message : String(error),
    });
    finalizeCronLog(logger);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
