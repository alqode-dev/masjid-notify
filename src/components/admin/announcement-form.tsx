"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, AlertCircle, Clock, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { MessageTemplates } from "./message-templates";

interface AnnouncementFormProps {
  mosqueId: string;
  mosqueName: string;
  activeSubscribers: number;
  onSent?: () => void;
}

type SendMode = "now" | "schedule";

export function AnnouncementForm({
  mosqueId,
  mosqueName,
  activeSubscribers,
  onSent,
}: AnnouncementFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // Get minimum datetime (5 minutes from now) for scheduling
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (sendMode === "schedule") {
      if (!scheduledDateTime) {
        toast.error("Please select a date and time for scheduling");
        return;
      }
      const scheduledDate = new Date(scheduledDateTime);
      const now = new Date();
      if (scheduledDate <= now) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }

    const confirmMessage =
      sendMode === "now"
        ? `Are you sure you want to send this announcement to ${activeSubscribers} subscriber${activeSubscribers !== 1 ? "s" : ""}?`
        : `Are you sure you want to schedule this announcement for ${new Date(scheduledDateTime).toLocaleString()}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);

    try {
      if (sendMode === "now") {
        const response = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mosque_id: mosqueId,
            content,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send announcement");
        }

        toast.success(`Announcement sent to ${data.sentCount} subscribers!`);
      } else {
        const response = await fetch("/api/admin/announcements/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mosque_id: mosqueId,
            content,
            scheduled_at: new Date(scheduledDateTime).toISOString(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to schedule announcement");
        }

        toast.success(
          `Announcement scheduled for ${new Date(scheduledDateTime).toLocaleString()}`
        );
      }

      setContent("");
      setScheduledDateTime("");
      setSendMode("now");
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const formattedPreview = `📢 ${mosqueName}\n\n${content}`;

  return (
    <div className="space-y-4">
      <MessageTemplates onSelectTemplate={(template) => setContent(template)} />

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>WhatsApp Policy:</strong> Custom messages can only be delivered
          to subscribers who have messaged your WhatsApp number within the last
          24 hours. Pre-approved templates (like prayer reminders) are not
          affected by this limit.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Message
        </label>
        <Textarea
          placeholder="Enter your announcement..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-muted-foreground">
            {content.length}/1000 characters
          </p>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-xs text-primary hover:underline"
          >
            {preview ? "Hide preview" : "Show preview"}
          </button>
        </div>
      </div>

      {preview && content && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">
              WhatsApp Preview:
            </p>
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
              {formattedPreview}
            </pre>
          </Card>
        </motion.div>
      )}

      {/* Send Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSendMode("now")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            sendMode === "now"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-input hover:border-primary/50"
          }`}
        >
          <Send className="w-4 h-4" />
          Send Now
        </button>
        <button
          type="button"
          onClick={() => setSendMode("schedule")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            sendMode === "schedule"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-input hover:border-primary/50"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
      </div>

      {/* Schedule Date/Time Picker */}
      {sendMode === "schedule" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <Input
            type="datetime-local"
            label="Schedule for"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            min={getMinDateTime()}
            hint="Select the date and time to send this announcement"
          />
        </motion.div>
      )}

      <div
        className={`flex items-center justify-between p-4 rounded-xl border ${
          sendMode === "schedule"
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-primary/5 border-primary/10"
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {sendMode === "schedule" ? (
            <>
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                Will be sent to <strong>{activeSubscribers}</strong> subscriber
                {activeSubscribers !== 1 ? "s" : ""} at scheduled time
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>
                This will be sent to <strong>{activeSubscribers}</strong> active
                subscriber{activeSubscribers !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        <Button
          onClick={handleSend}
          loading={loading}
          disabled={
            !content.trim() || (sendMode === "schedule" && !scheduledDateTime)
          }
        >
          {sendMode === "schedule" ? (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
