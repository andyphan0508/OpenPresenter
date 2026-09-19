import { FILTERS, openTextFiles } from '../api/files'
import { openLyricsToMarkdown } from '../helpers/openLyrics'
import { useStore } from '../store'

// File → library imports. Returns how many songs were added.
export function useSongImport() {
  const importSongMarkdown = useStore((s) => s.importSongMarkdown)
  const selectSong = useStore((s) => s.selectSong)

  const run = async (filters: typeof FILTERS.openLyrics, toMarkdown: (content: string) => string) => {
    const files = await openTextFiles(filters, true)
    const failed: string[] = []
    let lastId: string | null = null
    for (const f of files) {
      try {
        lastId = importSongMarkdown(toMarkdown(f.content))
      } catch {
        failed.push(f.name)
      }
    }
    if (lastId) selectSong(lastId)
    if (failed.length) alert(`Không đọc được: ${failed.join(', ')}`)
    return files.length - failed.length
  }

  return {
    importOpenLyrics: () => run(FILTERS.openLyrics, openLyricsToMarkdown),
    importMarkdown: () => run(FILTERS.songMarkdown, (md) => md)
  }
}
