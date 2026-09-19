import { ArrowCounterClockwise, Pause, Play, Plus, Trash } from '@phosphor-icons/react'
import { formatSeconds, timerSeconds } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import { useStore } from '../../store'
import type { Timer } from '../../types'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

const MODES: { id: Timer['mode']; label: string }[] = [
  { id: 'countdown', label: 'Đếm ngược' },
  { id: 'toTime', label: 'Đến giờ' },
  { id: 'elapsed', label: 'Đếm lên' }
]

const toMinSec = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
const fromMinSec = (v: string) => {
  const [m, s] = v.split(':').map((x) => parseInt(x, 10) || 0)
  return m * 60 + s
}

// Timers: countdowns shown on the stage display and inside messages via {timer}.
export function TimersTab() {
  const timers = useStore((s) => s.timers)
  const { addTimer, updateTimer, deleteTimer, timerCommand } = useStore.getState()
  const now = useClock(500)

  return (
    <div className="space-y-2 p-3">
      {timers.map((t) => {
        const sec = timerSeconds(t, now)
        return (
          <div key={t.id} className="space-y-2 rounded-md border border-line bg-surface p-2.5">
            <div className="flex items-center gap-1.5">
              <input aria-label="Tên hẹn giờ" value={t.name} onChange={(e) => updateTimer(t.id, { name: e.target.value })} className="input h-7 py-0" />
              <IconButton size="sm" tone="danger" label="Xóa hẹn giờ" icon={<Trash size={13} />} onClick={() => deleteTimer(t.id)} />
            </div>
            <div className="flex items-center gap-1.5">
              <select aria-label="Kiểu" value={t.mode} onChange={(e) => updateTimer(t.id, { mode: e.target.value as Timer['mode'] })} className="input h-7 flex-1 py-0 text-xs">
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              {t.mode === 'countdown' && (
                <input
                  aria-label="Thời lượng (phút:giây)"
                  defaultValue={toMinSec(t.durationSec)}
                  onBlur={(e) => updateTimer(t.id, { durationSec: fromMinSec(e.target.value) })}
                  className="input h-7 w-20 py-0 font-mono text-xs"
                />
              )}
              {t.mode === 'toTime' && (
                <input type="time" aria-label="Đến lúc" value={t.targetTime} onChange={(e) => updateTimer(t.id, { targetTime: e.target.value })} className="input h-7 w-24 py-0 text-xs" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className={`font-mono text-2xl font-semibold ${sec < 0 ? 'text-danger' : t.running ? 'text-fg' : 'text-fg-2'}`}>{formatSeconds(sec)}</span>
              <div className="flex gap-1">
                {t.running ? (
                  <IconButton label="Tạm dừng" icon={<Pause size={16} weight="fill" />} onClick={() => timerCommand(t.id, 'pause')} />
                ) : (
                  <IconButton label="Bắt đầu" icon={<Play size={16} weight="fill" />} onClick={() => timerCommand(t.id, 'start')} />
                )}
                <IconButton label="Đặt lại" icon={<ArrowCounterClockwise size={16} />} onClick={() => timerCommand(t.id, 'reset')} />
              </div>
            </div>
          </div>
        )
      })}
      <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={addTimer}>
        Thêm hẹn giờ
      </Button>
    </div>
  )
}
