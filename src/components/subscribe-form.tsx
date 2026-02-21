"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Select } from "./ui/select";
import { REMINDER_OPTIONS } from "@/lib/constants";
import { CheckCircle, Bell, Smartphone } from "lucide-react";

interface SubscribeFormProps {
  mosqueName: string;
  mosqueId: string;
}

const SUBSCRIBE_REMINDER_OPTIONS = REMINDER_OPTIONS.map((opt) =>
  opt.value === "15"
    ? { ...opt, label: "15 minutes before (Recommended)" }
    : opt
);

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
}

export function SubscribeForm({ mosqueName, mosqueId }: SubscribeFormProps) {
  const [step, setStep] = useState<"enable" | "preferences" | "success">("enable");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);

  const [reminderOffset, setReminderOffset] = useState("15");
  const [prefDailyPrayers, setPrefDailyPrayers] = useState(true);
  const [prefJumuah, setPrefJumuah] = useState(true);
  const [prefRamadan, setPrefRamadan] = useState(true);
  const [prefNaflSalahs, setPrefNaflSalahs] = useState(false);
  const [prefHadith, setPrefHadith] = useState(true);
  const [prefAnnouncements, setPrefAnnouncements] = useState(true);

  useEffect(() => {
    // Check if already subscribed
    const existingId = localStorage.getItem("subscriberId");
    if (existingId) {
      setStep("success");
      return;
    }

    // Check push support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }

    // iOS requires Add to Home Screen for push notifications
    if (isIOS() && !isStandalone()) {
      setShowIOSBanner(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setError("");
    setLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission is required. Please allow notifications and try again.");
        setLoading(false);
        return;
      }

      setStep("preferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("Push notification configuration missing");
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subscriptionJSON = pushSubscription.toJSON();

      // Send to server
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          push_subscription: {
            endpoint: subscriptionJSON.endpoint,
            keys: {
              p256dh: subscriptionJSON.keys?.p256dh,
              auth: subscriptionJSON.keys?.auth,
            },
          },
          mosque_id: mosqueId,
          reminder_offset: parseInt(reminderOffset, 10),
          pref_daily_prayers: prefDailyPrayers,
          pref_jumuah: prefJumuah,
          pref_ramadan: prefRamadan,
          pref_nafl_salahs: prefNaflSalahs,
          pref_hadith: prefHadith,
          pref_announcements: prefAnnouncements,
          user_agent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Store subscriber ID for settings access
      if (data.subscriberId) {
        localStorage.setItem("subscriberId", data.subscriberId);
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  if (!pushSupported) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, Edge, or Safari 16+.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showIOSBanner && step === "enable" && (
        <motion.div
          key="ios-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Add to Home Screen First</p>
              <p>
                On iPhone/iPad, tap the share button <span className="font-mono">⎙</span> then &quot;Add to Home Screen&quot; to enable push notifications.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {step === "enable" ? (
        <motion.div
          key="enable"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Get prayer time reminders, Jumu&apos;ah notifications, and announcements from {mosqueName} delivered straight to your device.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="button"
            className="w-full"
            size="lg"
            loading={loading}
            onClick={handleEnableNotifications}
          >
            <Bell className="w-5 h-5 mr-2" />
            Enable Notifications
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll be asked to allow notifications from your browser.
          </p>
        </motion.div>
      ) : step === "preferences" ? (
        <motion.form
          key="preferences"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubscribe}
          className="space-y-6"
        >
          {/* Reminder Timing */}
          <Select
            label="Remind me"
            value={reminderOffset}
            onChange={(e) => setReminderOffset(e.target.value)}
            options={SUBSCRIBE_REMINDER_OPTIONS}
          />

          {/* Preferences */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              What would you like to receive?
            </p>

            <div className="space-y-3">
              <Checkbox
                label="All 5 Daily Prayers"
                description="Fajr, Dhuhr, Asr, Maghrib, Isha reminders"
                checked={prefDailyPrayers}
                onChange={(e) => setPrefDailyPrayers(e.target.checked)}
              />

              <Checkbox
                label="Jumu'ah Khutbah Reminder"
                description="Friday prayer notification with Khutbah time"
                checked={prefJumuah}
                onChange={(e) => setPrefJumuah(e.target.checked)}
              />

              <Checkbox
                label="Ramadan Mode"
                description="Suhoor, Iftar, Taraweeh reminders during Ramadan"
                checked={prefRamadan}
                onChange={(e) => setPrefRamadan(e.target.checked)}
              />

              <Checkbox
                label="Voluntary Prayers (Nafl)"
                description="Tahajjud, Ishraq, Awwabin reminders"
                checked={prefNaflSalahs}
                onChange={(e) => setPrefNaflSalahs(e.target.checked)}
              />

              <Checkbox
                label="Daily Hadith"
                description="One authentic hadith every day"
                checked={prefHadith}
                onChange={(e) => setPrefHadith(e.target.checked)}
              />

              <Checkbox
                label="Announcements & Events"
                description="Programs, Eid, special events from mosque"
                checked={prefAnnouncements}
                onChange={(e) => setPrefAnnouncements(e.target.checked)}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Bell className="w-5 h-5 mr-2" />
            Subscribe
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can update your preferences anytime from the Settings page.
          </p>
        </motion.form>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-primary" />
          </motion.div>

          <h3 className="text-xl font-semibold text-foreground mb-2">
            You&apos;re subscribed!
          </h3>

          <p className="text-muted-foreground mb-6">
            You&apos;ll receive notifications from {mosqueName} right on your device.
          </p>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-primary">
              <strong>Tip:</strong> Add this page to your home screen for the best experience.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array for PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
