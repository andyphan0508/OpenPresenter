/**
 * Thánh Ca HTTLVN (https://thanhca.httlvn.org/thanh-ca-{n}) → song markdown.
 * Page shape: <h1><small>Thánh Ca 29</small> Title</h1>, two author cells, then
 * <div id="lyric-content"> with "Câu 1" / "Điệp khúc" header lines and the lyrics as <p> lines.
 */
export const THANHCA_BOOK = 'Thánh Ca'
export const thanhcaUrl = (n: number) => `https://thanhca.httlvn.org/thanh-ca-${n}`
export const thanhcaSourceId = (n: number) => `httlvn-tc-${n}`

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ' }

export const decodeHtml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)

const textLines = (html: string) =>
  decodeHtml(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ''))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())

const HEADER = /^(câu(\s*\d+)?|điệp\s*khúc(\s*\d+)?|kết|coda)\s*:?$/i
// Longer sections are split at their blank lines so each slide stays readable; unbroken runs every 8 lines.
const MAX_SLIDE_LINES = 8

function slideChunks(body: string): string[] {
  if (body.split('\n').length <= MAX_SLIDE_LINES) return [body]
  return body.split('\n\n').flatMap((para) => {
    const lines = para.split('\n')
    if (lines.length <= MAX_SLIDE_LINES * 1.5) return [para]
    const chunks: string[] = []
    for (let i = 0; i < lines.length; i += MAX_SLIDE_LINES) chunks.push(lines.slice(i, i + MAX_SLIDE_LINES).join('\n'))
    return chunks
  })
}

export interface Hymn {
  number: number
  title: string
  author?: string
  markdown: string
}

export function parseThanhcaPage(html: string, number: number): Hymn | undefined {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const start = html.indexOf('<div id="lyric-content">')
  if (!h1 || start < 0) return undefined
  const title = decodeHtml(h1.replace(/<small[\s\S]*?<\/small>/i, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
  const authors = [...html.matchAll(/<div class="col-xs-6 text-(?:left|right)">([\s\S]*?)<\/div>/g)]
    .map((m) => decodeHtml(m[1].replace(/<[^>]+>/g, '')).trim())
    .filter(Boolean)

  // Lyrics end at the first </div>: the block only holds <p> lines.
  const lyric = html.slice(start, html.indexOf('</div>', start))
  const sections: { label: string; lines: string[] }[] = []
  for (const line of textLines(lyric)) {
    if (HEADER.test(line)) sections.push({ label: line.replace(/:$/, ''), lines: [] })
    else {
      if (!sections.length) sections.push({ label: 'Câu 1', lines: [] })
      sections[sections.length - 1].lines.push(line)
    }
  }

  // The chorus is printed after every verse: keep one copy, express the repeats as the sing order.
  const unique: { label: string; body: string }[] = []
  const order: string[] = []
  for (const s of sections) {
    const body = s.lines.join('\n').replace(/\n{2,}/g, '\n\n').trim()
    if (!body) continue
    let hit = unique.find((u) => u.body === body)
    if (!hit) {
      let label = s.label
      for (let i = 2; unique.some((u) => u.label === label); i++) label = `${s.label} (${i})`
      hit = { label, body }
      unique.push(hit)
    }
    order.push(hit.label)
  }
  if (!unique.length) return undefined

  const parts = new Map<string, { label: string; body: string }[]>()
  for (const u of unique) {
    parts.set(u.label, slideChunks(u.body).map((body, i) => ({ label: i ? `${u.label} – phần ${i + 1}` : u.label, body })))
  }
  const slides = [...parts.values()].flat()
  const sung = order.flatMap((label) => parts.get(label)!.map((p) => p.label))

  const author = authors.join(' · ') || undefined
  const lines = [`# ${title}`, `## Songbook: ${THANHCA_BOOK} ${number}`]
  if (author) lines.push(`## Author: ${author}`)
  if (sung.length !== slides.length) lines.push(`## Order: ${sung.join(', ')}`)
  for (const s of slides) lines.push('', `[${s.label}]`, s.body)
  return { number, title, author, markdown: lines.join('\n') }
}
