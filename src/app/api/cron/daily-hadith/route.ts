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
import { getTodaysHadith } from "@/lib/hadith-api";
import type { Mosque, Subscriber } from "@/lib/supabase";

// Prevent Next.js from caching this route - cron jobs must run dynamically
export const dynamic = "force-dynamic";

// This should run twice daily: after Fajr (morning) and around Maghrib (evening)
// Accepts ?time=fajr or ?time=maghrib query param
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine time of day from query param
  const { searchParams } = new URL(request.url);
  const timeParam = searchParams.get("time");
  const timeOfDay: "morning" | "evening" =
    timeParam === "maghrib" ? "evening" : "morning";

  const logger = createCronLogger(`daily-hadith-${timeOfDay}`);

  try {
    // Get today's hadith from the external API (cached per time of day)
    const hadith = await getTodaysHadith(timeOfDay);

    if (!hadith) {
      logCronError(logger, "Failed to fetch hadith from external API", {});
      finalizeCronLog(logger);
      return NextResponse.json(
        { error: "Failed to fetch hadith" },
        { status: 500 }
      );
    }

    setCronMetadata(logger, {
      hadithCollection: hadith.collection,
      hadithSource: hadith.source,
      hadithReference: hadith.reference,
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

      // Template variables: hadith_text, source_and_reference, mosque_name
      const templateVars = [
        hadith.textEnglish,
        `${hadith.source}, Hadith ${hadith.reference}`,
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
          hadith_collection: hadith.collection,
          hadith_number: hadith.hadithNumber,
          hadith_source: hadith.source,
          hadith_reference: hadith.reference,
        },
      });
    }

    const result = finalizeCronLog(logger);

    return NextResponse.json({
      success: true,
      timeOfDay,
      hadith: {
        collection: hadith.collection,
        source: hadith.source,
        reference: hadith.reference,
      },
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
