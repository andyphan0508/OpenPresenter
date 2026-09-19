import { ImageSquare, Plus, Trash, VideoCamera } from '@phosphor-icons/react'
import { mediaBackground, pickMediaFiles } from '../../api/media'
import { useStore } from '../../store'
import { BackgroundLayer } from '../slides/BackgroundLayer'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'

// Media bin: click an item to put it on the media layer (behind lyrics). F3 clears it.
export function MediaBin() {
  const media = useStore((s) => s.media)
  const liveMediaId = useStore((s) => s.liveMediaId)
  const { addMedia, removeMedia, setLiveMedia } = useStore.getState()

  const add = async () => addMedia(await pickMediaFiles())

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-2">
        <Button size="sm" icon={<Plus size={13} />} onClick={add}>
          Thêm ảnh / video
        </Button>
        <span className="text-2xs text-muted">Bấm để chiếu làm nền phía sau lời · F3 để xóa</span>
      </div>
      {media.length === 0 ? (
        <EmptyState icon={<ImageSquare size={32} />} title="Chưa có media" hint="Thêm video nền lặp (loop) hoặc hình ảnh để dùng trong buổi nhóm." />
      ) : (
        <ul className="grid flex-1 content-start gap-2.5 overflow-y-auto px-3 pb-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {media.map((m) => {
            const live = m.id === liveMediaId
            return (
              <li key={m.id} className={`group relative overflow-hidden rounded-md bg-black ${live ? 'ring-[3px] ring-live' : 'ring-1 ring-line-strong hover:ring-fg-2'}`}>
                <button type="button" onClick={() => setLiveMedia(live ? null : m.id)} aria-pressed={live} className="block w-full cursor-pointer text-left">
                  <div className="relative aspect-video">
                    <BackgroundLayer bg={mediaBackground(m)} play={false} />
                  </div>
                  <span className="flex h-6 items-center gap-1.5 bg-surface px-2 text-2xs text-fg-2">
                    {m.type === 'video' ? <VideoCamera size={12} /> : <ImageSquare size={12} />}
                    <span className="truncate">{m.name}</span>
                    {live && <span className="ml-auto font-bold text-live">LIVE</span>}
                  </span>
                </button>
                <div className="absolute right-1 top-1 hidden rounded bg-black/60 group-hover:block">
                  <IconButton size="sm" tone="danger" label="Xóa khỏi ngăn media" icon={<Trash size={12} />} className="text-white" onClick={() => removeMedia(m.id)} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
