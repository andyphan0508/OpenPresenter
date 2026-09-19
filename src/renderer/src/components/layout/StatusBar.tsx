import { BookOpenText, ImageSquare, Keyboard, Palette } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useClock } from '../../hooks/useClock'
import { useCurrentPresentation, useLiveSlide } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import type { BottomBin } from '../../store/slices/uiSlice'

function BinButton({ bin, label, icon }: { bin: BottomBin; label: string; icon: ReactNode }) {
  const active = useStore((s) => s.bottomBin === bin)
  const toggle = useStore((s) => s.toggleBottomBin)
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => toggle(bin)}
      className={`flex h-6 items-center gap-1.5 rounded px-2 text-xs cursor-pointer transition-colors duration-150 ${
        active ? 'bg-select/15 text-select' : 'text-muted hover:bg-raised hover:text-fg'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// Bottom bar: bin toggles (like ProPresenter's bottom-left), live position, tile zoom, clock.
export function StatusBar() {
  const now = useClock()
  const pres = useCurrentPresentation()
  const live = useLiveSlide()
  const gridSize = useStore((s) => s.settings.gridSize)
  const updateSettings = useStore((s) => s.updateSettings)
  const openDialog = useStore((s) => s.openDialog)
  const liveIndex = live && pres ? pres.slides.indexOf(live) + 1 : 0

  return (
    <footer className="flex h-8 flex-shrink-0 items-center justify-between gap-4 border-t border-line bg-panel px-2 text-xs text-muted">
      <div className="flex items-center gap-1">
        <BinButton bin="bible" label="Kinh Thánh" icon={<BookOpenText size={14} />} />
        <BinButton bin="media" label="Media" icon={<ImageSquare size={14} />} />
        <BinButton bin="themes" label="Themes" icon={<Palette size={14} />} />
      </div>

      <div className="flex min-w-0 items-center gap-2">
        {live ? (
          <>
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-live" />
            <span className="truncate">
              LIVE {liveIndex}/{pres?.slides.length} · {live.group?.title ?? 'Slide'} {live.label ? `· ${live.label}` : ''}
            </span>
          </>
        ) : (
          <span>Không có slide đang chiếu</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Cỡ ô slide</span>
          <input
            type="range"
            min={140}
            max={360}
            step={10}
            value={gridSize}
            onChange={(e) => updateSettings({ gridSize: +e.target.value })}
            className="w-24 accent-select"
            aria-label="Cỡ ô slide"
          />
        </label>
        <button
          type="button"
          onClick={() => openDialog('shortcuts')}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer hover:bg-raised hover:text-fg"
        >
          <Keyboard size={14} /> Phím tắt
        </button>
        <span className="font-mono text-fg-2">{new Date(now).toLocaleTimeString('vi-VN')}</span>
      </div>
    </footer>
  )
}
