import { useEffect, useState } from 'react'
import { listenMidiNotes } from '../../hooks/useMidi'
import { useStore } from '../../store'
import type { MidiActionType } from '../../types'
import { Button } from '../ui/Button'

const ACTIONS: { id: MidiActionType; label: string }[] = [
  { id: 'next', label: 'Slide kế tiếp' },
  { id: 'prev', label: 'Slide trước' },
  { id: 'clear:all', label: 'Xóa hết' },
  { id: 'clear:text', label: 'Xóa chữ' },
  { id: 'clear:media', label: 'Xóa nền' }
]

// Map MIDI notes (foot pedal, keyboard, controller) to show commands with a "learn" button.
export function MidiSettings() {
  const { midiEnabled, midiMappings } = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [learning, setLearning] = useState<MidiActionType | null>(null)

  useEffect(() => {
    if (!learning) return
    return listenMidiNotes((note, channel) => {
      const rest = midiMappings.filter((m) => m.action !== learning && !(m.note === note && m.channel === channel))
      updateSettings({ midiMappings: [...rest, { action: learning, note, channel }] })
      setLearning(null)
    })
  }, [learning, midiMappings, updateSettings])

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-[13px] text-fg">
        <input type="checkbox" checked={midiEnabled} onChange={(e) => updateSettings({ midiEnabled: e.target.checked })} className="h-4 w-4 accent-select" />
        Bật điều khiển bằng MIDI
      </label>
      <p className="text-xs text-muted">Bấm “Học”, rồi nhấn phím/pedal trên thiết bị MIDI để gán.</p>
      <ul className="divide-y divide-line rounded-md border border-line">
        {ACTIONS.map((a) => {
          const m = midiMappings.find((x) => x.action === a.id)
          return (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 text-[13px] text-fg">{a.label}</span>
              <span className="w-32 font-mono text-xs text-fg-2">{m ? `Nốt ${m.note} · kênh ${m.channel + 1}` : '—'}</span>
              <Button size="sm" variant={learning === a.id ? 'live' : 'secondary'} onClick={() => setLearning(learning === a.id ? null : a.id)}>
                {learning === a.id ? 'Đang chờ…' : 'Học'}
              </Button>
              <Button size="sm" variant="ghost" disabled={!m} onClick={() => updateSettings({ midiMappings: midiMappings.filter((x) => x.action !== a.id) })}>
                Bỏ
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
