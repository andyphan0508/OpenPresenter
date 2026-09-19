import { CloudArrowDown, FileText, MagnifyingGlass, MusicNotes, Plus, UploadSimple } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { sectionColor } from '../../constants/sections'
import { NEW_SONG_TEMPLATE } from '../../constants/songSyntax'
import { OTHER_SONGBOOK, SONGBOOKS } from '../../constants/songbooks'
import { songMatches, songRefLabel } from '../../helpers/songSearch'
import { useSongImport } from '../../hooks/useSongImport'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Menu } from '../ui/Menu'

const FILTERS = ['all', ...SONGBOOKS.map((b) => b.name), OTHER_SONGBOOK] as const

function inBook(books: string[], filter: string) {
  if (filter === 'all') return true
  if (filter === OTHER_SONGBOOK) return !books.some((b) => SONGBOOKS.some((s) => s.name === b))
  return books.includes(filter)
}

// Song library list: diacritic-insensitive search (title, lyrics, "TC 123"), hymnal filter, imports.
export function LibrarySidebar() {
  const songs = useStore((s) => s.songs)
  const selectedSongId = useStore((s) => s.selectedSongId)
  const currentPresentationId = useStore((s) => s.currentPresentationId)
  const { selectSong, importSongMarkdown, setMode, addSongToService, openDialog } = useStore.getState()
  const { importOpenLyrics, importMarkdown } = useSongImport()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')

  const visible = useMemo(
    () =>
      songs
        .filter((s) => inBook(s.songbooks.map((b) => b.book), filter) && songMatches(s, query))
        .sort((a, b) => a.title.localeCompare(b.title, 'vi')),
    [songs, filter, query]
  )

  const newSong = () => {
    selectSong(importSongMarkdown(NEW_SONG_TEMPLATE))
    setMode('edit')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-2.5">
        <div className="relative">
          <MagnifyingGlass size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tên, lời, số bài (TC 123)…"
            aria-label="Tìm bài hát"
            className="input pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Lọc theo sách">
          {FILTERS.map((f) => {
            const label = f === 'all' ? 'Tất cả' : (SONGBOOKS.find((b) => b.name === f)?.short ?? f)
            return (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                title={f === 'all' ? 'Tất cả bài hát' : f}
                className={`h-6 rounded-full border px-2.5 text-2xs font-medium cursor-pointer transition-colors ${
                  filter === f ? 'border-select bg-select/15 text-select' : 'border-line-strong text-muted hover:text-fg'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={newSong} className="flex-1">
            Bài mới
          </Button>
          <Menu
            align="right"
            trigger={(toggle) => (
              <Button size="sm" icon={<UploadSimple size={14} />} onClick={toggle}>
                Nhập
              </Button>
            )}
            items={[
              { label: 'Từ kho bài hát (URL / JSON)…', icon: <CloudArrowDown size={14} />, onSelect: () => openDialog('songRepo') },
              { label: 'File OpenLyrics (.xml)…', icon: <FileText size={14} />, onSelect: importOpenLyrics },
              { label: 'File Markdown (.md)…', icon: <FileText size={14} />, onSelect: importMarkdown }
            ]}
          />
        </div>
      </div>

      <div className="px-3 pb-1 text-2xs text-muted">{visible.length} bài</div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2" aria-label="Danh sách bài hát">
        {visible.length === 0 && (
          <li>
            <EmptyState icon={<MusicNotes size={28} />} title="Không tìm thấy bài hát" hint="Thử bỏ dấu hoặc tìm theo số bài, ví dụ “tc 12”." />
          </li>
        )}
        {visible.map((song) => {
          const ref = songRefLabel(song)
          const types = [...new Set(song.slides.map((s) => s.sectionType))]
          return (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => selectSong(song.id)}
                onDoubleClick={() => currentPresentationId && addSongToService(currentPresentationId, song)}
                title="Bấm đúp để thêm vào chương trình"
                className={`w-full rounded-md px-2.5 py-2 text-left cursor-pointer ${
                  song.id === selectedSongId ? 'bg-select/15' : 'hover:bg-raised'
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-fg">{song.title}</span>
                  {ref && <span className="flex-shrink-0 font-mono text-2xs text-muted">{ref}</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="truncate text-xs text-muted">{song.author || ' '}</span>
                  <span className="ml-auto flex gap-0.5">
                    {types.map((t) => (
                      <span key={t} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sectionColor(t) }} />
                    ))}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
