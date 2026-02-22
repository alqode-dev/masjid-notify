"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, FileText, Download } from "lucide-react";
import Link from "next/link";
import type { MessageAttachment } from "@/lib/supabase";

interface Announcement {
  id: string;
  content: string;
  sent_at: string;
  attachments: MessageAttachment[] | null;
}

interface AnnouncementsListProps {
  announcements: Announcement[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>

        {announcements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Announcements from the mosque will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <p className="text-xs text-muted-foreground mb-3">
                  {formatDate(announcement.sent_at)}
                </p>

                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>

                {announcement.attachments && announcement.attachments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {announcement.attachments.map((att, attIdx) =>
                      att.type === "image" ? (
                        <a
                          key={attIdx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.name}
                            className="rounded-lg border border-border w-full object-cover max-h-80"
                          />
                        </a>
                      ) : (
                        <a
                          key={attIdx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {att.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF &middot; {formatFileSize(att.size)}
                            </p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </a>
                      )
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
