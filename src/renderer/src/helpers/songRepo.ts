import type { Song } from '../types'
import { songFieldsFromMarkdown, type NewSong } from './songFactory'

/**
 * Song repository index — the shareable "kho bài hát" format (a static JSON file, e.g. on GitHub):
 *   { "name": "...", "songs": [ { "id": "tc-001", "markdown": "# Title\n## Songbook: Thánh Ca 1\n...", "updatedAt": "ISO" } ] }
 * Build one from a folder of .md files with scripts/build-song-index.mjs.
 */
export interface SongIndex {
  name?: string
  songs: { id: string; markdown: string; updatedAt?: string }[]
}

export interface MergeResult {
  toAdd: NewSong[]
  toUpdate: { id: string; fields: NewSong }[]
  skippedEdited: string[] // titles the user changed locally since the last sync — never overwritten
  unchanged: number
}

export function parseSongIndex(json: string): SongIndex {
  const data = JSON.parse(json)
  if (!Array.isArray(data?.songs)) throw new Error('Không phải file kho bài hát (thiếu "songs")')
  return data
}

export function mergeSongIndex(local: Song[], index: SongIndex, now: string): MergeResult {
  const result: MergeResult = { toAdd: [], toUpdate: [], skippedEdited: [], unchanged: 0 }
  for (const remote of index.songs) {
    if (!remote?.id || typeof remote.markdown !== 'string') continue
    const existing = local.find((s) => s.sourceId === remote.id)
    if (!existing) {
      result.toAdd.push({ ...songFieldsFromMarkdown(remote.markdown), sourceId: remote.id, syncedAt: now })
      continue
    }
    if (existing.rawMarkdown === remote.markdown) {
      result.unchanged++
      continue
    }
    const editedLocally = existing.syncedAt && existing.updatedAt > existing.syncedAt
    if (editedLocally) {
      result.skippedEdited.push(existing.title)
      continue
    }
    result.toUpdate.push({ id: existing.id, fields: { ...songFieldsFromMarkdown(remote.markdown, existing), syncedAt: now } })
  }
  return result
}

export function exportSongIndex(songs: Song[], name: string): string {
  const index: SongIndex = {
    name,
    songs: songs.map((s) => ({ id: s.sourceId ?? s.id, markdown: s.rawMarkdown, updatedAt: s.updatedAt }))
  }
  return JSON.stringify(index, null, 2)
}
