import { FloppyDisk, MusicNotes } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { sectionColor } from '../../constants/sections'
import { SYNTAX_HELP } from '../../constants/songSyntax'
import { parseSongMarkdown } from '../../helpers/songMarkdown'
import { useSelectedSong } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

// Reflow-style editor: type the whole song as text, see the parsed sections live.
export function SongEditor() {
  const song = useSelectedSong()
  const { updateSongFromMarkdown, setMode } = useStore.getState()
  const [text, setText] = useState(song?.rawMarkdown ?? '')

  useEffect(() => setText(song?.rawMarkdown ?? ''), [song?.id])

  const parsed = useMemo(() => parseSongMarkdown(text), [text])
  const dirty = !!song && text !== song.rawMarkdown

  if (!song) return <EmptyState icon={<MusicNotes size={36} />} title="Chọn bài hát để soạn lời" />

  const save = () => {
    updateSongFromMarkdown(song.id, text)
    setMode('show')
  }

  return (
    <div className="flex h-full flex-col bg-app">
      <header className="flex items-center justify-between border-b border-line bg-panel px-4 py-2.5">
        <div>
          <h1 className="text-[15px] font-semibold text-fg">Soạn lời · {parsed.title}</h1>
          <p className="text-xs text-muted">{dirty ? 'Chưa lưu' : 'Đã lưu'} · ⌘/Ctrl+S để lưu</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setText(song.rawMarkdown); setMode('show') }}>Hủy</Button>
          <Button variant="primary" icon={<FloppyDisk size={15} />} onClick={save} disabled={!dirty}>
            Lưu
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <textarea
          aria-label="Lời bài hát (Markdown)"
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault()
              save()
            }
          }}
          className="min-w-0 flex-1 resize-none border-r border-line bg-panel p-4 font-mono text-[13px] leading-relaxed text-fg outline-none"
        />

        <div className="w-[42%] min-w-72 overflow-y-auto p-4">
          <h2 className="panel-title mb-2">Xem trước ({parsed.slides.length} đoạn)</h2>
          <div className="space-y-2">
            {parsed.slides.map((s) => (
              <article key={s.id} className="overflow-hidden rounded-md border border-line bg-panel">
                <h3 className="px-3 py-1 text-2xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: sectionColor(s.sectionType) }}>
                  {s.sectionLabel}
                </h3>
                <p className="whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed text-fg">{s.content}</p>
                {s.translation && <p className="whitespace-pre-wrap border-t border-line px-3 py-2 text-xs italic text-amber-500">{s.translation}</p>}
              </article>
            ))}
          </div>

          <h2 className="panel-title mb-2 mt-5">Cú pháp</h2>
          <dl className="space-y-1.5 text-xs">
            {SYNTAX_HELP.map(([code, meaning]) => (
              <div key={code}>
                <dt className="font-mono text-fg">{code}</dt>
                <dd className="text-muted">{meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
