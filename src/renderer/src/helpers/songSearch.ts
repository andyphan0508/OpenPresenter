import { songbookShort } from '../constants/songbooks'
import type { Song } from '../types'
import { normWords } from './text'

// Search title, author, lyrics and hymnal numbers ("tc 123", "123"), ignoring diacritics.
export function songMatches(song: Song, query: string): boolean {
  const q = normWords(query)
  if (!q) return true
  const refs = song.songbooks.map((b) => `${songbookShort(b.book)} ${b.number ?? ''} ${b.book} ${b.number ?? ''}`)
  const haystack = normWords(
    [song.title, song.author ?? '', ...refs, ...song.tags, ...song.slides.map((s) => s.content)].join(' ')
  )
  return q.split(' ').every((word) => haystack.includes(word))
}

export const songRefLabel = (song: Song) =>
  song.songbooks
    .filter((b) => b.number)
    .map((b) => `${songbookShort(b.book)} ${b.number}`)
    .join(' · ')
