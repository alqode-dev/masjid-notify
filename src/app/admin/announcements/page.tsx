"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Message, Mosque, ScheduledMessage } from "@/lib/supabase";
import { getRelativeTime } from "@/lib/utils";
import { Calendar, Clock, X } from "lucide-react";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = async () => {
    const supabase = createClientSupabase();

    // Get mosque
    const { data: mosqueData } = await supabase
      .from("mosques")
      .select("*")
      .eq("slug", "test-masjid")
      .single();

    if (mosqueData) {
      setMosque(mosqueData as Mosque);

      // Get active subscribers count
      const { count } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("mosque_id", mosqueData.id)
        .eq("status", "active");

      setActiveCount(count || 0);

      // Get recent announcements
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("mosque_id", mosqueData.id)
        .eq("type", "announcement")
        .order("sent_at", { ascending: false })
        .limit(10);

      setMessages((messagesData || []) as Message[]);

      // Fetch scheduled messages via API (requires auth)
      try {
        const response = await fetch("/api/admin/announcements/schedule");
        if (response.ok) {
          const data = await response.json();
          setScheduledMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching scheduled messages:", error);
      }
    }

    setLoading(false);
  };

  const handleCancelScheduled = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled message?")) {
      return;
    }

    setCancellingId(id);
    try {
      const response = await fetch(`/api/admin/announcements/schedule/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel scheduled message");
      }

      toast.success("Scheduled message cancelled");
      // Remove from local state
      setScheduledMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel"
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatScheduledDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!mosque) {
    return <div>Mosque not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground">
          Send messages to your subscribers
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          New Announcement
        </h2>
        <AnnouncementForm
          mosqueId={mosque.id}
          mosqueName={mosque.name}
          activeSubscribers={activeCount}
          onSent={fetchData}
        />
      </Card>

      {/* Scheduled Messages Section */}
      {scheduledMessages.length > 0 && (
        <Card className="p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Scheduled Messages
            </h2>
            <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-600">
              {scheduledMessages.length} pending
            </Badge>
          </div>
          <div className="space-y-3">
            {scheduledMessages.map((message) => (
              <div
                key={message.id}
                className="p-4 rounded-xl border border-amber-500/20 bg-background"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap flex-1 line-clamp-2">
                    {message.content}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelScheduled(message.id)}
                    disabled={cancellingId === message.id}
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium text-amber-600">
                    {formatScheduledDateTime(message.scheduled_at)}
                  </span>
                  <span className="text-muted-foreground">
                    ({getRelativeTime(new Date(message.scheduled_at))})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Announcements
        </h2>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No announcements sent yet
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-4 rounded-xl border border-border"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                    {message.content}
                  </p>
                  <Badge variant={message.status === "sent" ? "default" : "destructive"}>
                    {message.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Sent to {message.sent_to_count} subscriber
                    {message.sent_to_count !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {getRelativeTime(new Date(message.sent_at))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
