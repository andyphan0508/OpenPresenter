import type { Song, SongSection } from '../types'
import { orderedSections } from './arrangement'
import { songToMarkdown } from './songMarkdown'

// OpenLyrics (https://docs.openlyrics.org) — the open XML song format OpenLP/FreeShow understand.

const CODE_TO_LABEL: Record<string, string> = {
  v: 'Verse', c: 'Chorus', b: 'Bridge', p: 'Pre-Chorus', i: 'Intro', e: 'Ending', o: 'Tag'
}
const TYPE_TO_CODE: Record<SongSection, string> = {
  verse: 'v', chorus: 'c', bridge: 'b', 'pre-chorus': 'p', intro: 'i', outro: 'e', tag: 'o'
}

// "v1" → "Verse 1", "c" → "Chorus", "v1a" → "Verse 1a"
function labelFromCode(code: string): string {
  const m = code.match(/^([a-z])(.*)$/i)
  if (!m) return code
  const base = CODE_TO_LABEL[m[1].toLowerCase()] ?? m[1]
  return m[2] ? `${base} ${m[2]}` : base
}

// <lines> text with <br/> as newlines; chords unwrapped, comments dropped.
function linesText(el: Element): string {
  let out = ''
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent?.replace(/\s*\n\s*/g, ' ') ?? ''
    else if (node instanceof Element) {
      if (node.localName === 'br') out += '\n'
      else if (node.localName !== 'comment') out += linesText(node)
    }
  })
  return out.trim()
}

// Returns song markdown, so imported songs go through the same parser as hand-typed ones.
export function openLyricsToMarkdown(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new Error('File OpenLyrics không hợp lệ')
  const all = (tag: string) => Array.from(doc.getElementsByTagName(tag))
  const text = (tag: string) => all(tag)[0]?.textContent?.trim() || undefined

  const verses = all('verse')
  const langs = [...new Set(verses.map((v) => v.getAttribute('lang') ?? ''))]
  const [primary, secondary] = langs
  const sections = verses
    .filter((v) => (v.getAttribute('lang') ?? '') === primary)
    .map((v) => {
      const name = v.getAttribute('name') ?? 'v'
      const lines = Array.from(v.getElementsByTagName('lines')).map(linesText).join('\n')
      const tr = secondary !== undefined
        ? verses.find((t) => t.getAttribute('name') === name && (t.getAttribute('lang') ?? '') === secondary)
        : undefined
      const translation = tr ? Array.from(tr.getElementsByTagName('lines')).map(linesText).join('\n') : undefined
      return { id: name, sectionType: 'verse' as const, sectionLabel: labelFromCode(name), content: lines, translation }
    })

  const order = text('verseOrder')?.split(/\s+/).map(labelFromCode)
  return songToMarkdown({
    title: text('title') ?? 'Untitled Song',
    author: all('author').filter((a) => a.getAttribute('type') !== 'translation').map((a) => a.textContent?.trim()).filter(Boolean).join(', ') || undefined,
    key: text('key'),
    copyright: text('copyright'),
    ccli: text('ccliNo'),
    songbooks: all('songbook').map((sb) => ({ book: sb.getAttribute('name') ?? '', number: sb.getAttribute('entry') ?? undefined })),
    slides: sections,
    arrangements: order ? [{ id: 'order', name: 'Mặc định', order }] : []
  })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const lines = (s: string) => `<lines>${s.split('\n').map(esc).join('<br/>')}</lines>`

export function songToOpenLyrics(song: Song): string {
  // Stable, unique OpenLyrics name per section label (v1, c, c2...).
  const codes = new Map<string, string>()
  for (const s of song.slides) {
    const base = TYPE_TO_CODE[s.sectionType] + (s.sectionLabel.match(/\d+/)?.[0] ?? '')
    let code = base
    for (let n = 2; [...codes.values()].includes(code); n++) code = `${base}.${n}`
    codes.set(s.sectionLabel.toLowerCase(), code)
  }
  const order = orderedSections(song).map((s) => codes.get(s.sectionLabel.toLowerCase())).join(' ')
  const props = [
    `<titles><title>${esc(song.title)}</title></titles>`,
    song.author && `<authors><author>${esc(song.author)}</author></authors>`,
    song.copyright && `<copyright>${esc(song.copyright)}</copyright>`,
    song.ccli && `<ccliNo>${esc(song.ccli)}</ccliNo>`,
    song.key && `<key>${esc(song.key)}</key>`,
    `<verseOrder>${order}</verseOrder>`,
    song.songbooks.length &&
      `<songbooks>${song.songbooks.map((b) => `<songbook name="${esc(b.book)}"${b.number ? ` entry="${esc(b.number)}"` : ''}/>`).join('')}</songbooks>`
  ].filter(Boolean)
  const verses = song.slides.flatMap((s) => {
    const name = codes.get(s.sectionLabel.toLowerCase())
    const out = [`<verse name="${name}" lang="vi">${lines(s.content)}</verse>`]
    if (s.translation) out.push(`<verse name="${name}" lang="en">${lines(s.translation)}</verse>`)
    return out
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.9" createdIn="OpenPresenter" modifiedIn="OpenPresenter" modifiedDate="${new Date().toISOString()}">
  <properties>
    ${props.join('\n    ')}
  </properties>
  <lyrics>
    ${verses.join('\n    ')}
  </lyrics>
</song>
`
}
