import type { SlideBackground } from '../../types'

const FIT = { cover: 'cover', contain: 'contain', fill: '100% 100%' } as const

// Color / image / video filling the 1920×1080 canvas. Thumbnails pass play=false to keep CPU low.
export function BackgroundLayer({ bg, play }: { bg: SlideBackground; play: boolean }) {
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
  return (
    <video
      key={bg.url}
      className="absolute inset-0 h-full w-full object-cover"
      src={bg.url}
      autoPlay={play}
      loop={bg.loop}
      muted={bg.muted || !play}
      playsInline
      preload={play ? 'auto' : 'metadata'}
    />
  )
}
