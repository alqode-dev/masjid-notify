import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { AudioLibrary } from "./audio-library";
import { Footer } from "@/components/footer";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ListenPage() {
  const supabase = getSupabaseAdmin();

  // Get mosque
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, name")
    .eq("slug", DEFAULT_MOSQUE_SLUG)
    .single();

  if (mosqueError || !mosque) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Service Unavailable
          </h1>
          <p className="text-muted-foreground">
            We&apos;re experiencing technical difficulties. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Get collections with file counts
  const { data: collections } = await supabase
    .from("audio_collections")
    .select("id, name, description, sort_order, audio_files(count)")
    .eq("mosque_id", mosque.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const collectionsWithCount = (collections || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    sort_order: c.sort_order,
    file_count: c.audio_files?.[0]?.count ?? 0,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-accent/20">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to {mosque.name}
            </Link>
          </div>

          <AudioLibrary
            mosqueName={mosque.name}
            initialCollections={collectionsWithCount}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
