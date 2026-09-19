import { ArrowDown, ArrowUp, BookOpenText, MusicNotes, Square, Trash } from '@phosphor-icons/react'
import { SCRIPTURE_COLOR } from '../../constants/sections'
import { serviceItems } from '../../helpers/serviceItems'
import { slideText } from '../../helpers/slideFactory'
import { useCurrentPresentation } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'

const KIND = {
  song: { icon: <MusicNotes size={14} />, color: '#ea580c' },
  bible: { icon: <BookOpenText size={14} />, color: SCRIPTURE_COLOR },
  custom: { icon: <Square size={14} />, color: '#6b7280' }
}

// Order of service for the open presentation: jump to, reorder, remove items.
export function ServiceItemList() {
  const pres = useCurrentPresentation()
  const liveSlideId = useStore((s) => s.liveSlideId)
  const currentSlideId = useStore((s) => s.currentSlideId)
  const { setCurrentSlide, moveGroup, deleteGroup } = useStore.getState()

  if (!pres) return <EmptyState icon={<ListIcon />} title="Chọn hoặc tạo một buổi nhóm" />
  const items = serviceItems(pres.slides)
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListIcon />}
        title="Chương trình trống"
        hint="Thêm bài hát từ tab Thư viện, hoặc mở ngăn Kinh Thánh ở góc dưới bên trái."
      />
    )
  }

  return (
    <ol className="px-1.5 pb-2">
      {items.map((item, idx) => {
        const ids = item.slides.map((s) => s.id)
        const kind = KIND[item.group?.kind ?? 'custom']
        const isLive = !!liveSlideId && ids.includes(liveSlideId)
        const isCurrent = !!currentSlideId && ids.includes(currentSlideId)
        const title = item.group?.title ?? (slideText(item.slides[0]).split('\n')[0] || 'Slide')
        return (
          <li key={item.key} className="group">
            <div
              className={`relative flex h-10 items-center gap-2 overflow-hidden rounded-md pl-3 pr-1.5 ${
                isCurrent ? 'bg-select/15' : 'hover:bg-raised'
              }`}
            >
              <span className="absolute inset-y-1 left-0 w-1 rounded-r" style={{ backgroundColor: kind.color }} />
              <button
                type="button"
                onClick={() => {
                  setCurrentSlide(item.slides[0].id)
                  document.getElementById(`item-${item.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
              >
                <span className="flex-shrink-0 text-muted">{kind.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-fg">{title}</span>
                  <span className="block text-2xs text-muted">{item.slides.length} slide</span>
                </span>
              </button>
              {isLive && <span className="rounded bg-live px-1 text-2xs font-bold text-white group-hover:hidden">LIVE</span>}
              <span className="hidden gap-0.5 group-hover:flex">
                <IconButton size="sm" label="Chuyển lên" icon={<ArrowUp size={12} />} disabled={idx === 0} onClick={() => moveGroup(pres.id, item.key, -1)} />
                <IconButton size="sm" label="Chuyển xuống" icon={<ArrowDown size={12} />} disabled={idx === items.length - 1} onClick={() => moveGroup(pres.id, item.key, 1)} />
                <IconButton size="sm" tone="danger" label="Bỏ khỏi chương trình" icon={<Trash size={12} />} onClick={() => deleteGroup(pres.id, item.key)} />
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const ListIcon = () => <MusicNotes size={28} />
