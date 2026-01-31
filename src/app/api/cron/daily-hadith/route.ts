import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { verifyCronSecret } from "@/lib/auth";
import type { Mosque, Subscriber, Hadith } from "@/lib/supabase";

// This should run once daily, after Fajr (e.g., 6:30 AM)
export async function GET(request: NextRequest) {
  // Verify cron secret using constant-time comparison for security
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get a random hadith
    const { data: hadiths, error: hadithError } = await supabaseAdmin
      .from("hadith")
      .select("*")
      .eq("verified", true);

    if (hadithError || !hadiths || hadiths.length === 0) {
      return NextResponse.json(
        { error: "No hadith available" },
        { status: 500 }
      );
    }

    // Select random hadith
    const hadith = hadiths[
      Math.floor(Math.random() * hadiths.length)
    ] as Hadith;

    // Get all mosques
    const { data: mosques, error: mosqueError } = await supabaseAdmin
      .from("mosques")
      .select("*");

    if (mosqueError || !mosques) {
      return NextResponse.json(
        { error: "Failed to fetch mosques" },
        { status: 500 }
      );
    }

    let totalSent = 0;

    for (const mosque of mosques as Mosque[]) {
      // Get subscribers who want daily hadith
      const { data: subscribers } = await supabaseAdmin
        .from("subscribers")
        .select("*")
        .eq("mosque_id", mosque.id)
        .eq("status", "active")
        .eq("pref_hadith", true);

      if (!subscribers || subscribers.length === 0) continue;

      const message = formatHadithMessage(hadith, mosque.name);
      let sentCount = 0;

      for (const sub of subscribers as Subscriber[]) {
        const result = await sendWhatsAppMessage(sub.phone_number, message);
        if (result.success) {
          sentCount++;
          totalSent++;

          await supabaseAdmin
            .from("subscribers")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", sub.id);
        }
      }

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

    return NextResponse.json({
      success: true,
      sent: totalSent,
    });
  } catch (error) {
    console.error("Daily hadith cron error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function formatHadithMessage(hadith: Hadith, mosqueName: string): string {
  return `📖 Daily Hadith

${hadith.text_english}

— ${hadith.source} (${hadith.reference})

${mosqueName}`;
}
