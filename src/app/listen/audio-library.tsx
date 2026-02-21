"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayer } from "@/components/audio-player";
import {
  FolderOpen,
  ChevronLeft,
  Music,
  Play,
  Clock,
  Headphones,
} from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  file_count: number;
}

interface AudioFile {
  id: string;
  title: string;
  speaker: string | null;
  file_url: string;
  file_size: number | null;
  duration: number | null;
  file_type: string;
  sort_order: number;
}

interface AudioLibraryProps {
  mosqueName: string;
  initialCollections: Collection[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins} min`;
}

export function AudioLibrary({ mosqueName, initialCollections }: AudioLibraryProps) {
  const [collections] = useState<Collection[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchFiles = useCallback(async (collectionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/audio/${collectionId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchFiles(selectedCollection.id);
    }
  }, [selectedCollection, fetchFiles]);

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setCurrentTrack(null);
  };

  const handleBack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setSelectedCollection(null);
    setFiles([]);
    setCurrentTrack(null);
  };

  const handlePlayTrack = (file: AudioFile) => {
    setCurrentTrack(file);
    // Play synchronously within click handler — required for iOS Safari
    const audio = audioRef.current;
    if (audio) {
      audio.src = file.file_url;
      audio.load();
      audio.play().catch(() => {});
    }
  };

  const currentIndex = currentTrack ? files.findIndex((f) => f.id === currentTrack.id) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < files.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (!hasNext) return;
    const nextTrack = files[currentIndex + 1];
    setCurrentTrack(nextTrack);
    const audio = audioRef.current;
    if (audio) {
      audio.src = nextTrack.file_url;
      audio.load();
      audio.play().catch(() => {});
    }
  };

  const handlePrevious = () => {
    if (!hasPrevious) return;
    const prevTrack = files[currentIndex - 1];
    setCurrentTrack(prevTrack);
    const audio = audioRef.current;
    if (audio) {
      audio.src = prevTrack.file_url;
      audio.load();
      audio.play().catch(() => {});
    }
  };

  // Collections grid
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Headphones className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h2 className="text-xl font-bold text-foreground mb-1">Audio Library</h2>
          <p className="text-sm text-muted-foreground">{mosqueName}</p>
        </motion.div>

        {collections.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No audio available yet</h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for lectures and recordings
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <Card
                  className="p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                  onClick={() => handleSelectCollection(collection)}
                >
                  <FolderOpen className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-foreground mb-1">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {collection.file_count} file{collection.file_count !== 1 ? "s" : ""}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // File list with player
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to collections
        </button>
        <h2 className="text-xl font-bold text-foreground">{selectedCollection.name}</h2>
        {selectedCollection.description && (
          <p className="text-sm text-muted-foreground mt-1">{selectedCollection.description}</p>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No files in this collection yet</p>
        </Card>
      ) : (
        <div className="space-y-2 pb-24">
          {files.map((file, index) => {
            const isActive = currentTrack?.id === file.id;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "hover:border-primary/30 hover:bg-accent/50"
                  }`}
                  onClick={() => handlePlayTrack(file)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Play className={`w-4 h-4 ${isActive ? "" : "ml-0.5"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                        {file.title}
                      </p>
                      {file.speaker && (
                        <p className="text-xs text-muted-foreground truncate">{file.speaker}</p>
                      )}
                    </div>
                    {file.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDuration(file.duration)}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Persistent audio element — always mounted so iOS remembers user activation */}
      <audio
        ref={audioRef}
        playsInline
        preload="metadata"
        onEnded={hasNext ? handleNext : undefined}
      />

      {/* Sticky player at bottom */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4"
          >
            <AudioPlayer
              audioRef={audioRef}
              title={currentTrack.title}
              speaker={currentTrack.speaker}
              onNext={hasNext ? handleNext : undefined}
              onPrevious={hasPrevious ? handlePrevious : undefined}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
