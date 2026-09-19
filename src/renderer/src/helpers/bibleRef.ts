import { BOOKS } from '../constants/bibleBooks'
import { norm } from './text'

export type Book = (typeof BOOKS)[number]

export function findBook(query: string): Book | undefined {
  const q = norm(query)
  if (!q) return undefined
  return (
    BOOKS.find((b) => norm(b[2]) === q) ??
    BOOKS.find((b) => norm(b[1]) === q) ??
    BOOKS.find((b) => norm(b[1]).startsWith(q))
  )
}

export interface BibleRef {
  book: Book
  chapter: number
  from?: number
  to?: number
}

// "Giăng 3:16", "gi 3:16-18", "1 Giăng 1:9", "Thi 23"
export function parseRef(input: string): BibleRef | undefined {
  const m = input.trim().match(/^(.+?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return undefined
  const book = findBook(m[1])
  if (!book) return undefined
  const from = m[3] ? +m[3] : undefined
  return { book, chapter: +m[2], from, to: m[4] ? +m[4] : from }
}

export const bookName = (code: string) => BOOKS.find((b) => b[0] === code)?.[1] ?? code
