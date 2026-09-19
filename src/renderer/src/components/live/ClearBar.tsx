import { ChatText, Image, Stack, TextT, XSquare } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useLiveSlide } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { runShowCommand } from '../../store/commands'
import type { ClearTarget } from '../../types'

function ClearButton({ target, label, keyHint, icon, lit }: { target: ClearTarget; label: string; keyHint: string; icon: ReactNode; lit: boolean }) {
  return (
    <button
      type="button"
      onClick={() => runShowCommand({ type: 'clear', what: target })}
      title={`${label} (${keyHint})`}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md border py-1.5 text-2xs font-medium cursor-pointer transition-colors duration-150 ${
        lit ? 'border-live/60 bg-live/15 text-fg hover:bg-live/25' : 'border-line bg-surface text-muted hover:text-fg'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="font-mono text-[9px] opacity-70">{keyHint}</span>
    </button>
  )
}

// ProPresenter clear row: lit buttons show which layers currently have content on screen.
export function ClearBar() {
  const live = useLiveSlide()
  const layers = useStore((s) => s.layers)
  const hasMedia = useStore((s) => !!s.liveMediaId)
  const hasProps = useStore((s) => s.activePropIds.length > 0)
  const hasMessage = useStore((s) => !!s.activeMessageId)
  const slideOn = !!live && layers.text
  const mediaOn = layers.media && (hasMedia || !!live)

  return (
    <div className="flex gap-1.5 p-2">
      <button
        type="button"
        onClick={() => runShowCommand({ type: 'clear', what: 'all' })}
        title="Xóa hết (F1)"
        className="flex w-20 flex-col items-center justify-center gap-0.5 rounded-md bg-danger py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-danger/85"
      >
        <XSquare size={18} weight="bold" />
        Xóa hết
        <span className="font-mono text-[9px] opacity-80">F1</span>
      </button>
      <ClearButton target="text" label="Chữ" keyHint="F2" icon={<TextT size={15} />} lit={slideOn} />
      <ClearButton target="media" label="Nền" keyHint="F3" icon={<Image size={15} />} lit={mediaOn} />
      <ClearButton target="props" label="Props" keyHint="F4" icon={<Stack size={15} />} lit={hasProps} />
      <ClearButton target="messages" label="Tin nhắn" keyHint="F5" icon={<ChatText size={15} />} lit={hasMessage} />
    </div>
  )
}
