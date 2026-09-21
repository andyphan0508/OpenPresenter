import { getChapter } from './bible'
import { bookName, parseRef, passageItems } from '../helpers/bibleRef'
import { parseProgram, type Program } from '../helpers/program'


// `apiUrl` e.g. https://btnsg.vercel.app/api/program; no date → the nearest upcoming program.
export async function fetchProgram(apiUrl: string, date?: string): Promise<Program> {
  const url = new URL(apiUrl)
  if (date) url.searchParams.set('date', date)
  const res = await window.api.net.fetchText(url.toString())
  if (!res.ok) throw new Error(res.error)
  return parseProgram(res.text)
}

// "Giăng 3:16-18" → one slide item per verse (whole chapter when no verse is given), with the KJV line if enabled.
export async function loadPassage(ref: string, secondary: '' | 'kjv') {
  const r = parseRef(ref)
  if (!r) return undefined
  const code = r.book[0]
  const [verses, english] = await Promise.all([
    getChapter('vi1925', code, r.chapter),
    secondary ? getChapter(secondary, code, r.chapter) : undefined
  ])
  if (!verses?.length) return undefined
  return passageItems(bookName(code), r.chapter, r.from ?? 1, r.to ?? verses.length, verses, english)
}
