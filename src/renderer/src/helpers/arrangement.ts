import { v4 as uuidv4 } from 'uuid'
import type { Song, SongSlide } from '../types'

// Sections in sing order for the song's active arrangement (all sections, as written, if none).
export function orderedSections(song: Pick<Song, 'slides' | 'arrangements' | 'activeArrangementId'>): SongSlide[] {
  const arr = song.arrangements?.find((a) => a.id === song.activeArrangementId)
  if (!arr) return song.slides
  const byLabel = (label: string) =>
    song.slides.find((s) => s.sectionLabel.toLowerCase() === label.toLowerCase())
  return arr.order.map(byLabel).filter((s): s is SongSlide => !!s)
}

// Markdown "## Order:" is the first arrangement; create or update it, keep the rest.
export function withMarkdownOrder(
  song: Pick<Song, 'arrangements' | 'activeArrangementId'>,
  order?: string[]
): Pick<Song, 'arrangements' | 'activeArrangementId'> | Record<string, never> {
  if (!order?.length) return {}
  const [first, ...rest] = song.arrangements ?? []
  const arr = { id: first?.id ?? uuidv4(), name: first?.name ?? 'Mặc định', order }
  return { arrangements: [arr, ...rest], activeArrangementId: song.activeArrangementId ?? arr.id }
}
