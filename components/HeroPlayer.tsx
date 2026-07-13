"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Volume1, VolumeX } from "lucide-react";

interface Props {
  src?: string;
  title?: string;
  artist?: string;
}

export default function HeroPlayer({ src = "/maybe.mp3", title, artist }: Props) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVol, setShowVol] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={`flex items-center gap-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/[0.06] pl-4 pr-2 py-2 select-none transition-all hover:bg-white/[0.08] ${playing ? "music-playing" : ""}`}>
      <audio
        ref={audioRef}
        src={src}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <button
        onClick={toggle}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-all"
        aria-label={playing ? "暂停背景音乐" : "播放背景音乐"}
        type="button"
      >
        {playing ? (
          <Pause className="h-3 w-3 text-white fill-white" />
        ) : (
          <Play className="h-3 w-3 text-white ml-0.5 fill-white" />
        )}
      </button>

      <p className="text-xs text-white/80 font-medium truncate w-20">
        {title || "Maybe"}
      </p>

      {/* 音量 */}
      <div
        className="relative flex items-center shrink-0"
        onMouseEnter={() => setShowVol(true)}
        onMouseLeave={() => setShowVol(false)}
      >
        <button
          onClick={() => setVolume((v) => (v === 0 ? 0.5 : 0))}
          className="p-1 text-white/50 hover:text-white/80 transition-colors"
          aria-label={volume === 0 ? "打开音量" : "静音"}
          type="button"
        >
          <VolIcon className="h-3.5 w-3.5" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="背景音乐音量"
          className={`transition-all duration-200 ${
            showVol ? "w-16 opacity-100 ml-1" : "w-0 opacity-0"
          } h-1 rounded-full appearance-none bg-white/20 accent-white cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white`}
        />
      </div>
    </div>
  );
}
