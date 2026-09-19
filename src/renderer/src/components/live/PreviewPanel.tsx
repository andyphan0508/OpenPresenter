import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useState } from 'react'
import { messageText } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import { useMediaClockPublisher } from '../../hooks/useMediaClock'
import { runShowCommand } from '../../store/commands'
import type { OutputPayload } from '../../types'
import { LiveFrame } from '../output/LiveFrame'
import { IconButton } from '../ui/IconButton'
import { MediaTransport } from './MediaTransport'

// Exactly what the audience sees (same payload as the output window). Its video is the master: it plays the
// audio (even with no output window open) and the output windows follow its clock.
export function PreviewPanel({ payload, outputOpen }: { payload: OutputPayload; outputOpen: boolean }) {
  const now = useClock()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  useMediaClockPublisher(video)
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
        <div className="aspect-video overflow-hidden rounded-md ring-1 ring-line-strong">
          <LiveFrame payload={payload} message={message} master onVideo={setVideo} />
        </div>
      </div>
      <MediaTransport video={video} />
      <div className="flex items-center justify-center gap-2 pt-2">
        <IconButton label="Slide trước (←)" icon={<CaretLeft size={18} weight="bold" />} onClick={() => runShowCommand({ type: 'prev' })} />
        <IconButton label="Slide kế (→)" icon={<CaretRight size={18} weight="bold" />} onClick={() => runShowCommand({ type: 'next' })} />
      </div>
    </div>
  )
}
