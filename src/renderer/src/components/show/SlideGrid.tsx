import { Copy, Plus, Trash } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { serviceItems } from '../../helpers/serviceItems'
import { useCurrentPresentation } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'
import { ItemHeader } from './ItemHeader'
import { SlideTile } from './SlideTile'

// Show mode: every service item's slides as a grid. Single click = go live, double click = edit.
export function SlideGrid() {
  const pres = useCurrentPresentation()
  const themes = useStore((s) => s.themes)
  const liveSlideId = useStore((s) => s.liveSlideId)
  const currentSlideId = useStore((s) => s.currentSlideId)
  const gridSize = useStore((s) => s.settings.gridSize)
  const { goLive, setCurrentSlide, setMode, addSlide, duplicateSlide, deleteSlide } = useStore.getState()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the live slide visible while stepping with the keyboard / remote.
  useEffect(() => {
    if (!liveSlideId) return
    scrollRef.current?.querySelector(`[data-slide-id="${liveSlideId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [liveSlideId])

  if (!pres) {
    return <EmptyState icon={<Plus size={36} />} title="Chưa mở buổi nhóm nào" hint="Tạo hoặc chọn một buổi nhóm ở tab Chương trình bên trái." />
  }

  const items = serviceItems(pres.slides)
  let index = 0

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-app px-4 pb-6">
      {items.length === 0 && (
        <EmptyState
          icon={<Plus size={36} />}
          title="Chương trình đang trống"
          hint="Mở tab Thư viện để thêm bài hát, bấm “Kinh Thánh” ở góc dưới để thêm câu Kinh Thánh, hoặc thêm slide trống."
        />
      )}
      {items.map((item, i) => (
        <section key={item.key} id={`item-${item.key}`} className="pt-3">
          <ItemHeader presId={pres.id} item={item} isFirst={i === 0} isLast={i === items.length - 1} />
          <div className="grid gap-3 pt-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))` }}>
            {item.slides.map((slide) => {
              const n = index++
              return (
                <div key={slide.id} data-slide-id={slide.id}>
                  <SlideTile
                    slide={slide}
                    themes={themes}
                    index={n}
                    live={slide.id === liveSlideId}
                    selected={slide.id === currentSlideId}
                    onClick={() => goLive(slide.id)}
                    onDoubleClick={() => {
                      setCurrentSlide(slide.id)
                      setMode('edit')
                    }}
                    actions={
                      <>
                        <IconButton size="sm" label="Nhân bản slide" icon={<Copy size={12} />} className="text-white hover:bg-white/20" onClick={() => duplicateSlide(pres.id, slide.id)} />
                        <IconButton size="sm" tone="danger" label="Xóa slide" icon={<Trash size={12} />} className="text-white" onClick={() => deleteSlide(pres.id, slide.id)} />
                      </>
                    }
                  />
                </div>
              )
            })}
          </div>
        </section>
      ))}
      <button
        type="button"
        onClick={() => addSlide(pres.id)}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-xs text-muted cursor-pointer hover:border-select hover:text-fg"
      >
        <Plus size={14} /> Thêm slide trống
      </button>
    </div>
  )
}
