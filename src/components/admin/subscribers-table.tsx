"use client";

import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateShort } from "@/lib/utils";
import type { Subscriber } from "@/lib/supabase";
import { Pause, Play, Trash2, Monitor, Smartphone } from "lucide-react";

interface SubscribersTableProps {
  subscribers: Subscriber[];
  loading?: boolean;
  onStatusChange?: (id: string, status: Subscriber["status"]) => void;
  onDelete?: (id: string) => void;
}

function parseDevice(userAgent: string | null): { label: string; isMobile: boolean } {
  if (!userAgent) return { label: "Unknown", isMobile: false };
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return { label: "iOS", isMobile: true };
  if (ua.includes("android")) return { label: "Android", isMobile: true };
  if (ua.includes("windows")) return { label: "Windows", isMobile: false };
  if (ua.includes("mac")) return { label: "Mac", isMobile: false };
  if (ua.includes("linux")) return { label: "Linux", isMobile: false };
  return { label: "Browser", isMobile: false };
}

export function SubscribersTable({
  subscribers,
  loading,
  onStatusChange,
  onDelete,
}: SubscribersTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground">No subscribers yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Share your landing page to get subscribers
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Subscriber["status"]) => {
    const variants: Record<
      Subscriber["status"],
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      unsubscribed: { variant: "destructive", label: "Unsubscribed" },
    };
    return variants[status];
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table aria-label="Subscribers list">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Device</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Subscribed</TableHead>
            <TableHead className="hidden lg:table-cell">Preferences</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber, index) => {
            const statusInfo = getStatusBadge(subscriber.status);
            const device = parseDevice(subscriber.user_agent);

            return (
              <motion.tr
                key={subscriber.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 20) * 0.03 }}
                className="group"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {device.isMobile ? (
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                    )}
                    {device.label}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatDateShort(new Date(subscriber.subscribed_at))}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {subscriber.pref_daily_prayers && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        Daily Prayers
                      </span>
                    )}
                    {subscriber.pref_jumuah && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Jumu&apos;ah
                      </span>
                    )}
                    {subscriber.pref_hadith && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                        Hadith
                      </span>
                    )}
                    {subscriber.pref_announcements && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Announcements
                      </span>
                    )}
                    {subscriber.pref_ramadan && (
                      <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                        Ramadan
                      </span>
                    )}
                    {subscriber.pref_nafl_salahs && (
                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                        Nafl Salahs
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {subscriber.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange?.(subscriber.id, "paused")}
                        title="Pause notifications"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {subscriber.status === "paused" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange?.(subscriber.id, "active")}
                        title="Resume notifications"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this subscriber? This action cannot be undone.")) {
                          onDelete?.(subscriber.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                      title="Delete subscriber"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
