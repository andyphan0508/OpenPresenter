import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

// Bundled public-domain Bibles (eBible.org VPL: "JOH 3:16 text"), same versification.
export const BIBLE_VERSIONS = { vi1925: 'vie1934.txt.gz', kjv: 'kjv.txt.gz' } as const
export type BibleVersion = keyof typeof BIBLE_VERSIONS

const cache = new Map<BibleVersion, Map<string, string[][]>>()

function load(version: BibleVersion): Map<string, string[][]> {
  const cached = cache.get(version)
  if (cached) return cached
  const file = path.join(app.getAppPath(), 'resources/bible', BIBLE_VERSIONS[version])
  const text = zlib.gunzipSync(fs.readFileSync(file)).toString('utf-8')
  const books = new Map<string, string[][]>()
  for (const line of text.split('\n')) {
    const m = line.match(/^(\w+) (\d+):(\d+) (.*)$/)
    if (!m) continue
    const chapters = books.get(m[1]) ?? []
    books.set(m[1], chapters)
    ;(chapters[+m[2] - 1] ??= [])[+m[3] - 1] = m[4].trim()
  }
  cache.set(version, books)
  return books
}

export const isBibleVersion = (v: unknown): v is BibleVersion => typeof v === 'string' && v in BIBLE_VERSIONS

export const chapterCounts = (version: BibleVersion) =>
  Object.fromEntries([...load(version)].map(([book, chapters]) => [book, chapters.length]))

export const chapter = (version: BibleVersion, book: string, n: number) => load(version).get(book)?.[n - 1] ?? []
