"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle } from "lucide-react";

interface AudioPlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  title: string;
  speaker?: string | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  audioRef,
  title,
  speaker,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      setError(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
      setError(false);
    };
    const handleError = () => {
      setIsPlaying(false);
      setError(true);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("error", handleError);

    // Sync initial state if audio is already playing
    setIsPlaying(!audio.paused);
    if (audio.duration) setDuration(audio.duration);
    if (audio.currentTime) setCurrentTime(audio.currentTime);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("error", handleError);
    };
  }, [audioRef]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError(true));
    }
  }, [audioRef, isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
      {/* Track info */}
      <div className="mb-3 text-center min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{title}</p>
        {speaker && (
          <p className="text-xs text-muted-foreground truncate">{speaker}</p>
        )}
        {error && (
          <p className="text-xs text-destructive flex items-center justify-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            Unable to play audio
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden mb-1">
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer -top-2.5"
            aria-label="Seek audio position"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleMute}
          className="p-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={togglePlay}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {hasNext && (
          <button
            onClick={onNext}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}

        {/* Spacer to balance mute button */}
        <div className="w-11" />
      </div>
    </div>
  );
}
