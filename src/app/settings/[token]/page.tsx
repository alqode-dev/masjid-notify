"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/footer";
import { CheckCircle, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Note: In a real implementation, you'd validate the token server-side
// and fetch the subscriber data. For MVP, this is a simplified version.

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
];

export default function SettingsPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Preferences
  const [reminderOffset, setReminderOffset] = useState("15");
  const [prefFajr, setPrefFajr] = useState(true);
  const [prefAllPrayers, setPrefAllPrayers] = useState(false);
  const [prefJumuah, setPrefJumuah] = useState(true);
  const [prefPrograms, setPrefPrograms] = useState(true);
  const [prefHadith, setPrefHadith] = useState(false);
  const [prefRamadan, setPrefRamadan] = useState(true);

  useEffect(() => {
    // Simulate loading subscriber data
    // In production, fetch from API using the token
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/settings/${token}`);
        if (response.ok) {
          const data = await response.json();
          setReminderOffset(data.reminder_offset?.toString() || "15");
          setPrefFajr(data.pref_fajr ?? true);
          setPrefAllPrayers(data.pref_all_prayers ?? false);
          setPrefJumuah(data.pref_jumuah ?? true);
          setPrefPrograms(data.pref_programs ?? true);
          setPrefHadith(data.pref_hadith ?? false);
          setPrefRamadan(data.pref_ramadan ?? true);
        } else {
          setError("Invalid or expired link");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/settings/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_offset: parseInt(reminderOffset),
          pref_fajr: prefFajr,
          pref_all_prayers: prefAllPrayers,
          pref_jumuah: prefJumuah,
          pref_programs: prefPrograms,
          pref_hadith: prefHadith,
          pref_ramadan: prefRamadan,
        }),
      });

      if (response.ok) {
        setSaved(true);
        toast.success("Settings saved!");
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Link Expired
            </h1>
            <p className="text-muted-foreground">
              This settings link is invalid or has expired. Please send SETTINGS
              to your mosque&apos;s WhatsApp number to get a new link.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="w-full max-w-md p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-xl font-bold text-foreground mb-2">
                Settings Saved!
              </h1>
              <p className="text-muted-foreground">
                Your notification preferences have been updated. You can close
                this page.
              </p>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Notification Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Update your preferences
              </p>
            </div>

            <div className="space-y-6">
              <Select
                label="Remind me"
                value={reminderOffset}
                onChange={(e) => setReminderOffset(e.target.value)}
                options={REMINDER_OPTIONS}
              />

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  What would you like to receive?
                </p>

                <Checkbox
                  label="Fajr reminders"
                  description="Wake up for Fajr on time"
                  checked={prefFajr}
                  onChange={(e) => setPrefFajr(e.target.checked)}
                />

                <Checkbox
                  label="All 5 daily prayers"
                  description="Reminders for every Salah"
                  checked={prefAllPrayers}
                  onChange={(e) => setPrefAllPrayers(e.target.checked)}
                />

                <Checkbox
                  label="Jumu'ah reminder"
                  description="Friday prayer notifications"
                  checked={prefJumuah}
                  onChange={(e) => setPrefJumuah(e.target.checked)}
                />

                <Checkbox
                  label="Program announcements"
                  description="Classes, events, and special programs"
                  checked={prefPrograms}
                  onChange={(e) => setPrefPrograms(e.target.checked)}
                />

                <Checkbox
                  label="Daily hadith"
                  description="Authentic hadith after Fajr"
                  checked={prefHadith}
                  onChange={(e) => setPrefHadith(e.target.checked)}
                />

                <Checkbox
                  label="Ramadan reminders"
                  description="Suhoor, Iftar, and Taraweeh notifications"
                  checked={prefRamadan}
                  onChange={(e) => setPrefRamadan(e.target.checked)}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                size="lg"
                loading={saving}
              >
                Save Preferences
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
