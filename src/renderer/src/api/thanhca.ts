import type { SongIndex } from '../helpers/songRepo'
import { parseThanhcaPage, thanhcaSourceId, thanhcaUrl } from '../helpers/thanhca'

export const THANHCA_ESTIMATE = 903 // songs on the site in 09/2026 — only used for the progress bar
const BATCH = 3 // gentle on the church's server
const STOP_AFTER_MISSES = 10 // numbers are contiguous; a run of misses means we're past the last hymn

/** Crawl https://thanhca.httlvn.org hymn by hymn into a song-repository index (merged like any other repo). */
export async function crawlThanhca(
  onProgress: (checked: number, found: number) => void,
  isCancelled: () => boolean
): Promise<SongIndex> {
  const songs: SongIndex['songs'] = []
  let misses = 0
  let n = 1
  while (misses < STOP_AFTER_MISSES && !isCancelled()) {
    const batch = await Promise.all(
      Array.from({ length: BATCH }, async (_, i) => {
        const number = n + i
        const res = await window.api.net.fetchText(thanhcaUrl(number))
        return res.ok ? parseThanhcaPage(res.text, number) : undefined
      })
    )
    for (const hymn of batch) {
      if (hymn) {
        songs.push({ id: thanhcaSourceId(hymn.number), markdown: hymn.markdown })
        misses = 0
      } else misses++
    }
    n += BATCH
    onProgress(n - 1, songs.length)
  }
  if (!songs.length && !isCancelled()) throw new Error('Không tải được bài nào — kiểm tra kết nối tới thanhca.httlvn.org')
  return { name: 'Thánh Ca HTTLVN', songs }
}
