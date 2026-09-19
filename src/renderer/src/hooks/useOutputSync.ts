import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { sendOutput } from '../api/display'
import { mediaBackground } from '../api/media'
import { useStore } from '../store'
import type { OutputPayload } from '../types'
import { useLiveSlide } from './useSelectors'

// Pushes the audience frame to the output window whenever anything visible changes.
export function useOutputSync(): OutputPayload {
  const slide = useLiveSlide()
  const s = useStore(
    useShallow((st) => ({
      layers: st.layers,
      media: st.media,
      liveMediaId: st.liveMediaId,
      clock: st.mediaClock,
      props: st.props,
      activePropIds: st.activePropIds,
      messages: st.messages,
      activeMessageId: st.activeMessageId,
      timers: st.timers,
      settings: st.outputSettings,
      themes: st.themes
    }))
  )

  const payload = useMemo<OutputPayload>(() => {
    const mediaItem = s.media.find((m) => m.id === s.liveMediaId)
    return {
      slide: slide ?? null,
      media: mediaItem ? mediaBackground(mediaItem) : null,
      clock: s.clock,
      props: s.props.filter((p) => s.activePropIds.includes(p.id)),
      message: s.messages.find((m) => m.id === s.activeMessageId) ?? null,
      timers: s.timers,
      layers: s.layers,
      settings: s.settings,
      themes: s.themes
    }
  }, [slide, s])

  useEffect(() => sendOutput(payload), [payload])
  return payload
}
