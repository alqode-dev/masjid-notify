"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, AlertCircle, Clock, Calendar, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { MessageTemplates } from "./message-templates";
import type { MessageAttachment } from "@/lib/supabase";

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
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get minimum datetime (5 minutes from now) for scheduling
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      return;
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        // Get signed upload URL
        const urlRes = await fetch("/api/admin/announcements/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        const urlData = await urlRes.json();
        if (!urlRes.ok) {
          throw new Error(urlData.error || "Failed to get upload URL");
        }

        // Upload file to Supabase Storage
        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file");
        }

        setAttachments((prev) => [
          ...prev,
          {
            type: urlData.fileType as "image" | "pdf",
            url: urlData.publicUrl,
            name: file.name,
            size: file.size,
          },
        ]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Failed to upload ${file.name}`
        );
      }
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
            attachments: attachments.length > 0 ? attachments : undefined,
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
      setAttachments([]);
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const formattedPreview = `${mosqueName} Announcement\n\n${content}`;

  return (
    <div className="space-y-4">
      <MessageTemplates onSelectTemplate={(template) => setContent(template)} />

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
        <p className="text-xs text-muted-foreground mt-1.5">
          Sent as a push notification with title &quot;{mosqueName} Announcement&quot;
        </p>
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

      {/* Attachments */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= 5}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
          {uploading ? "Uploading..." : "Attach images or PDF"}
          <span className="text-xs">({attachments.length}/5)</span>
        </button>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border text-sm"
              >
                {att.type === "image" ? (
                  <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && content && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">
              Notification Preview:
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
