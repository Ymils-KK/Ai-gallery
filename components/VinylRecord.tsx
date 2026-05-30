"use client";

import { Play, Pause } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  src?: string;
  neteaseId?: string;
  cover?: string;
}

interface Props {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: () => void;
}

export default function VinylRecord({ song, isPlaying, isCurrent, onPlay }: Props) {
  return (
    <div
      className="group relative cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={onPlay}
    >
      {/* 唱片槽 — 凹陷的槽位 */}
      <div className="relative rounded-xl bg-gradient-to-b from-black/[0.04] to-black/[0.02] p-2 pb-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06),inset_0_-1px_3px_rgba(0,0,0,0.03)]">

        {/* 唱片套 — 会从槽中升起 */}
        <div
          className="relative z-10 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateY(0) rotateX(0deg)",
          }}
        >
          <div
            className="relative transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-3"
            style={{ transformOrigin: "bottom center" }}
          >
            {/* 专辑封面 */}
            <div
              className={`relative aspect-square w-full overflow-hidden rounded-lg transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                isCurrent
                  ? "ring-[3px] ring-white/20 ring-offset-2 ring-offset-white shadow-lg "
                  : "shadow-md group-hover:shadow-xl"
              }`}
            >
              {song.cover ? (
                <img
                  src={song.cover}
                  alt={song.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent via-accent-blue to-accent-cyan">
                  <span className="text-3xl font-bold text-white/80">
                    {(song.title || "?")[0]}
                  </span>
                </div>
              )}

              {/* 悬停播放按钮 */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:bg-black/15">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-400 ${
                    isCurrent
                      ? "bg-white/10 text-white scale-100 opacity-100"
                      : "bg-white/95 text-foreground scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                  )}
                </div>
              </div>
            </div>

            {/* 黑胶唱片 — 从背后向右滑出 */}
            <div
              className="absolute top-[6%] -right-2 z-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                width: "88%",
                height: "88%",
                opacity: 0,
                transform: "translateX(0)",
              }}
            >
              <div
                className="h-full w-full rounded-full shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-[55%] group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #333 0%, #1a1a1a 8%, #111 9%, #1a1a1a 10%, #222 18%, #111 19%, #1a1a1a 20%, #222 28%, #111 29%, #1a1a1a 30%, #222 38%, #111 39%, #1a1a1a 40%, #222 48%, #111 49%, #1a1a1a 50%, #1a1a1a 100%)",
                }}
              >
                {/* 唱片中心标签 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[28%] aspect-square rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                  <span className="text-[7px] text-white font-bold text-center leading-tight px-1">
                    {song.title?.slice(0, 6) || "LP"}
                  </span>
                </div>
                {/* 中心孔 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] w-[3px] rounded-full bg-background" />
              </div>
            </div>
          </div>
        </div>

        {/* 歌曲信息 */}
        <div className="relative z-20 mt-2 text-center">
          <p
            className={`text-[13px] font-semibold truncate transition-colors duration-300 ${
              isCurrent ? "text-white/80" : "text-foreground group-hover:text-foreground/90"
            }`}
          >
            {song.title || "未知歌曲"}
          </p>
          <p className="text-[11px] text-muted truncate mt-0.5 transition-colors duration-300">
            {song.artist || ""}
          </p>
        </div>

        {/* 正在播放指示条 */}
        {isCurrent && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]">
            <span className="h-[3px] w-[3px] rounded-full bg-white/10 animate-pulse" />
            <span className="h-[3px] w-[3px] rounded-full bg-white/10 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <span className="h-[3px] w-[3px] rounded-full bg-white/10 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>
    </div>
  );
}
