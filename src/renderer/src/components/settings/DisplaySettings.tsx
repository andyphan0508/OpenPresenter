import { useStore } from '../../store'
import type { OutputSettings } from '../../types'
import { ColorInput, Field } from '../ui/Field'

export function DisplaySettings() {
  const output = useStore((s) => s.outputSettings)
  const settings = useStore((s) => s.settings)
  const themes = useStore((s) => s.themes)
  const { updateOutputSettings, updateSettings } = useStore.getState()

  return (
    <div className="grid grid-cols-2 gap-5">
      <Field label="Màu nền khi trống">{(id) => <ColorInput id={id} value={output.backgroundColor} onChange={(backgroundColor) => updateOutputSettings({ backgroundColor })} />}</Field>
      <Field label="Đồng hồ trên màn hình khán phòng">
        {(id) => (
          <select
            id={id}
            value={output.showClock ? output.clockPosition : 'off'}
            onChange={(e) =>
              e.target.value === 'off'
                ? updateOutputSettings({ showClock: false })
                : updateOutputSettings({ showClock: true, clockPosition: e.target.value as OutputSettings['clockPosition'] })
            }
            className="input"
          >
            <option value="off">Tắt</option>
            <option value="top-left">Trên trái</option>
            <option value="top-right">Trên phải</option>
            <option value="bottom-left">Dưới trái</option>
            <option value="bottom-right">Dưới phải</option>
          </select>
        )}
      </Field>
      <Field label="Theme mặc định cho bài hát">
        {(id) => (
          <select id={id} value={settings.songThemeId} onChange={(e) => updateSettings({ songThemeId: e.target.value })} className="input">
            {themes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Theme mặc định cho Kinh Thánh">
        {(id) => (
          <select id={id} value={settings.bibleThemeId} onChange={(e) => updateSettings({ bibleThemeId: e.target.value })} className="input">
            {themes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </Field>
      <p className="col-span-2 text-xs text-muted">
        Màn hình khán phòng mở trên màn hình phụ thứ nhất, màn hình sân khấu trên màn hình phụ thứ hai (nếu có).
      </p>
    </div>
  )
}
