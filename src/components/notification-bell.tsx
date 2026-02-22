"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

function getSubscriberId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("subscriberId");
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function NotificationBell() {
  const subscriberId = useSyncExternalStore(
    subscribeToStorage,
    getSubscriberId,
    () => null
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!subscriberId) return;

    fetch(`/api/notifications?subscriberId=${subscriberId}&countOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {
        // Silently fail — bell just won't show a count
      });
  }, [subscriberId]);

  if (!subscriberId) return null;

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-full hover:bg-accent transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="w-5 h-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
