"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { AudioCollection } from "@/lib/supabase";

interface AudioCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: AudioCollection | null;
  onSaved: () => void;
}

export function AudioCollectionDialog({
  open,
  onOpenChange,
  collection,
  onSaved,
}: AudioCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = !!collection;

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [collection, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/audio/collections/${collection.id}`
        : "/api/admin/audio/collections";

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success(isEdit ? "Folder updated" : "Folder created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save folder");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Folder" : "New Folder"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the folder name and description"
              : "Create a new folder to organize audio files"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="e.g. Tafsir, Seerah, Friday Talks"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of this folder"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            loading={saving}
          >
            {isEdit ? "Save Changes" : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
