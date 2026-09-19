import { Copy, PencilSimple, Trash } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { DEFAULT_THEMES } from '../../constants/defaults'
import { itemOfSlide } from '../../helpers/serviceItems'
import { sampleSlide } from '../../helpers/themeSample'
import { useCurrentPresentation } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { SlideView } from '../slides/SlideView'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { ThemeEditorDialog } from './ThemeEditorDialog'

// Theme bin: preview each theme, apply it to the selected service item, edit/duplicate.
export function ThemeBin() {
  const themes = useStore((s) => s.themes)
  const currentSlideId = useStore((s) => s.currentSlideId)
  const settings = useStore((s) => s.settings)
  const pres = useCurrentPresentation()
  const { setGroupTheme, duplicateTheme, deleteTheme, updateSettings } = useStore.getState()
  const [editingId, setEditingId] = useState<string | null>(null)
  const samples = useMemo(() => Object.fromEntries(themes.map((t) => [t.id, sampleSlide(t.id)])), [themes])

  const item = pres && currentSlideId ? itemOfSlide(pres.slides, currentSlideId) : undefined
  const target = item?.group

  return (
    <div className="flex h-full flex-col">
      <p className="px-3 py-2 text-2xs text-muted">
        {target ? (
          <>Bấm một theme để áp dụng cho <strong className="text-fg">{target.title}</strong>.</>
        ) : (
          'Chọn một slide bài hát / Kinh Thánh trong chương trình để áp dụng theme.'
        )}
      </p>
      <ul className="grid flex-1 content-start gap-3 overflow-y-auto px-3 pb-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
        {themes.map((t) => {
          const active = item?.slides[0]?.themeId === t.id
          const builtIn = DEFAULT_THEMES.some((d) => d.id === t.id)
          return (
            <li key={t.id} className={`group relative overflow-hidden rounded-md ${active ? 'ring-2 ring-select' : 'ring-1 ring-line-strong hover:ring-fg-2'}`}>
              <button
                type="button"
                disabled={!target}
                onClick={() => pres && target && setGroupTheme(pres.id, target.id, t.id)}
                className="block w-full text-left cursor-pointer disabled:cursor-default"
              >
                <SlideView slide={samples[t.id]} themes={themes} />
                <span className="flex h-7 items-center gap-1 bg-surface px-2 text-xs text-fg">
                  <span className="truncate">{t.name}</span>
                  {settings.songThemeId === t.id && <span className="ml-auto rounded bg-live/20 px-1 text-2xs text-live">Bài hát</span>}
                  {settings.bibleThemeId === t.id && <span className="ml-auto rounded bg-select/20 px-1 text-2xs text-select">Kinh Thánh</span>}
                </span>
              </button>
              <div className="absolute right-1 top-1 hidden gap-0.5 rounded bg-black/60 group-hover:flex">
                <IconButton size="sm" label="Sửa theme" icon={<PencilSimple size={12} />} className="text-white hover:bg-white/20" onClick={() => setEditingId(t.id)} />
                <IconButton size="sm" label="Nhân bản theme" icon={<Copy size={12} />} className="text-white hover:bg-white/20" onClick={() => setEditingId(duplicateTheme(t.id))} />
                {!builtIn && <IconButton size="sm" tone="danger" label="Xóa theme" icon={<Trash size={12} />} className="text-white" onClick={() => deleteTheme(t.id)} />}
              </div>
            </li>
          )
        })}
      </ul>
      {editingId && (
        <ThemeEditorDialog
          themeId={editingId}
          onClose={() => setEditingId(null)}
          footer={
            <>
              <Button size="sm" onClick={() => updateSettings({ songThemeId: editingId })}>Mặc định cho bài hát</Button>
              <Button size="sm" onClick={() => updateSettings({ bibleThemeId: editingId })}>Mặc định cho Kinh Thánh</Button>
            </>
          }
        />
      )}
    </div>
  )
}
