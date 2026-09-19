import { ArrowsClockwise, Copy } from '@phosphor-icons/react'
import type { RemoteStatus } from '../../api/remote'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { IconButton } from '../ui/IconButton'

const newPin = () => String(Math.floor(1000 + Math.random() * 9000))

function UrlRow({ url }: { url: string }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-md bg-surface px-3 py-1.5">
      <code className="truncate text-[13px] text-fg">{url}</code>
      <IconButton size="sm" label="Sao chép" icon={<Copy size={13} />} onClick={() => navigator.clipboard.writeText(url)} />
    </li>
  )
}

// Phone/tablet remote over the church Wi-Fi + OBS lower-third page.
export function RemoteSettings({ status }: { status: RemoteStatus }) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const primary = status.urls[0]

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 text-[13px] text-fg">
        <input type="checkbox" checked={settings.remoteEnabled} onChange={(e) => updateSettings({ remoteEnabled: e.target.checked })} className="h-4 w-4 accent-select" />
        Bật điều khiển từ điện thoại / máy tính bảng (cùng mạng Wi-Fi)
      </label>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Cổng (port)">
          {(id) => (
            <input
              id={id}
              type="number"
              min={1024}
              max={65535}
              value={settings.remotePort}
              onChange={(e) => updateSettings({ remotePort: +e.target.value })}
              className="input"
            />
          )}
        </Field>
        <Field label="Mã PIN" hint="Điện thoại phải nhập mã này mới điều khiển được.">
          {(id) => (
            <div className="flex gap-2">
              <input id={id} value={settings.remotePin} maxLength={8} onChange={(e) => updateSettings({ remotePin: e.target.value.replace(/\D/g, '') })} className="input font-mono tracking-widest" />
              <Button icon={<ArrowsClockwise size={14} />} onClick={() => updateSettings({ remotePin: newPin() })}>
                Đổi
              </Button>
            </div>
          )}
        </Field>
      </div>

      {settings.remoteEnabled && (
        <div className="space-y-3">
          {status.error && <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">{status.error}</p>}
          {status.running && (
            <>
              <div>
                <span className="label">Mở trên điện thoại</span>
                <ul className="space-y-1">
                  {status.urls.map((u) => (
                    <UrlRow key={u} url={u} />
                  ))}
                </ul>
              </div>
              <div>
                <span className="label">Livestream (OBS → Browser Source, nền trong suốt)</span>
                <ul>
                  <UrlRow url={`${primary}/lower-third`} />
                </ul>
                <p className="mt-1 text-2xs text-muted">Hiện lời đang chiếu ở phần dưới khung hình — thay cho NDI.</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
