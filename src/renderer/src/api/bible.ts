export type BibleVersion = 'vi1925' | 'kjv'

export const BIBLE_VERSION_LABEL: Record<BibleVersion, string> = {
  vi1925: 'Truyền Thống 1925',
  kjv: 'King James (EN)'
}

export const getChapterCounts = (version: BibleVersion = 'vi1925') => window.api.bible.chapterCounts(version)
export const getChapter = (version: BibleVersion, book: string, chapter: number) =>
  window.api.bible.chapter(version, book, chapter)
