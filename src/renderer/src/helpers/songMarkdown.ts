import { v4 as uuidv4 } from 'uuid'
import { SECTION_KEYWORDS } from '../constants/sections'
import type { Song, SongbookRef, SongSection, SongSlide } from '../types'
import { normWords } from './text'

export interface ParsedSong {
  title: string
  author?: string
  key?: string
  copyright?: string
  ccli?: string
  songbooks: SongbookRef[]
  order?: string[]
  slides: SongSlide[]
}

const META = /^##\s*(Author|Key|Order|Songbook|Copyright|CCLI)\s*:\s*(.*)$/i
const TRANSLATION_DIVIDER = /^-{3,}$/

export function sectionTypeOf(label: string): SongSection {
  const n = normWords(label)
  return SECTION_KEYWORDS.find(([kw]) => n.includes(kw))?.[1] ?? 'verse'
}

// "Thánh Ca 123" → { book: 'Thánh Ca', number: '123' }
function parseSongbook(value: string): SongbookRef {
  const m = value.trim().match(/^(.*?)\s*#?(\d+[a-z]?)$/i)
  return m && m[1] ? { book: m[1].trim(), number: m[2] } : { book: value.trim() }
}

// Section body: lines after a "---" line are the translation (second language).
function splitTranslation(lines: string[]): Pick<SongSlide, 'content' | 'translation'> {
  const i = lines.findIndex((l) => TRANSLATION_DIVIDER.test(l.trim()))
  if (i < 0) return { content: lines.join('\n').trim() }
  const translation = lines.slice(i + 1).join('\n').trim()
  return { content: lines.slice(0, i).join('\n').trim(), translation: translation || undefined }
}

/**
 * Song markdown:
 *   # Title
 *   ## Author: … / ## Key: G / ## Songbook: Thánh Ca 123 / ## Copyright: … / ## CCLI: …
 *   ## Order: Verse 1, Chorus, Verse 2, Chorus
 *   [Verse 1]
 *   lyrics…
 *   ---
 *   translation…
 */
export function parseSongMarkdown(markdown: string): ParsedSong {
  const parsed: ParsedSong = { title: 'Untitled Song', songbooks: [], slides: [] }
  let section: Omit<SongSlide, 'content'> | null = null
  let body: string[] = []

  const flush = () => {
    if (section && body.some((l) => l.trim())) parsed.slides.push({ ...section, ...splitTranslation(body) })
    body = []
  }

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('# ')) {
      parsed.title = trimmed.slice(2).trim()
      continue
    }

    const meta = trimmed.match(META)
    if (meta) {
      const [, field, value] = meta
      switch (field.toLowerCase()) {
        case 'author': parsed.author = value.trim(); break
        case 'key': parsed.key = value.trim(); break
        case 'copyright': parsed.copyright = value.trim(); break
        case 'ccli': parsed.ccli = value.trim(); break
        case 'songbook': parsed.songbooks.push(parseSongbook(value)); break
        case 'order': parsed.order = value.split(',').map((l) => l.trim()).filter(Boolean); break
      }
      continue
    }

    const header = trimmed.match(/^\[([^\]]+)\]$/) || trimmed.match(/^##\s+(.+)$/)
    if (header) {
      flush()
      section = { id: uuidv4(), sectionType: sectionTypeOf(header[1]), sectionLabel: header[1].trim() }
      continue
    }

    if (section) body.push(line)
  }
  flush()

  // No section headers: whole text is one verse.
  if (parsed.slides.length === 0 && markdown.trim()) {
    parsed.slides.push({ id: uuidv4(), sectionType: 'verse', sectionLabel: 'Verse 1', content: markdown.trim() })
  }
  return parsed
}

// Inverse of parseSongMarkdown, used when songs arrive from OpenLyrics or are edited section-by-section.
export function songToMarkdown(song: Pick<Song, 'title' | 'author' | 'key' | 'copyright' | 'ccli' | 'songbooks' | 'slides' | 'arrangements'>): string {
  const lines = [`# ${song.title}`]
  if (song.author) lines.push(`## Author: ${song.author}`)
  if (song.key) lines.push(`## Key: ${song.key}`)
  for (const sb of song.songbooks) lines.push(`## Songbook: ${sb.book}${sb.number ? ` ${sb.number}` : ''}`)
  if (song.copyright) lines.push(`## Copyright: ${song.copyright}`)
  if (song.ccli) lines.push(`## CCLI: ${song.ccli}`)
  const order = song.arrangements?.[0]?.order
  if (order?.length) lines.push(`## Order: ${order.join(', ')}`)
  for (const s of song.slides) {
    lines.push('', `[${s.sectionLabel}]`, s.content)
    if (s.translation) lines.push('---', s.translation)
  }
  return lines.join('\n') + '\n'
}
