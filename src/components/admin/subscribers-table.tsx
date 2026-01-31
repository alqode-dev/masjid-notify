"use client";

import { useState } from "react";
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
import { formatPhoneForDisplay, formatDateShort } from "@/lib/utils";
import type { Subscriber } from "@/lib/supabase";
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";

interface SubscribersTableProps {
  subscribers: Subscriber[];
  loading?: boolean;
  onStatusChange?: (id: string, status: Subscriber["status"]) => void;
  onDelete?: (id: string) => void;
}

export function SubscribersTable({
  subscribers,
  loading,
  onStatusChange,
  onDelete,
}: SubscribersTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Subscribed</TableHead>
            <TableHead className="hidden lg:table-cell">Preferences</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber, index) => {
            const statusInfo = getStatusBadge(subscriber.status);
            const isExpanded = expandedRow === subscriber.id;

            return (
              <motion.tr
                key={subscriber.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <TableCell className="font-medium">
                  {formatPhoneForDisplay(subscriber.phone_number)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatDateShort(new Date(subscriber.subscribed_at))}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {subscriber.pref_fajr && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Fajr
                      </span>
                    )}
                    {subscriber.pref_all_prayers && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        All Prayers
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
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {subscriber.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange?.(subscriber.id, "paused")}
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {subscriber.status === "paused" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange?.(subscriber.id, "active")}
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(subscriber.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
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
