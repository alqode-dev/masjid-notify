"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { REMINDER_OPTIONS } from "@/lib/constants";
import { Settings, Pause, Play, UserX, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SubscriberSettings {
  id: string;
  status: string;
  pause_until: string | null;
  pref_daily_prayers: boolean;
  pref_jumuah: boolean;
  pref_ramadan: boolean;
  pref_nafl_salahs: boolean;
  pref_hadith: boolean;
  pref_announcements: boolean;
  reminder_offset: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SubscriberSettings | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subscriberId, setSubscriberId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("subscriberId");
    if (!id) {
      setError("No subscription found. Please subscribe first.");
      setLoading(false);
      return;
    }
    setSubscriberId(id);

    fetch(`/api/settings?subscriberId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSettings(data);
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings || !subscriberId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberId,
          pref_daily_prayers: settings.pref_daily_prayers,
          pref_jumuah: settings.pref_jumuah,
          pref_ramadan: settings.pref_ramadan,
          pref_nafl_salahs: settings.pref_nafl_salahs,
          pref_hadith: settings.pref_hadith,
          pref_announcements: settings.pref_announcements,
          reminder_offset: settings.reminder_offset,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Settings saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePauseResume = async () => {
    if (!subscriberId) return;
    setSaving(true);
    setError("");

    try {
      const isPaused = settings?.status === "paused";
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberId,
          status: isPaused ? "active" : "paused",
          pause_until: isPaused ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings((prev) => prev ? { ...prev, status: isPaused ? "active" : "paused" } : null);
      setSuccess(isPaused ? "Notifications resumed!" : "Notifications paused for 7 days.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriberId) return;
    if (!confirm("Are you sure you want to unsubscribe? You will stop receiving all notifications.")) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/settings/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.removeItem("subscriberId");
      setSettings(null);
      setSuccess("You have been unsubscribed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-4">{error || "No subscription found."}</p>
          {success && <p className="text-primary mb-4">{success}</p>}
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
        </div>

        {settings.status === "paused" && (
          <div className="p-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
            Notifications are paused. Tap Resume to start receiving again.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Select
            label="Remind me"
            value={String(settings.reminder_offset)}
            onChange={(e) => setSettings({ ...settings, reminder_offset: parseInt(e.target.value, 10) })}
            options={REMINDER_OPTIONS}
          />

          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">Notification preferences</p>
            <div className="space-y-3">
              <Checkbox label="All 5 Daily Prayers" description="Fajr, Dhuhr, Asr, Maghrib, Isha" checked={settings.pref_daily_prayers} onChange={(e) => setSettings({ ...settings, pref_daily_prayers: e.target.checked })} />
              <Checkbox label="Jumu'ah Reminder" description="Friday prayer notification" checked={settings.pref_jumuah} onChange={(e) => setSettings({ ...settings, pref_jumuah: e.target.checked })} />
              <Checkbox label="Ramadan Mode" description="Suhoor, Iftar, Taraweeh" checked={settings.pref_ramadan} onChange={(e) => setSettings({ ...settings, pref_ramadan: e.target.checked })} />
              <Checkbox label="Voluntary Prayers" description="Tahajjud, Ishraq, Awwabin" checked={settings.pref_nafl_salahs} onChange={(e) => setSettings({ ...settings, pref_nafl_salahs: e.target.checked })} />
              <Checkbox label="Daily Hadith" description="One hadith every day" checked={settings.pref_hadith} onChange={(e) => setSettings({ ...settings, pref_hadith: e.target.checked })} />
              <Checkbox label="Announcements" description="Programs, events from mosque" checked={settings.pref_announcements} onChange={(e) => setSettings({ ...settings, pref_announcements: e.target.checked })} />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-primary text-sm">{success}</p>}

          <Button onClick={handleSave} className="w-full" loading={saving}>
            Save Preferences
          </Button>

          <div className="border-t pt-4 space-y-3">
            <Button onClick={handlePauseResume} variant="outline" className="w-full" loading={saving}>
              {settings.status === "paused" ? (
                <><Play className="w-4 h-4 mr-2" /> Resume Notifications</>
              ) : (
                <><Pause className="w-4 h-4 mr-2" /> Pause for 7 Days</>
              )}
            </Button>

            <Button onClick={handleUnsubscribe} variant="destructive" className="w-full" loading={saving}>
              <UserX className="w-4 h-4 mr-2" />
              Unsubscribe
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
