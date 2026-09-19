import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { messageText } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import { runShowCommand } from '../../store/commands'
import type { OutputPayload } from '../../types'
import { SlideView } from '../slides/SlideView'
import { IconButton } from '../ui/IconButton'

// Exactly what the audience sees (same payload as the output window).
export function PreviewPanel({ payload, outputOpen }: { payload: OutputPayload; outputOpen: boolean }) {
  const now = useClock()
  const message = payload.message && payload.message.target !== 'stage' ? messageText(payload.message, payload.timers, now) : null

  return (
    <div className="border-b border-line">
      <div className="flex h-9 items-center justify-between px-3">
        <h2 className="panel-title">Màn hình khán phòng</h2>
        <span className={`flex items-center gap-1.5 text-2xs font-semibold ${outputOpen ? 'text-live' : 'text-muted'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${outputOpen ? 'bg-live' : 'bg-faint'}`} />
          {outputOpen ? 'ĐANG XUẤT' : 'CHƯA BẬT'}
        </span>
      </div>
      <div className="px-3">
        <div className="overflow-hidden rounded-md ring-1 ring-line-strong">
          <SlideView
            slide={payload.slide}
            themes={payload.themes}
            media={payload.media}
            layers={payload.layers}
            props={payload.props}
            message={message}
            backgroundColor={payload.settings.backgroundColor}
            play
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <IconButton label="Slide trước (←)" icon={<CaretLeft size={18} weight="bold" />} onClick={() => runShowCommand({ type: 'prev' })} />
        <IconButton label="Slide kế (→)" icon={<CaretRight size={18} weight="bold" />} onClick={() => runShowCommand({ type: 'next' })} />
      </div>
    </div>
  )
}
