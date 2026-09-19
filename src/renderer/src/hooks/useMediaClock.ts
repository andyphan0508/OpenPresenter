import { useEffect } from 'react'
import { useStore } from '../store'
import type { MediaClock } from '../types'

const MAX_DRIFT_SEC = 0.3
const CLOCK_EVENTS = ['loadedmetadata', 'play', 'playing', 'pause', 'seeked'] as const

// Control window: the preview's video is the master (it plays the audio); publish its state on every play/pause/seek.
export function useMediaClockPublisher(video: HTMLVideoElement | null): void {
  useEffect(() => {
    const { setMediaClock } = useStore.getState()
    if (!video) {
      setMediaClock(null)
      return
    }
    const publish = () =>
      setMediaClock({ url: video.getAttribute('src') ?? '', playing: !video.paused, position: video.currentTime, at: Date.now() })
    publish()
    CLOCK_EVENTS.forEach((e) => video.addEventListener(e, publish))
    return () => CLOCK_EVENTS.forEach((e) => video.removeEventListener(e, publish))
  }, [video])
}

// Output windows: mirror the master's play state and keep position within MAX_DRIFT_SEC.
export function useMediaClockFollower(video: HTMLVideoElement | null, url: string, clock: MediaClock | null | undefined): void {
  useEffect(() => {
    // A clock for another url is stale (new media just went live) — let this video autoplay until the master reports.
    if (!video || !clock || clock.url !== url) return
    const sync = () => {
      if (clock.playing && video.paused) video.play().catch(() => {})
      if (!clock.playing && !video.paused) video.pause()
      let target = clock.position + (clock.playing ? (Date.now() - clock.at) / 1000 : 0)
      if (video.loop && video.duration) target %= video.duration
      // A paused frame must match exactly; while playing, only correct real drift (seeks cause stutter).
      if (Math.abs(video.currentTime - target) > (clock.playing ? MAX_DRIFT_SEC : 0.04)) video.currentTime = target
    }
    sync()
    video.addEventListener('timeupdate', sync)
    video.addEventListener('loadedmetadata', sync)
    return () => {
      video.removeEventListener('timeupdate', sync)
      video.removeEventListener('loadedmetadata', sync)
    }
  }, [video, url, clock])
}
