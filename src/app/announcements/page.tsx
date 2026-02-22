import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { AnnouncementsList } from "./announcements-list";
import type { MessageAttachment } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface AnnouncementRow {
  id: string;
  content: string;
  sent_at: string;
  attachments: MessageAttachment[] | null;
}

async function getAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = getSupabaseAdmin();

  // Get the default mosque
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id")
    .eq("slug", DEFAULT_MOSQUE_SLUG)
    .single();

  if (!mosque) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, sent_at, attachments")
    .eq("mosque_id", mosque.id)
    .eq("type", "announcement")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch announcements:", error);
    return [];
  }

  return (data || []) as AnnouncementRow[];
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return <AnnouncementsList announcements={announcements} />;
}
