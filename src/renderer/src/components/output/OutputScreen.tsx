import { messageText } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import type { OutputPayload, OutputSettings } from '../../types'
import { LiveFrame } from './LiveFrame'

const CLOCK_POS: Record<OutputSettings['clockPosition'], string> = {
  'top-left': 'top-6 left-8',
  'top-right': 'top-6 right-8',
  'bottom-left': 'bottom-6 left-8',
  'bottom-right': 'bottom-6 right-8'
}

// Audience screen: full-window letterboxed live frame and optional clock.
// keyBackground (Blackmagic key feed): lyrics only — no slide/media backgrounds, no clock — over that color.
export function OutputScreen({ payload, keyBackground }: { payload: OutputPayload; keyBackground?: string }) {
  const now = useClock()
  const message = payload.message && payload.message.target !== 'stage' ? messageText(payload.message, payload.timers, now) : null

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden">
      <LiveFrame payload={payload} message={message} keyBackground={keyBackground} />
      {payload.settings.showClock && !keyBackground && (
        <div
          className={`absolute ${CLOCK_POS[payload.settings.clockPosition]} font-mono text-2xl text-white/80`}
          style={{ textShadow: '0 2px 4px rgba(0,0,0,.8)' }}
        >
          {new Date(now).toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  )
}
