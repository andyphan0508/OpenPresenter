import { X } from '@phosphor-icons/react'
import { useStore } from '../../store'
import { BibleBin } from '../bible/BibleBin'
import { MediaBin } from '../media/MediaBin'
import { ThemeBin } from '../themes/ThemeBin'
import { IconButton } from '../ui/IconButton'

const TITLES = { bible: 'Kinh Thánh', media: 'Media', themes: 'Themes' } as const

// Collapsible bottom drawer under the slide grid (Bible / Media / Themes bins).
export function BottomBin() {
  const bin = useStore((s) => s.bottomBin)
  const toggle = useStore((s) => s.toggleBottomBin)
  if (!bin) return null
  return (
    <section className="flex h-full flex-col border-t border-line bg-panel">
      <header className="flex h-8 flex-shrink-0 items-center justify-between border-b border-line px-3">
        <h2 className="panel-title">{TITLES[bin]}</h2>
        <IconButton size="sm" label="Đóng ngăn" icon={<X size={14} />} onClick={() => toggle(bin)} />
      </header>
      <div className="min-h-0 flex-1">
        {bin === 'bible' && <BibleBin />}
        {bin === 'media' && <MediaBin />}
        {bin === 'themes' && <ThemeBin />}
      </div>
    </section>
  )
}
