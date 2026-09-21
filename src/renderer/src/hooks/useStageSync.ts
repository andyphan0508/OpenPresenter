import { useEffect, useMemo } from 'react'
import { sendStage } from '../api/display'
import { slideText } from '../helpers/slideFactory'
import { useStore } from '../store'
import type { StagePayload } from '../types'
import { useCurrentPresentation, useLiveSlide } from './useSelectors'

// Current + next slide, stage messages and timers for the worship team's confidence monitor.
export function useStageSync(): StagePayload {
  const pres = useCurrentPresentation()
  const live = useLiveSlide()
  const messages = useStore((s) => s.messages)
  const activeMessageId = useStore((s) => s.activeMessageId)
  const timers = useStore((s) => s.timers)

  const payload = useMemo<StagePayload>(() => {
    const idx = live && pres ? pres.slides.indexOf(live) : -1
    const next = pres?.slides[idx + 1]
    const message = messages.find((m) => m.id === activeMessageId)
    const itemSlides = live?.group ? (pres?.slides ?? []).filter((s) => s.group?.id === live.group!.id) : live ? [live] : []
    return {
      current: live ? { label: live.label, text: slideText(live) } : null,
      next: next ? { label: next.label, text: slideText(next) } : null,
      groupTitle: live?.group?.title,
      cue: live?.notes || itemSlides.find((s) => s.notes)?.notes || undefined,
      nextGroupTitle: next && next.group?.id !== live?.group?.id ? next.group?.title : undefined,
      message: message && message.target !== 'audience' ? message : null,
      timers
    }
  }, [pres, live, messages, activeMessageId, timers])

  useEffect(() => sendStage(payload), [payload])
  return payload
}
