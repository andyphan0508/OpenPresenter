import type { Slide, SlideGroup, Song } from '../types'
import { serviceItems } from './serviceItems'
import { songFieldsFromMarkdown, type NewSong } from './songFactory'
import { songItems, type GroupItem } from './slideFactory'
import { norm } from './text'

/**
 * Weekly program from the BTNSG dashboard — GET <api>/program[?date=YYYY-MM-DD]:
 *   { "version": 1, "program": { id, date, title, updatedAt, items: ProgramItem[] } }
 * Contract lives with the dashboard in btnsg packages/shared/src/index.ts (ProgramItem); change both together.
 */
export interface ProgramSong {
  title: string
  book?: string
  number?: string
  lyrics?: string
}

export interface ProgramItem {
  id: string
  kind: 'text' | 'bible' | 'song'
  label: string
  text?: string
  ref?: string
  song?: ProgramSong
  note?: string
}

export interface Program {
  id: string
  date: string
  title: string
  updatedAt: string
  items: ProgramItem[]
}

// What one program item turns into locally. `status` drives the preview; `sig` decides re-sync.
export interface ResolvedItem {
  item: ProgramItem
  title: string
  kind: SlideGroup['kind']
  slides: GroupItem[]
  status: 'ok' | 'new-song' | 'missing'
  newSong?: NewSong // lyrics came from the dashboard: add to the library
  sig: string
}

export function parseProgram(json: string): Program {
  const data = JSON.parse(json)
  const p = data?.program
  if (data?.version !== 1 || !p?.id || !Array.isArray(p.items)) throw new Error('Không phải dữ liệu chương trình (API version 1)')
  return p
}

export const programName = (p: Program) => p.title || `Chúa Nhật ${p.date.split('-').reverse().join('/')}`

// Hymnal + number first (only when both are given — numbers repeat across hymnals), then exact title.
export function findSong(songs: Song[], s: ProgramSong): Song | undefined {
  if (s.book && s.number) {
    const book = norm(s.book)
    const num = (n?: string) => n?.replace(/^0+/, '')
    const hit = songs.find((x) => x.songbooks.some((b) => num(b.number) === num(s.number) && norm(b.book) === book))
    if (hit) return hit
  }
  const title = norm(s.title)
  return title ? songs.find((x) => norm(x.title) === title) : undefined
}

// Lyrics pasted on the dashboard → song markdown. Without [Section] headers each paragraph is a verse.
export function lyricsMarkdown(s: ProgramSong): string {
  const body = (s.lyrics ?? '').trim()
  if (body.startsWith('# ')) return body
  const head = [`# ${s.title}`, ...(s.book ? [`## Songbook: ${s.book}${s.number ? ` ${s.number}` : ''}`] : [])]
  const sections = /^\[[^\]]+\]$/m.test(body)
    ? body
    : body.split(/\n\s*\n/).map((p, i) => `[Verse ${i + 1}]\n${p.trim()}`).join('\n\n')
  return [...head, '', sections].join('\n')
}

/**
 * Program item → slides. `passage` looks a Bible reference up (IPC in the app, a stub in tests).
 * Every item yields at least one slide so it keeps its place in the service order.
 */
export async function resolveItem(
  item: ProgramItem,
  songs: Song[],
  passage: (ref: string) => Promise<GroupItem[] | undefined>
): Promise<ResolvedItem> {
  const label = item.label || item.song?.title || item.ref || 'Mục'
  const base = { item, title: label, kind: item.kind, sig: '' }
  const placeholder = (content: string) => [{ label, content }]
  let r: Omit<ResolvedItem, 'sig'>

  if (item.kind === 'song') {
    const s = item.song ?? { title: '' }
    const title = s.title || label
    const found = findSong(songs, s)
    if (found) r = { ...base, title: found.title, slides: songItems(found), status: 'ok' }
    else if (s.lyrics) {
      const newSong = songFieldsFromMarkdown(lyricsMarkdown({ ...s, title }))
      r = { ...base, title, slides: songItems(newSong), status: 'new-song', newSong }
    } else r = { ...base, title, slides: placeholder(title), status: 'missing' }
  } else if (item.kind === 'bible') {
    const verses = item.ref ? await passage(item.ref) : undefined
    r = verses?.length
      ? { ...base, title: `${label} — ${item.ref}`, slides: verses, status: 'ok' }
      : { ...base, slides: placeholder(item.ref ? `${label}\n${item.ref}` : label), status: 'missing' }
  } else {
    r = { ...base, slides: placeholder(item.text || label), status: 'ok' }
  }
  // A missing song/verse rebuilds on the next sync once it can be found.
  return { ...r, sig: JSON.stringify(item) + (r.status === 'missing' ? '#missing' : '') }
}

export interface BuiltItem {
  itemId: string
  sig: string
  slides: Slide[]
}

/**
 * Re-sync keeps the operator's work: program items that did not change keep their (possibly edited) slides,
 * and items added by hand stay right after the program item they followed.
 * ponytail: program items deleted locally come back on re-sync; add a "hidden" marker if that annoys people.
 */
export function mergeProgramSlides(local: Slide[], fresh: BuiltItem[]): Slide[] {
  const kept = new Map<string, Slide[]>()
  const manual = new Map<string, Slide[]>() // program item id ('' = before any) → hand-added slides after it
  let anchor = ''
  for (const item of serviceItems(local)) {
    const p = item.group?.programItem
    if (p) {
      anchor = p.id
      if (fresh.some((f) => f.itemId === p.id && f.sig === p.sig)) kept.set(p.id, item.slides)
    } else manual.set(anchor, [...(manual.get(anchor) ?? []), ...item.slides])
  }
  const out = [...(manual.get('') ?? [])]
  manual.delete('')
  for (const f of fresh) {
    out.push(...(kept.get(f.itemId) ?? f.slides), ...(manual.get(f.itemId) ?? []))
    manual.delete(f.itemId)
  }
  for (const orphans of manual.values()) out.push(...orphans) // their program item was removed
  return out
}
