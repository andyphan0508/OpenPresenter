import { useEffect, useState } from 'react'
import { useMediaClockFollower } from '../../hooks/useMediaClock'
import type { MediaClock, SlideBackground } from '../../types'

const FIT = { cover: 'cover', contain: 'contain', fill: '100% 100%' } as const

type VideoBg = Extract<SlideBackground, { type: 'video' }>

interface BackgroundLayerProps {
  bg: SlideBackground
  play: boolean // thumbnails pass false to keep CPU low
  audio?: boolean // only the master video (control-window preview) is audible
  clock?: MediaClock | null // output windows follow the master's playback
  onVideo?: (video: HTMLVideoElement | null) => void // master: hands its element to the transport
}

// Color / image / video filling the 1920×1080 canvas.
export function BackgroundLayer({ bg, ...rest }: BackgroundLayerProps) {
  if (bg.type === 'color') return <div className="absolute inset-0" style={{ backgroundColor: bg.value }} />
  if (bg.type === 'image') {
    return (
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{ backgroundImage: bg.url ? `url("${bg.url}")` : undefined, backgroundSize: FIT[bg.fit] }}
      />
    )
  }
  if (!bg.url) return null
  return <VideoBackground key={bg.url} bg={bg} {...rest} />
}

function VideoBackground({ bg, play, audio, clock, onVideo }: Omit<BackgroundLayerProps, 'bg'> & { bg: VideoBg }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  useMediaClockFollower(video, bg.url, clock)
  useEffect(() => {
    if (!onVideo || !video) return
    onVideo(video)
    return () => onVideo(null)
  }, [video, onVideo])

  return (
    <video
      ref={setVideo}
      className="absolute inset-0 h-full w-full object-cover"
      src={bg.url}
      autoPlay={play}
      loop={bg.loop}
      muted={!audio || bg.muted}
      playsInline
      preload={play ? 'auto' : 'metadata'}
    />
  )
}
