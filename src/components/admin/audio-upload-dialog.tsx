"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Music, Check } from "lucide-react";
import { toast } from "sonner";

interface AudioUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionName: string;
  onUploaded: () => void;
}

type UploadStep = "select" | "details" | "uploading" | "done";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AudioUploadDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
  onUploaded,
}: AudioUploadDialogProps) {
  const [step, setStep] = useState<UploadStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please select an MP3, M4A, or AAC file");
      return;
    }

    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error("File size exceeds 500MB limit");
      return;
    }

    setFile(selectedFile);
    // Auto-fill title from filename (remove extension)
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    setTitle(nameWithoutExt);
    setStep("details");
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setUploading(true);
    setStep("uploading");
    setProgress(0);

    try {
      // Step 1: Get signed upload URL
      const urlResponse = await fetch("/api/admin/audio/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          collectionId,
          fileSize: file.size,
        }),
      });

      if (!urlResponse.ok) {
        const data = await urlResponse.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { signedUrl, filePath, publicUrl } = await urlResponse.json();

      // Step 2: Upload file directly to Supabase Storage via XHR (for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Extract audio duration client-side
      let duration: number | null = null;
      try {
        duration = await new Promise<number>((resolve, reject) => {
          const audio = new Audio(publicUrl);
          audio.addEventListener("loadedmetadata", () => {
            resolve(Math.round(audio.duration));
          });
          audio.addEventListener("error", () => reject(new Error("Could not read duration")));
          // Timeout after 10s
          setTimeout(() => reject(new Error("Duration extraction timeout")), 10000);
        });
      } catch {
        // Duration extraction is optional, continue without it
        console.warn("Could not extract audio duration");
      }

      // Step 4: Register file in database
      const fileResponse = await fetch("/api/admin/audio/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          title: title.trim(),
          speaker: speaker.trim() || null,
          filePath,
          fileUrl: publicUrl,
          fileSize: file.size,
          duration,
          fileType: file.type,
        }),
      });

      if (!fileResponse.ok) {
        const data = await fileResponse.json();
        throw new Error(data.error || "Failed to register file");
      }

      setStep("done");
      toast.success("Audio file uploaded successfully");
      onUploaded();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setStep("details");
    } finally {
      setUploading(false);
      xhrRef.current = null;
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle("");
    setSpeaker("");
    setProgress(0);
    setStep("select");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (uploading) {
      xhrRef.current?.abort();
    }
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Audio</DialogTitle>
          <DialogDescription>
            Upload to &quot;{collectionName}&quot;
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                tabIndex={0}
                role="button"
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium mb-1">
                  Click to select audio file
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, M4A, or AAC (max 500MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {step === "details" && file && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Music className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {file.name.split(".").pop()?.toUpperCase()}
                </Badge>
              </div>

              <Input
                label="Title"
                placeholder="e.g. Surah Baqarah - Part 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={500}
              />

              <Input
                label="Speaker (optional)"
                placeholder="e.g. Moulana Ali"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
              />
            </motion.div>
          )}

          {step === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <div className="text-center mb-4">
                <Upload className="w-10 h-10 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-sm font-medium text-foreground">Uploading...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file && formatFileSize(file.size)} &middot; {progress}%
                </p>
              </div>

              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {progress < 100 && (
                <p className="text-xs text-center text-muted-foreground">
                  Please keep this window open until upload completes
                </p>
              )}
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-center py-4"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Upload Complete</h3>
                <p className="text-sm text-muted-foreground mt-1">{title}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {step === "select" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === "details" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!title.trim()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </>
          )}
          {step === "uploading" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel Upload
            </Button>
          )}
          {step === "done" && (
            <>
              <Button variant="outline" onClick={() => { handleReset(); }}>
                Upload Another
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
