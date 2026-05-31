"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Music, ChevronUp, ChevronDown, Volume2, Disc3 } from "lucide-react";
import Link from "next/link";
import { getAudioUrl } from "@/lib/audio-url";

interface Song {
  id: string;
  title: string;
  artist: string;
  src?: string;
  neteaseId?: string;
  cover?: string;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSongs(d); })
      .catch(() => {});
  }, []);

  const song = songs[currentIdx];

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !song) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing, song]);

  const playSong = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setCurrentTime(0);
    setPlaying(false);
    setTimeout(() => {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    }, 50);
  }, []);

  const prev = () => { if (songs.length > 0) playSong((currentIdx - 1 + songs.length) % songs.length); };
  const next = () => { if (songs.length > 0) playSong((currentIdx + 1) % songs.length); };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // 拖拽
  const handleDragStart = (e: React.MouseEvent) => {
    movedRef.current = false;
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      movedRef.current = true;
      setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragStart]);

  if (songs.length === 0) return null;

  return (
    <div
      className="fixed z-[70] flex flex-col items-end gap-2"
      style={{ right: 24 - pos.x, bottom: 144 - pos.y }}
    >
      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={song ? getAudioUrl(song) : ""}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={next}
      />

      {/* 展开面板 */}
      {expanded && (
        <div className="w-64 animate-fade-in rounded-2xl border border-border bg-card/95 backdrop-blur-2xl p-4 shadow-lg">
          {/* 顶部：歌曲信息 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-accent via-accent-blue to-accent-cyan flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate">
                {song?.title || "未知歌曲"}
              </p>
              <p className="text-xs text-muted truncate">
                {song?.artist || ""}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-xs text-muted">
              <span>{currentIdx + 1}</span>
              <span>/</span>
              <span>{songs.length}</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 rounded-full appearance-none bg-black/[0.08] accent-accent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/10"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={prev} className="p-1.5 text-muted hover:text-foreground transition-colors">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform"
            >
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 ml-0.5 fill-current" />}
            </button>
            <button onClick={next} className="p-1.5 text-muted hover:text-foreground transition-colors">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* 音量 */}
          <div className="mt-3 flex items-center gap-2 text-muted">
            <Volume2 className="h-3.5 w-3.5 shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-full h-1 rounded-full appearance-none bg-black/[0.08] accent-accent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/10"
            />
          </div>

          {/* 跳转唱片柜 */}
          <Link
            href="/music"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted hover:text-foreground hover:border-black/15 transition-all"
          >
            <Disc3 className="h-3.5 w-3.5" />
            打开唱片柜
          </Link>

          {/* 歌单 */}
          <div className="mt-4 border-t border-border pt-3 max-h-40 overflow-y-auto space-y-0.5">
            {songs.map((s, i) => (
              <button
                key={s.id}
                onClick={() => playSong(i)}
                className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-all ${
                  i === currentIdx
                    ? "bg-white/5 text-white/80 font-medium"
                    : "text-muted hover:text-foreground hover:bg-black/[0.02]"
                }`}
              >
                <span className="truncate block">{s.title}</span>
                <span className="text-[10px] opacity-60">{s.artist}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 圆形开关按钮 */}
      <button
        onMouseDown={handleDragStart}
        onClick={() => { if (!movedRef.current) setExpanded(!expanded); }}
        className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing ${
          playing
            ? "bg-white/10 text-white"
            : "bg-card border border-border text-muted hover:text-foreground hover:scale-105"
        }`}
        title="音乐播放器"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <Music className="h-5 w-5" />
        )}
      </button>

      {/* 播放中指示 */}
      {playing && !expanded && (
        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white/10 animate-pulse" />
      )}
    </div>
  );
}
