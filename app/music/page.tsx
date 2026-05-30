"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Disc3 } from "lucide-react";
import Link from "next/link";
import VinylRecord from "@/components/VinylRecord";
import { getAudioUrl } from "@/lib/audio-url";

interface Song {
  id: string;
  title: string;
  artist: string;
  src?: string;
  neteaseId?: string;
  cover?: string;
}

export default function MusicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSongs(d); })
      .catch(() => {});
  }, []);

  const currentSong = currentIdx !== null ? songs[currentIdx] : null;

  const playSong = useCallback(
    (idx: number) => {
      if (idx === currentIdx) {
        const a = audioRef.current;
        if (!a) return;
        if (playing) { a.pause(); setPlaying(false); }
        else { a.play().then(() => setPlaying(true)).catch(() => {}); }
        return;
      }
      setCurrentIdx(idx);
      setPlaying(false);
      setTimeout(() => {
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
      }, 100);
    },
    [currentIdx, playing]
  );

  return (
    <div className="min-h-screen bg-background">
      <audio
        ref={audioRef}
        src={currentSong ? getAudioUrl(currentSong) : ""}
        onEnded={() => {
          if (currentIdx !== null && songs.length > 0) {
            playSong((currentIdx + 1) % songs.length);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* 顶部 */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          {currentSong && (
            <div className="flex items-center gap-2.5 text-sm text-muted">
              <Disc3
                className={`h-4 w-4 ${playing ? "text-white/80 animate-spin" : ""}`}
              />
              <span className="font-medium text-foreground">
                {currentSong.title}
              </span>
              <span>— {currentSong.artist}</span>
            </div>
          )}
        </div>

        <div className="mt-8 mb-6">
          <h1 className="section-heading">唱片柜</h1>
          <p className="mt-3 text-center text-[15px] text-muted">
            {songs.length} 张唱片 · 点击播放
          </p>
        </div>
      </div>

      {/* 唱片柜主体 */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        {songs.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <p className="text-lg">唱片柜是空的</p>
            <p className="mt-1 text-sm">在 content/music.json 中添加歌曲</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.06] bg-black/40 backdrop-blur-xl p-8">
            {Array.from({ length: Math.ceil(songs.length / 5) }).map(
              (_, rowIdx) => (
                <div key={rowIdx} className="mb-6 last:mb-0">
                  {/* 一行唱片 */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {songs.slice(rowIdx * 5, rowIdx * 5 + 5).map((song) => {
                      const idx = songs.indexOf(song);
                      return (
                        <VinylRecord
                          key={song.id}
                          song={song}
                          isPlaying={playing && currentIdx === idx}
                          isCurrent={currentIdx === idx}
                          onPlay={() => playSong(idx)}
                        />
                      );
                    })}
                  </div>

                  {/* 木质层板 — 只有不是最后一行时显示 */}
                  {rowIdx < Math.ceil(songs.length / 5) - 1 && (
                    <div className="mt-6 mb-2 flex items-center gap-3">
                      <div className="flex-1 h-[2px] rounded-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
