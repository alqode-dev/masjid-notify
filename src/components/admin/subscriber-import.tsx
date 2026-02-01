"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase";
import { isValidSAPhoneNumber, formatPhoneNumber } from "@/lib/utils";

interface ParsedSubscriber {
  phone: string;
  formattedPhone: string;
  valid: boolean;
  error?: string;
}

interface SubscriberImportProps {
  mosqueId: string;
  onImportComplete?: () => void;
}

export function SubscriberImport({ mosqueId, onImportComplete }: SubscriberImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSubscriber[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, duplicates: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

    // Skip header row if it exists
    const startIndex = lines[0]?.toLowerCase().includes("phone") ? 1 : 0;

    const parsed: ParsedSubscriber[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Handle CSV with commas in values (basic parsing)
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const phone = values[0];

      if (!phone) continue;

      const isValid = isValidSAPhoneNumber(phone);
      parsed.push({
        phone,
        formattedPhone: isValid ? formatPhoneNumber(phone) : phone,
        valid: isValid,
        error: isValid ? undefined : "Invalid SA phone number",
      });
    }

    setParsedData(parsed);
    setStep("preview");
  };

  const handleImport = async () => {
    const validSubscribers = parsedData.filter((s) => s.valid);

    if (validSubscribers.length === 0) {
      toast.error("No valid phone numbers to import");
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    const supabase = createClientSupabase();

    for (const subscriber of validSubscribers) {
      try {
        const { error } = await supabase.from("subscribers").insert({
          phone_number: subscriber.formattedPhone,
          mosque_id: mosqueId,
          status: "active",
          pref_daily_prayers: true,
          pref_jumuah: true,
          pref_ramadan: true,
          pref_hadith: true,
          pref_announcements: true,
          reminder_offset: 15,
        });

        if (error) {
          if (error.code === "23505") {
            // Unique constraint violation
            duplicates++;
          } else {
            failed++;
          }
        } else {
          success++;
        }
      } catch {
        failed++;
      }
    }

    setImportResults({ success, failed, duplicates });
    setStep("complete");
    setImporting(false);

    if (success > 0) {
      toast.success(`Successfully imported ${success} subscribers`);
      onImportComplete?.();
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setStep("upload");
    setImportResults({ success: 0, failed: 0, duplicates: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  const validCount = parsedData.filter((s) => s.valid).length;
  const invalidCount = parsedData.filter((s) => !s.valid).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Subscribers</DialogTitle>
          <DialogDescription>
            Upload a CSV file with phone numbers to bulk import subscribers
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium mb-1">
                  Click to upload CSV file
                </p>
                <p className="text-xs text-muted-foreground">
                  One phone number per line
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  CSV Format Example:
                </p>
                <pre className="text-xs text-muted-foreground">
                  phone{"\n"}0823456789{"\n"}+27834567890{"\n"}27845678901
                </pre>
              </div>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-500">
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">{invalidCount} invalid</Badge>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Phone</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 50).map((sub, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2 font-mono text-xs">
                          {sub.formattedPhone}
                        </td>
                        <td className="p-2">
                          {sub.valid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-red-500">
                              <X className="w-4 h-4" />
                              <span className="text-xs">{sub.error}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 50 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    Showing first 50 of {parsedData.length} entries
                  </p>
                )}
              </div>

              {invalidCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-700 dark:text-amber-400">
                    {invalidCount} invalid phone numbers will be skipped
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-center py-4"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Import Complete
                </h3>
                <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                  <p>
                    <span className="text-green-500 font-medium">
                      {importResults.success}
                    </span>{" "}
                    subscribers imported
                  </p>
                  {importResults.duplicates > 0 && (
                    <p>
                      <span className="text-amber-500 font-medium">
                        {importResults.duplicates}
                      </span>{" "}
                      duplicates skipped
                    </p>
                  )}
                  {importResults.failed > 0 && (
                    <p>
                      <span className="text-red-500 font-medium">
                        {importResults.failed}
                      </span>{" "}
                      failed
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                loading={importing}
              >
                Import {validCount} Subscribers
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
