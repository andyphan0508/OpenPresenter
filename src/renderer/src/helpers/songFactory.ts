import { LEGACY_CATEGORY_TO_BOOK } from '../constants/songbooks'
import type { Song } from '../types'
import { withMarkdownOrder } from './arrangement'
import { parseSongMarkdown } from './songMarkdown'

export type NewSong = Omit<Song, 'id' | 'createdAt' | 'updatedAt'>

// Everything a song derives from its markdown; keeps arrangements the user built by hand.
export function songFieldsFromMarkdown(markdown: string, existing?: Partial<Song>): NewSong {
  const p = parseSongMarkdown(markdown)
  return {
    tags: [],
    ...existing,
    title: p.title,
    author: p.author,
    key: p.key,
    copyright: p.copyright,
    ccli: p.ccli,
    songbooks: p.songbooks.length ? p.songbooks : (existing?.songbooks ?? []),
    slides: p.slides,
    rawMarkdown: markdown,
    ...withMarkdownOrder(existing ?? {}, p.order)
  }
}

// Songs saved by older versions: `category` slug instead of `songbooks`.
export function migrateSong(song: Song & { category?: string }): Song {
  if (song.songbooks) return song
  const { category, ...rest } = song
  const book = category && LEGACY_CATEGORY_TO_BOOK[category]
  return { ...rest, songbooks: book ? [{ book }] : [] }
}
