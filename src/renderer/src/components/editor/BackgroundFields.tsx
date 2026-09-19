import { FolderOpen } from '@phosphor-icons/react'
import { mediaUrl, pickMediaFiles } from '../../api/media'
import type { SlideBackground } from '../../types'
import { Button } from '../ui/Button'
import { ColorInput } from '../ui/Field'
import { Tabs } from '../ui/Tabs'

const SWATCHES = ['#000000', '#0b1a2e', '#16213e', '#1a1a1a', '#2d1b69', '#14532d', '#7c2d12']

// Color / image / video background picker (slide inspector + theme editor).
export function BackgroundFields({ bg, onChange }: { bg: SlideBackground; onChange: (bg: SlideBackground) => void }) {
  const pick = async (type: 'image' | 'video') => {
    const [file] = await pickMediaFiles(type === 'image')
    if (!file) return
    onChange(file.type === 'video' ? { type: 'video', url: mediaUrl(file.path), loop: true, muted: true } : { type: 'image', url: mediaUrl(file.path), fit: 'cover' })
  }

  return (
    <div className="space-y-3">
      <Tabs
        variant="segmented"
        value={bg.type}
        onChange={(type) =>
          onChange(
            type === 'color' ? { type: 'color', value: '#000000' } : type === 'image' ? { type: 'image', url: '', fit: 'cover' } : { type: 'video', url: '', loop: true, muted: true }
          )
        }
        tabs={[
          { id: 'color', label: 'Màu' },
          { id: 'image', label: 'Ảnh' },
          { id: 'video', label: 'Video' }
        ]}
      />

      {bg.type === 'color' && (
        <>
          <ColorInput value={bg.value} onChange={(value) => onChange({ type: 'color', value })} />
          <div className="flex gap-1.5">
            {SWATCHES.map((c) => (
              <button key={c} type="button" aria-label={`Màu ${c}`} onClick={() => onChange({ type: 'color', value: c })} className="h-6 w-6 rounded border border-line-strong cursor-pointer" style={{ backgroundColor: c }} />
            ))}
          </div>
        </>
      )}

      {bg.type !== 'color' && (
        <>
          <Button icon={<FolderOpen size={15} />} onClick={() => pick(bg.type)} className="w-full">
            {bg.url ? 'Đổi file…' : `Chọn ${bg.type === 'image' ? 'ảnh' : 'video'}…`}
          </Button>
          {bg.url && <p className="truncate text-2xs text-muted">{decodeURIComponent(bg.url.split('/').pop() ?? '')}</p>}
        </>
      )}

      {bg.type === 'image' && bg.url && (
        <select aria-label="Cách hiển thị ảnh" value={bg.fit} onChange={(e) => onChange({ ...bg, fit: e.target.value as typeof bg.fit })} className="input">
          <option value="cover">Phủ kín (cắt bớt)</option>
          <option value="contain">Vừa khung</option>
          <option value="fill">Kéo giãn</option>
        </select>
      )}

      {bg.type === 'video' && (
        <div className="flex gap-4 text-[13px] text-fg-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={bg.loop} onChange={(e) => onChange({ ...bg, loop: e.target.checked })} className="accent-select" /> Lặp lại
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={bg.muted} onChange={(e) => onChange({ ...bg, muted: e.target.checked })} className="accent-select" /> Tắt tiếng
          </label>
        </div>
      )}
    </div>
  )
}
