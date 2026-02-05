"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Select } from "./ui/select";
import { isValidSAPhoneNumber } from "@/lib/utils";
import { REMINDER_OPTIONS } from "@/lib/constants";
import { CheckCircle, MessageCircle } from "lucide-react";

interface SubscribeFormProps {
  mosqueName: string;
  mosqueId: string;
}

// Add "(Recommended)" label for subscribe form
const SUBSCRIBE_REMINDER_OPTIONS = REMINDER_OPTIONS.map((opt) =>
  opt.value === "15"
    ? { ...opt, label: "15 minutes before (Recommended)" }
    : opt
);

export function SubscribeForm({ mosqueName, mosqueId }: SubscribeFormProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [reminderOffset, setReminderOffset] = useState("15");

  // Preferences (6 options)
  const [prefDailyPrayers, setPrefDailyPrayers] = useState(true);
  const [prefJumuah, setPrefJumuah] = useState(true);
  const [prefRamadan, setPrefRamadan] = useState(true);
  const [prefNaflSalahs, setPrefNaflSalahs] = useState(false);
  const [prefHadith, setPrefHadith] = useState(true);
  const [prefAnnouncements, setPrefAnnouncements] = useState(true);

  const validatePhone = () => {
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (!isValidSAPhoneNumber(phone)) {
      setPhoneError("Please enter a valid South African phone number");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhone()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
          mosque_id: mosqueId,
          reminder_offset: parseInt(reminderOffset, 10),
          pref_daily_prayers: prefDailyPrayers,
          pref_jumuah: prefJumuah,
          pref_ramadan: prefRamadan,
          pref_nafl_salahs: prefNaflSalahs,
          pref_hadith: prefHadith,
          pref_announcements: prefAnnouncements,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === "form" ? (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Phone Input */}
          <Input
            label="WhatsApp Number"
            type="tel"
            placeholder="081 234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={validatePhone}
            error={phoneError}
            hint="We'll send updates to this number"
          />

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

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <MessageCircle className="w-5 h-5 mr-2" />
            Subscribe via WhatsApp
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By subscribing, you agree to receive messages on WhatsApp.
            <br />
            Reply STOP anytime to unsubscribe.
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
            Check your WhatsApp for a confirmation message from {mosqueName}.
          </p>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-primary">
              <strong>Tip:</strong> Save our number to ensure you receive all
              notifications.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
