import { useEffect, useRef, useState } from 'react'
import { messageText } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import type { OutputPayload, OutputSettings } from '../../types'
import { SlideView } from '../slides/SlideView'

const CLOCK_POS: Record<OutputSettings['clockPosition'], string> = {
  'top-left': 'top-6 left-8',
  'top-right': 'top-6 right-8',
  'bottom-left': 'bottom-6 left-8',
  'bottom-right': 'bottom-6 right-8'
}

// Audience screen: full-window letterboxed slide + media, props, message and optional clock.
export function OutputScreen({ payload }: { payload: OutputPayload }) {
  const now = useClock()
  const [fading, setFading] = useState(false)
  const shownId = useRef<string | undefined>(undefined)

  // Brief fade only when a different slide comes up; layer toggles and live edits apply instantly.
  useEffect(() => {
    const id = payload.slide?.id
    if (id === shownId.current) return
    shownId.current = id
    if (payload.slide?.transition === 'none') return
    setFading(true)
    const t = setTimeout(() => setFading(false), 180)
    return () => clearTimeout(t)
  }, [payload.slide])

  const message = payload.message && payload.message.target !== 'stage' ? messageText(payload.message, payload.timers, now) : null

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <div className="h-full w-full transition-opacity duration-200" style={{ opacity: fading ? 0.15 : 1 }}>
        <SlideView
          slide={payload.slide}
          themes={payload.themes}
          media={payload.media}
          layers={payload.layers}
          props={payload.props}
          message={message}
          backgroundColor={payload.settings.backgroundColor}
          play
          fill
        />
      </div>
      {payload.settings.showClock && (
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
