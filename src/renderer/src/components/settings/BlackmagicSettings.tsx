import { ArrowsClockwise, Broadcast, Stop } from '@phosphor-icons/react'
import type { DecklinkControl } from '../../hooks/useDecklink'
import { useStore } from '../../store'
import type { KeyMode } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const MODES: { id: KeyMode; label: string; hint: string; needs?: 'externalKeying' | 'internalKeying' }[] = [
  {
    id: 'external',
    label: 'Fill + Key — Downstream Key (DSK)',
    hint: 'SDI ra 1 = Fill, SDI ra 2 = Key. ATEM: DSK → Fill Source / Key Source là 2 ngõ vào đó, bật "Pre Multiplied Key".',
    needs: 'externalKeying'
  },
  {
    id: 'internal',
    label: 'Keyer trong UltraStudio',
    hint: 'Thiết bị tự chồng lời lên tín hiệu SDI vào (camera/mixer) rồi xuất ra SDI — không cần key trên mixer.',
    needs: 'internalKeying'
  },
  {
    id: 'luma',
    label: 'Luma Key — chữ trên nền đen (USK / DSK)',
    hint: '1 dây ra. ATEM: Upstream hoặc Downstream Key → Luma, chỉnh Clip/Gain. Chữ màu tối sẽ bị mất.'
  },
  {
    id: 'chroma',
    label: 'Chroma Key — nền xanh lá (USK)',
    hint: '1 dây ra. ATEM: Upstream Key → Chroma, chọn màu xanh. Tránh chữ/viền màu xanh lá.'
  },
  { id: 'full', label: 'Toàn màn hình', hint: 'Giống màn hình khán phòng, có cả hình nền/video — không key.' }
]

// Blackmagic UltraStudio / DeckLink output (Thunderbolt) for keying lyrics into the livestream.
export function BlackmagicSettings({ control }: { control: DecklinkControl }) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const { info, status, refresh, start, stop } = control

  if (info && !info.available) {
    return (
      <div className="space-y-3 text-[13px] text-fg">
        <p>Chưa tìm thấy driver Blackmagic. Để xuất lời bài hát qua UltraStudio:</p>
        <ol className="list-decimal space-y-1 pl-5 text-fg-2">
          <li>Cài <b>Blackmagic Desktop Video</b> (blackmagicdesign.com/support), khởi động lại máy, cắm UltraStudio qua Thunderbolt.</li>
          <li>
            Trong thư mục OpenPresenter chạy <code className="rounded bg-surface px-1">npm run setup:blackmagic</code>
          </li>
          <li>Mở lại OpenPresenter.</li>
        </ol>
        {info.error && <p className="break-all text-2xs text-muted">{info.error}</p>}
      </div>
    )
  }

  const devices = info?.devices ?? []
  const device = devices.find((d) => d.index === settings.decklinkDevice) ?? devices[0]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Thiết bị">
          {(id) => (
            <div className="flex gap-2">
              <select id={id} value={device?.index ?? ''} onChange={(e) => updateSettings({ decklinkDevice: +e.target.value })} className="input">
                {devices.length === 0 && <option value="">Không có thiết bị — kiểm tra dây Thunderbolt</option>}
                {devices.map((d) => (
                  <option key={d.index} value={d.index}>{d.name}</option>
                ))}
              </select>
              <Button icon={<ArrowsClockwise size={14} />} onClick={refresh}>
                Tìm lại
              </Button>
            </div>
          )}
        </Field>
        <Field label="Chuẩn video" hint="Phải trùng chuẩn video đang đặt trên ATEM/mixer.">
          {(id) => (
            <select id={id} value={settings.decklinkFormat} onChange={(e) => updateSettings({ decklinkFormat: e.target.value })} className="input">
              {info?.formats.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="label">Cách đưa lời vào livestream</legend>
        <div className="space-y-1.5">
          {MODES.map((m) => {
            const unsupported = !!(m.needs && device && !device[m.needs])
            return (
              <label
                key={m.id}
                className={`flex gap-3 rounded-md border px-3 py-2 ${
                  settings.decklinkKeyMode === m.id ? 'border-select bg-select/10' : 'border-line'
                } ${unsupported ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="decklink-key"
                  checked={settings.decklinkKeyMode === m.id}
                  disabled={unsupported}
                  onChange={() => updateSettings({ decklinkKeyMode: m.id })}
                  className="mt-0.5 h-4 w-4 accent-select"
                />
                <span>
                  <span className="block text-[13px] font-medium text-fg">
                    {m.label}
                    {unsupported && <span className="font-normal text-muted"> — thiết bị này không hỗ trợ</span>}
                  </span>
                  <span className="block text-2xs text-muted">{m.hint}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {status.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {status.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-2xs text-muted">Ở các chế độ key chỉ có chữ, props và thông báo được xuất — hình nền/video bị bỏ.</p>
        {status.running ? (
          <Button variant="danger" icon={<Stop size={14} />} onClick={stop}>
            Dừng xuất
          </Button>
        ) : (
          <Button variant="live" icon={<Broadcast size={14} />} disabled={!device} onClick={start}>
            Bắt đầu xuất
          </Button>
        )}
      </div>
    </div>
  )
}
