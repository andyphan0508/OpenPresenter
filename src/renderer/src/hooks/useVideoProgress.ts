import { useEffect, useReducer } from 'react'

const EVENTS = ['timeupdate', 'durationchange', 'play', 'pause', 'seeked', 'ended'] as const

// Re-renders on playback events and reads position/duration straight from the element.
export function useVideoProgress(video: HTMLVideoElement | null) {
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!video) return
    EVENTS.forEach((e) => video.addEventListener(e, rerender))
    return () => EVENTS.forEach((e) => video.removeEventListener(e, rerender))
  }, [video])
  if (!video) return null
  return { time: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0, paused: video.paused }
}
