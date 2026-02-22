"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const subscriberId = localStorage.getItem("subscriberId");
    if (!subscriberId) {
      setError("No subscription found. Please subscribe first.");
      setLoading(false);
      return;
    }

    fetch(`/api/notifications?subscriberId=${subscriberId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setNotifications(data.notifications || []);
        }
      })
      .catch(() => setError("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    const subscriberId = localStorage.getItem("subscriberId");
    if (!subscriberId) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId, notificationId: id }),
    });

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const subscriberId = localStorage.getItem("subscriberId");
    if (!subscriberId) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriberId, markAll: true }),
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  };

  const typeColors: Record<string, string> = {
    prayer: "bg-blue-500/10 text-blue-600",
    hadith: "bg-green-500/10 text-green-600",
    announcement: "bg-purple-500/10 text-purple-600",
    ramadan: "bg-amber-500/10 text-amber-600",
    jumuah: "bg-indigo-500/10 text-indigo-600",
    nafl: "bg-teal-500/10 text-teal-600",
    welcome: "bg-emerald-500/10 text-emerald-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm mb-4">{error}</p>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your prayer reminders and updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  toggleExpand(notification.id);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  notification.read
                    ? "bg-background border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[notification.type] || "bg-gray-500/10 text-gray-600"}`}>
                        {notification.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className={`text-sm text-muted-foreground mt-0.5 ${
                      expandedIds.has(notification.id) ? "" : "line-clamp-3"
                    }`}>{notification.body}</p>
                    {expandedIds.has(notification.id) && !!notification.data?.source && (
                      <p className="text-xs text-primary mt-2 italic">— {String(notification.data.source)}</p>
                    )}
                    {expandedIds.has(notification.id) && !!notification.data?.arabic && (
                      <p className="text-sm text-foreground mt-3 text-right leading-relaxed" dir="rtl">
                        {String(notification.data.arabic)}
                      </p>
                    )}
                    {notification.body.length > 150 && (
                      <button
                        className="text-xs text-primary mt-1 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(notification.id);
                        }}
                      >
                        {expandedIds.has(notification.id) ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
