import { ArrowDown, ArrowUp, BookOpenText, MusicNotes, Repeat, Square, TextT, Trash } from '@phosphor-icons/react'
import type { ServiceItem } from '../../helpers/serviceItems'
import { useStore } from '../../store'
import { IconButton } from '../ui/IconButton'

const AUTO_OPTIONS = [0, 5, 8, 10, 15, 20, 30, 60]

interface ItemHeaderProps {
  presId: string
  item: ServiceItem
  isFirst: boolean
  isLast: boolean
}

// Header above each service item in the grid: title, theme, auto-advance, reorder, remove.
export function ItemHeader({ presId, item, isFirst, isLast }: ItemHeaderProps) {
  const themes = useStore((s) => s.themes)
  const { setGroupTheme, updateGroup, moveGroup, deleteGroup } = useStore.getState()
  const group = item.group
  const themeId = item.slides[0]?.themeId ?? ''
  const auto = group?.autoAdvance

  return (
    <div className="sticky top-0 z-10 flex h-9 items-center gap-2 border-b border-line bg-app/95 px-1 backdrop-blur">
      <span className="text-muted">
        {group?.kind === 'bible' ? <BookOpenText size={15} /> : group?.kind === 'text' ? <TextT size={15} /> : group ? <MusicNotes size={15} /> : <Square size={15} />}
      </span>
      <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">{group?.title ?? 'Slide'}</h2>

      {group && (
        <>
          <select
            aria-label="Theme của mục này"
            value={themeId}
            onChange={(e) => setGroupTheme(presId, group.id, e.target.value)}
            className="input h-7 w-44 py-0 text-xs"
          >
            {!themeId && <option value="">Không theme</option>}
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-muted" title="Tự chuyển slide sau mỗi N giây (thông báo, lặp lại)">
            <Repeat size={14} aria-hidden />
            Tự chuyển
            <select
              aria-label="Tự chuyển slide"
              value={auto?.seconds ?? 0}
              onChange={(e) => {
                const seconds = +e.target.value
                updateGroup(presId, group.id, { autoAdvance: seconds ? { seconds, loop: auto?.loop ?? true } : undefined })
              }}
              className="input h-7 w-20 py-0 text-xs"
            >
              {AUTO_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s ? `${s} giây` : 'Tắt'}
                </option>
              ))}
            </select>
          </label>
          {auto && (
            <label className="flex items-center gap-1 text-xs text-fg-2">
              <input
                type="checkbox"
                checked={auto.loop}
                onChange={(e) => updateGroup(presId, group.id, { autoAdvance: { ...auto, loop: e.target.checked } })}
                className="accent-select"
              />
              Lặp
            </label>
          )}
        </>
      )}

      <IconButton size="sm" label="Chuyển lên" icon={<ArrowUp size={13} />} disabled={isFirst} onClick={() => moveGroup(presId, item.key, -1)} />
      <IconButton size="sm" label="Chuyển xuống" icon={<ArrowDown size={13} />} disabled={isLast} onClick={() => moveGroup(presId, item.key, 1)} />
      <IconButton size="sm" tone="danger" label="Bỏ khỏi chương trình" icon={<Trash size={13} />} onClick={() => deleteGroup(presId, item.key)} />
    </div>
  )
}
