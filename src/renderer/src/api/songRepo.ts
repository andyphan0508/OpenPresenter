import { parseSongIndex, type SongIndex } from '../helpers/songRepo'

export async function fetchSongIndex(url: string): Promise<SongIndex> {
  const res = await window.api.net.fetchText(url)
  if (!res.ok) throw new Error(res.error)
  return parseSongIndex(res.text)
}
