import { DeviceMobile, GearSix, Monitor, MonitorPlay, Moon, PencilSimple, Presentation, Sun } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { DisplayKind } from '../../api/display'
import { useCurrentPresentation } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { IconButton } from '../ui/IconButton'
import { Tabs } from '../ui/Tabs'

interface ToolbarProps {
  displays: Record<DisplayKind, boolean>
  remoteRunning: boolean
  onToggleDisplay: (kind: DisplayKind) => void
}

function ScreenToggle({ on, label, icon, onClick }: { on: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={on ? `Tắt màn hình ${label}` : `Bật màn hình ${label}`}
      className={`no-drag flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold cursor-pointer transition-colors duration-150 ${
        on ? 'border-live bg-live text-white' : 'border-line-strong bg-surface text-fg-2 hover:text-fg'
      }`}
    >
      {icon}
      {label}
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-white' : 'bg-faint'}`} />
    </button>
  )
}

// Top bar: mode switch (Show / Edit), current service, screen toggles, remote, settings.
export function Toolbar({ displays, remoteRunning, onToggleDisplay }: ToolbarProps) {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const colorScheme = useStore((s) => s.colorScheme)
  const toggleColorScheme = useStore((s) => s.toggleColorScheme)
  const openDialog = useStore((s) => s.openDialog)
  const pres = useCurrentPresentation()

  return (
    <header className="app-drag flex h-12 flex-shrink-0 items-center gap-3 border-b border-line bg-panel pl-20 pr-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-live text-white">
          <Presentation size={15} weight="bold" />
        </span>
        <span className="text-sm font-semibold text-fg">OpenPresenter</span>
      </div>

      <div className="no-drag w-56">
        <Tabs
          variant="segmented"
          value={mode}
          onChange={setMode}
          tabs={[
            { id: 'show', label: 'Trình chiếu', icon: <MonitorPlay size={14} /> },
            { id: 'edit', label: 'Soạn thảo', icon: <PencilSimple size={14} /> }
          ]}
        />
      </div>

      <div className="min-w-0 flex-1 truncate text-center text-xs text-muted">
        {pres ? <span className="font-medium text-fg-2">{pres.name}</span> : 'Chưa mở chương trình'}
      </div>

      <div className="no-drag flex items-center gap-2">
        <ScreenToggle on={displays.output} label="Khán phòng" icon={<Monitor size={14} />} onClick={() => onToggleDisplay('output')} />
        <ScreenToggle on={displays.stage} label="Sân khấu" icon={<MonitorPlay size={14} />} onClick={() => onToggleDisplay('stage')} />
        <div className="mx-1 h-6 w-px bg-line" />
        <div className="relative">
          <IconButton label="Điều khiển từ điện thoại" icon={<DeviceMobile size={18} />} onClick={() => openDialog('remote')} />
          {remoteRunning && <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500" />}
        </div>
        <IconButton label="Cài đặt" icon={<GearSix size={18} />} onClick={() => openDialog('settings')} />
        <IconButton
          label={colorScheme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          icon={colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleColorScheme}
        />
      </div>
    </header>
  )
}
