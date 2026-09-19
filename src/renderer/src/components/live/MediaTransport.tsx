import { Pause, Play, Repeat, SkipBack } from '@phosphor-icons/react'
import { formatSeconds } from '../../helpers/timer'
import { useVideoProgress } from '../../hooks/useVideoProgress'
import { useStore } from '../../store'
import { IconButton } from '../ui/IconButton'

// ProPresenter-style transport for the live video: play/pause, restart, scrubber, elapsed and remaining time.
export function MediaTransport({ video }: { video: HTMLVideoElement | null }) {
  const progress = useVideoProgress(video)
  const mediaItem = useStore((s) => s.media.find((m) => m.id === s.liveMediaId && m.type === 'video'))
  const updateMedia = useStore((s) => s.updateMedia)
  if (!video || !progress) return null
  const { time, duration, paused } = progress

  return (
    <div className="flex items-center gap-1 px-3 pt-2">
      <IconButton
        size="sm"
        label={paused ? 'Phát' : 'Tạm dừng'}
        icon={paused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
        onClick={() => (paused ? video.play().catch(() => {}) : video.pause())}
      />
      <IconButton
        size="sm"
        label="Phát lại từ đầu"
        icon={<SkipBack size={14} weight="fill" />}
        onClick={() => {
          video.currentTime = 0
          video.play().catch(() => {})
        }}
      />
      <span className="w-10 text-right font-mono text-2xs tabular-nums text-fg-2">{formatSeconds(time)}</span>
      <input
        type="range"
        aria-label="Vị trí video"
        min={0}
        max={duration}
        step={0.1}
        value={Math.min(time, duration)}
        onChange={(e) => (video.currentTime = +e.target.value)}
        className="min-w-0 flex-1 accent-live"
      />
      <span className="w-11 font-mono text-2xs tabular-nums text-live" title="Thời gian còn lại">
        -{formatSeconds(Math.max(0, duration - time))}
      </span>
      {mediaItem && (
        <IconButton
          size="sm"
          label="Lặp lại video"
          active={!!mediaItem.loop}
          icon={<Repeat size={14} />}
          onClick={() => updateMedia(mediaItem.id, { loop: !mediaItem.loop })}
        />
      )}
    </div>
  )
}
