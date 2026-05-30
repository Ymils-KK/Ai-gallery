interface SongLike {
  src?: string;
  neteaseId?: string;
}

export function getAudioUrl(song: SongLike): string {
  if (song.neteaseId) {
    return `https://music.163.com/song/media/outer/url?id=${song.neteaseId}.mp3`;
  }
  return song.src || "";
}
