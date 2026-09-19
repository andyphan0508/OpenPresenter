import { v4 as uuidv4 } from 'uuid'
import { DEMO_SONG_MARKDOWN } from '../../constants/demoSongs'
import { songFieldsFromMarkdown, type NewSong } from '../../helpers/songFactory'
import { songToMarkdown } from '../../helpers/songMarkdown'
import type { MergeResult } from '../../helpers/songRepo'
import type { Song } from '../../types'
import type { SliceCreator } from '../types'

export interface SongSlice {
  songs: Song[]
  addSong: (song: NewSong) => string
  updateSong: (id: string, updates: Partial<Song>) => void
  deleteSong: (id: string) => void
  importSongMarkdown: (markdown: string, songbook?: string) => string
  updateSongFromMarkdown: (id: string, markdown: string) => void
  applySongMerge: (result: MergeResult, at: string) => void
}

const now = () => new Date().toISOString()

const MARKDOWN_FIELDS: (keyof Song)[] = ['title', 'author', 'key', 'copyright', 'ccli', 'songbooks', 'slides', 'arrangements']

const newSong = (fields: NewSong, at = now()): Song => ({ ...fields, id: uuidv4(), createdAt: at, updatedAt: at })

export const createSongSlice: SliceCreator<SongSlice> = (set, get) => ({
  songs: DEMO_SONG_MARKDOWN.map((md) => newSong(songFieldsFromMarkdown(md))),

  addSong: (fields) => {
    const song = newSong(fields)
    set((s) => ({ songs: [...s.songs, song] }))
    return song.id
  },

  // Markdown stays the song's source of truth: structural edits regenerate it.
  updateSong: (id, updates) =>
    set((s) => ({
      songs: s.songs.map((song) => {
        if (song.id !== id) return song
        const next = { ...song, ...updates, updatedAt: now() }
        const structural = !updates.rawMarkdown && MARKDOWN_FIELDS.some((f) => f in updates)
        return structural ? { ...next, rawMarkdown: songToMarkdown(next) } : next
      })
    })),

  deleteSong: (id) => set((s) => ({ songs: s.songs.filter((song) => song.id !== id) })),

  importSongMarkdown: (markdown, songbook) => {
    const fields = songFieldsFromMarkdown(markdown)
    if (songbook && !fields.songbooks.length) fields.songbooks = [{ book: songbook }]
    return get().addSong(fields)
  },

  updateSongFromMarkdown: (id, markdown) => {
    const song = get().songs.find((s) => s.id === id)
    if (song) get().updateSong(id, songFieldsFromMarkdown(markdown, song))
  },

  // Synced songs get updatedAt === syncedAt so later local edits are detectable.
  applySongMerge: (result, at) =>
    set((s) => ({
      songs: [
        ...s.songs.map((song) => {
          const upd = result.toUpdate.find((u) => u.id === song.id)
          return upd ? { ...song, ...upd.fields, updatedAt: at, syncedAt: at } : song
        }),
        ...result.toAdd.map((fields) => newSong({ ...fields, syncedAt: at }, at))
      ]
    }))
})
