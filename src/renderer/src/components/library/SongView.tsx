import { Export, MusicNotes, PencilSimple, Play, Plus, Trash } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { FILTERS, saveTextFile } from '../../api/files'
import { orderedSections } from '../../helpers/arrangement'
import { songToOpenLyrics } from '../../helpers/openLyrics'
import { createThemedSlide } from '../../helpers/slideFactory'
import { songRefLabel } from '../../helpers/songSearch'
import { useSelectedSong } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { SlideTile } from '../show/SlideTile'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'
import { ArrangementBar } from './ArrangementBar'

// A library song opened in the center: preview in sing order, add to service, edit, export.
export function SongView() {
  const song = useSelectedSong()
  const themes = useStore((s) => s.themes)
  const songThemeId = useStore((s) => s.settings.songThemeId)
  const gridSize = useStore((s) => s.settings.gridSize)
  const currentPresentationId = useStore((s) => s.currentPresentationId)
  const { updateSong, deleteSong, selectSong, setMode, addSongToService, goLive } = useStore.getState()

  const previews = useMemo(() => {
    if (!song) return []
    const group = { id: song.id, title: song.title, kind: 'song' as const }
    return orderedSections(song).map((s) =>
      createThemedSlide({ label: s.sectionLabel, content: s.content, translation: s.translation, sectionType: s.sectionType }, group, songThemeId)
    )
  }, [song, songThemeId])

  if (!song) {
    return <EmptyState icon={<MusicNotes size={36} />} title="Chọn một bài hát" hint="Tìm theo tên, lời hoặc số bài ở cột bên trái." />
  }

  const addToService = (live: boolean) => {
    if (!currentPresentationId) return
    const first = addSongToService(currentPresentationId, song)
    if (live && first) goLive(first)
  }

  const exportOpenLyrics = () => saveTextFile(`${song.title}.xml`, songToOpenLyrics(song), FILTERS.openLyrics)

  const ref = songRefLabel(song)

  return (
    <div className="flex h-full flex-col bg-app">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-fg">{song.title}</h1>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
            {ref && <span className="font-mono text-fg-2">{ref}</span>}
            {song.author && <span>{song.author}</span>}
            {song.key && <span>Giọng {song.key}</span>}
            <span>{song.slides.length} đoạn</span>
            {song.copyright && <span>© {song.copyright}</span>}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <IconButton label="Xuất OpenLyrics (.xml)" icon={<Export size={17} />} onClick={exportOpenLyrics} />
          <IconButton
            tone="danger"
            label="Xóa bài hát"
            icon={<Trash size={17} />}
            onClick={() => {
              if (confirm(`Xóa "${song.title}" khỏi thư viện?`)) {
                deleteSong(song.id)
                selectSong(null)
              }
            }}
          />
          <Button icon={<PencilSimple size={15} />} onClick={() => setMode('edit')}>
            Soạn lời
          </Button>
          <Button variant="primary" icon={<Plus size={15} />} disabled={!currentPresentationId} onClick={() => addToService(false)} title={currentPresentationId ? '' : 'Mở một buổi nhóm trước'}>
            Thêm vào chương trình
          </Button>
          <Button variant="live" icon={<Play size={15} weight="fill" />} disabled={!currentPresentationId} onClick={() => addToService(true)}>
            Thêm & chiếu
          </Button>
        </div>
      </header>

      <ArrangementBar song={song} onChange={(u) => updateSong(song.id, u)} />

      <div
        className="grid flex-1 content-start gap-3 overflow-y-auto p-4"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))` }}
      >
        {previews.map((slide, i) => (
          <SlideTile key={i} slide={slide} themes={themes} index={i} />
        ))}
      </div>
    </div>
  )
}
