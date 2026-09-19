import { ipcMain } from 'electron'
import { chapter, chapterCounts, isBibleVersion } from '../services/bibleService'

export function registerBibleIpc(): void {
  ipcMain.handle('bible:chapter-counts', (_e, version) => (isBibleVersion(version) ? chapterCounts(version) : {}))
  ipcMain.handle('bible:chapter', (_e, version, book: string, n: number) =>
    isBibleVersion(version) ? chapter(version, String(book), Number(n)) : []
  )
}
