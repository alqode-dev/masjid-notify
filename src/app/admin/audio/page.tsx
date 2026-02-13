"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AudioCollectionDialog } from "@/components/admin/audio-collection-dialog";
import { AudioUploadDialog } from "@/components/admin/audio-upload-dialog";
import {
  FolderPlus,
  Upload,
  Pencil,
  Trash2,
  FolderOpen,
  ChevronLeft,
  Music,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import type { AudioCollection, AudioFile } from "@/lib/supabase";

type CollectionWithCount = AudioCollection & { file_count: number };

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPage() {
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionWithCount | null>(null);
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);

  // Dialog state
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<AudioCollection | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<AudioFile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/admin/audio/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load audio folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (collectionId: string) => {
    setFilesLoading(true);
    try {
      const response = await fetch(`/api/admin/audio/files?collectionId=${collectionId}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchFiles(selectedCollection.id);
    }
  }, [selectedCollection]);

  const handleSelectCollection = (collection: CollectionWithCount) => {
    setSelectedCollection(collection);
    setEditingFile(null);
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setFiles([]);
    setEditingFile(null);
    fetchCollections();
  };

  const handleEditCollection = (collection: CollectionWithCount) => {
    setEditingCollection(collection);
    setCollectionDialogOpen(true);
  };

  const handleNewCollection = () => {
    setEditingCollection(null);
    setCollectionDialogOpen(true);
  };

  const handleDeleteCollection = async (collection: CollectionWithCount) => {
    if (!confirm(`Delete "${collection.name}" and all ${collection.file_count} file(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audio/collections/${collection.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Folder deleted");
      if (selectedCollection?.id === collection.id) {
        handleBackToCollections();
      } else {
        fetchCollections();
      }
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const handleDeleteFile = async (file: AudioFile) => {
    if (!confirm(`Delete "${file.title}"? This cannot be undone.`)) return;

    setDeletingId(file.id);
    try {
      const response = await fetch(`/api/admin/audio/files/${file.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("File deleted");
      if (selectedCollection) fetchFiles(selectedCollection.id);
      fetchCollections();
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditFile = (file: AudioFile) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditSpeaker(file.speaker || "");
  };

  const handleSaveFileEdit = async () => {
    if (!editingFile || !editTitle.trim()) return;

    try {
      const response = await fetch(`/api/admin/audio/files/${editingFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), speaker: editSpeaker.trim() || null }),
      });
      if (!response.ok) throw new Error("Failed to update");
      toast.success("File updated");
      setEditingFile(null);
      if (selectedCollection) fetchFiles(selectedCollection.id);
    } catch {
      toast.error("Failed to update file");
    }
  };

  // Collections grid view
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Headphones className="w-6 h-6" />
              Audio Library
            </h1>
            <p className="text-muted-foreground">
              Manage audio recordings organized in folders
            </p>
          </div>
          <Button onClick={handleNewCollection}>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No folders yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first folder to start organizing audio files
            </p>
            <Button onClick={handleNewCollection}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors group relative"
                onClick={() => handleSelectCollection(collection)}
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditCollection(collection); }}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit folder"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(collection); }}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <FolderOpen className="w-10 h-10 text-primary mb-3" />
                <h3 className="font-semibold text-foreground text-sm truncate">{collection.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {collection.file_count} file{collection.file_count !== 1 ? "s" : ""}
                </p>
              </Card>
            ))}

            <Card
              className="p-4 cursor-pointer border-dashed hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[120px]"
              onClick={handleNewCollection}
            >
              <FolderPlus className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add Folder</span>
            </Card>
          </div>
        )}

        <AudioCollectionDialog
          open={collectionDialogOpen}
          onOpenChange={setCollectionDialogOpen}
          collection={editingCollection}
          onSaved={fetchCollections}
        />
      </div>
    );
  }

  // Files list view (collection selected)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <button
            onClick={handleBackToCollections}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to folders
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            {selectedCollection.name}
          </h1>
          <p className="text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleEditCollection(selectedCollection)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Folder
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {filesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No files yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload audio files to this folder
          </p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First File
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Speaker</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Size</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    {editingFile?.id === file.id ? (
                      <>
                        <td className="p-3" colSpan={3}>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Title"
                            />
                            <input
                              type="text"
                              value={editSpeaker}
                              onChange={(e) => setEditSpeaker(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Speaker (optional)"
                            />
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell"></td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" onClick={handleSaveFileEdit} disabled={!editTitle.trim()}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingFile(null)}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                              {file.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] flex-shrink-0 hidden sm:inline-flex">
                              {file.file_type.split("/").pop()?.toUpperCase()}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">
                          {file.speaker || "-"}
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">
                          {formatFileSize(file.file_size)}
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">
                          {formatDuration(file.duration)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditFile(file)}
                              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingId === file.id}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AudioCollectionDialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
        collection={editingCollection}
        onSaved={() => {
          fetchCollections();
          // Update selected collection name
          if (editingCollection?.id === selectedCollection.id) {
            fetchCollections().then(() => {
              // Re-select with updated data
              const response = fetch(`/api/admin/audio/collections`);
              response.then(r => r.json()).then(data => {
                const updated = data.collections?.find((c: CollectionWithCount) => c.id === selectedCollection.id);
                if (updated) setSelectedCollection(updated);
              });
            });
          }
        }}
      />

      <AudioUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        collectionId={selectedCollection.id}
        collectionName={selectedCollection.name}
        onUploaded={() => {
          fetchFiles(selectedCollection.id);
          fetchCollections();
        }}
      />
    </div>
  );
}
