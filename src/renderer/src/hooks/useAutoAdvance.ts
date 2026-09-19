import { useEffect } from 'react'
import { useStore } from '../store'
import { useCurrentPresentation, useLiveSlide } from './useSelectors'

// Service items with auto-advance (announcement loops, song timings) move on by themselves.
export function useAutoAdvance(): void {
  const live = useLiveSlide()
  const pres = useCurrentPresentation()
  const textVisible = useStore((s) => s.layers.text)
  const goLive = useStore((s) => s.goLive)

  useEffect(() => {
    const auto = live?.group?.autoAdvance
    if (!live || !pres || !auto || auto.seconds <= 0 || !textVisible) return
    const groupSlides = pres.slides.filter((s) => s.group?.id === live.group!.id)
    const idx = groupSlides.findIndex((s) => s.id === live.id)
    const next = groupSlides[idx + 1] ?? (auto.loop ? groupSlides[0] : undefined)
    if (!next) return
    const id = setTimeout(() => goLive(next.id), auto.seconds * 1000)
    return () => clearTimeout(id)
  }, [live, pres, textVisible, goLive])
}
