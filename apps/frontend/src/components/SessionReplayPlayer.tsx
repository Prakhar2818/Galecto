"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Maximize, Minimize, FastForward, AlertTriangle, Shield } from "lucide-react";

interface SessionReplayPlayerProps {
  events: any[];
  metadata?: {
    url?: string;
    userAgent?: string;
    startTime?: string;
    durationMs?: number;
    hasError?: boolean;
  };
}

export default function SessionReplayPlayer({ events, metadata }: SessionReplayPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const durationMs = metadata?.durationMs || 0;

  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;

    let rrwebPlayer: any;
    let interval: NodeJS.Timeout;

    const init = async () => {
      try {
        const { Replayer } = await import("rrweb");
        rrwebPlayer = new Replayer(events, {
          root: containerRef.current!,
          unpackFn: (ref: any) => ref,
          mouseTail: true,
          showWarning: false,
          showDebug: false,
        });
        playerRef.current = rrwebPlayer;
        setTotalTime(rrwebPlayer.getMetaData().totalTime);
        setIsReady(true);

        interval = setInterval(() => {
          if (rrwebPlayer) {
            setCurrentTime(rrwebPlayer.getCurrentTime());
          }
        }, 250);
      } catch (e) {
        console.error("Failed to initialize rrweb player:", e);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
      if (rrwebPlayer) {
        try {
          rrwebPlayer.pause();
        } catch {
          // ignore
        }
      }
      playerRef.current = null;
    };
  }, [events]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const restart = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.play(0);
    setIsPlaying(true);
  }, []);

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      if (!playerRef.current) return;
      playerRef.current.setSpeed(newSpeed);
      setSpeed(newSpeed);
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const seek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!playerRef.current) return;
      const time = parseInt(e.target.value, 10);
      playerRef.current.play(time);
      setCurrentTime(time);
      setIsPlaying(true);
    },
    []
  );

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <AlertTriangle className="w-10 h-10 mb-4 opacity-40" />
        <p className="text-sm font-medium">No replay events available</p>
        <p className="text-xs mt-1">Session may still be recording or was discarded.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading replay...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden">
      {/* Player viewport */}
      <div
        ref={containerRef}
        className="flex-grow relative overflow-auto bg-slate-900"
        onMouseEnter={() => setShowPrivacy(true)}
        onMouseLeave={() => setShowPrivacy(false)}
      />

      {/* Privacy overlay */}
      {showPrivacy && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Inputs masked</span>
          <span className="text-slate-400">|</span>
          <span>PII redacted</span>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-slate-800 px-6 py-3 flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={restart}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Timeline scrubber */}
        <div className="flex-grow flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={totalTime}
            value={currentTime}
            onChange={seek}
            className="flex-grow h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-xs text-slate-400 font-mono">{formatTime(totalTime)}</span>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-0.5">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                speed === s ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Metadata footer */}
      {metadata && (
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-2 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            {metadata.url && (
              <span className="truncate max-w-[200px]" title={metadata.url}>
                {metadata.url}
              </span>
            )}
            {metadata.userAgent && (
              <span className="truncate max-w-[200px]">{metadata.userAgent}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {metadata.hasError && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Contains Error</span>
            )}
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{events.length} events</span>
          </div>
        </div>
      )}
    </div>
  );
}
