interface SongLike {
  src?: string;
  neteaseId?: string;
}

export function getAudioUrl(song: SongLike): string {
  if (song.neteaseId) {
    return `/api/music-proxy?id=${song.neteaseId}`;
  }
  return song.src || "";
}
