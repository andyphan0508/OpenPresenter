import React, { useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Slide } from '../../types'

interface SlideThumbProps {
  slide: Slide
  index: number
  isActive: boolean
  isLive: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SlideThumb({ slide, index, isActive, isLive, onClick, onDelete, onDuplicate }: SlideThumbProps) {
  const bg = slide.background
  const mainText = slide.textBlocks[0]?.content || ''

  const bgStyle: React.CSSProperties =
    bg.type === 'color'
      ? { backgroundColor: bg.value }
      : bg.type === 'image'
        ? { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#111' }

  return (
    <div
      className={`relative flex-shrink-0 w-36 cursor-pointer group select-none transition-all duration-100 rounded ${
        isLive
          ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/20'
          : isActive
            ? 'ring-2 ring-orange-500'
            : 'ring-1 ring-black/10 dark:ring-[#3a3a3a] hover:ring-orange-400/60'
      }`}
      style={{ aspectRatio: '16/9' }}
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded overflow-hidden" style={bgStyle}>
        {bg.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-2xl opacity-50">▶</span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-1 overflow-hidden rounded">
        <p
          className="text-center leading-tight overflow-hidden"
          style={{
            fontSize: '6px',
            color: slide.textBlocks[0]?.color || '#fff',
            fontWeight: slide.textBlocks[0]?.fontWeight || 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {mainText}
        </p>
      </div>

      <div className="absolute bottom-0.5 left-1 text-[9px] text-white/50 font-mono">{index + 1}</div>
      {slide.notes && <div className="absolute top-0.5 left-1 text-[8px] text-yellow-400/70">✦</div>}

      {isLive && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-bl font-bold tracking-wide">
          LIVE
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="w-5 h-5 bg-black/50 hover:bg-black/70 rounded text-white text-[9px] flex items-center justify-center"
          title="Duplicate"
        >
          ⧉
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="w-5 h-5 bg-black/50 hover:bg-red-600 rounded text-white text-[9px] flex items-center justify-center"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface SlideListProps {
  onGoLive: (slideId: string) => void
}

export function SlideList({ onGoLive }: SlideListProps) {
  const {
    currentPresentationId,
    currentSlideId,
    liveSlideId,
    getCurrentPresentation,
    setCurrentSlide,
    deleteSlide,
    addSlide,
    duplicateSlide
  } = useStore()

  const pres = getCurrentPresentation()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = liveSlideId || currentSlideId
    if (!id || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-slide-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [liveSlideId, currentSlideId])

  if (!pres) {
    return (
      <div className="h-44 bg-panel border-b border-app flex items-center justify-center flex-shrink-0">
        <p className="text-muted text-sm">No presentation open — create one in the sidebar</p>
      </div>
    )
  }

  const handleClick = (slideId: string) => {
    setCurrentSlide(slideId)
    onGoLive(slideId)
  }

  return (
    <div className="h-44 bg-panel border-b border-app flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-app">
        <span className="text-muted text-xs font-medium uppercase tracking-wider">
          Slides ({pres.slides.length})
        </span>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">Click to go live · Arrows to navigate</span>
          <button
            onClick={() => currentPresentationId && addSlide(currentPresentationId)}
            className="flex items-center gap-1 text-xs text-muted hover:text-primary px-2 py-0.5 rounded bg-hover transition-colors"
          >
            <span>+</span>
            <span>Add</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-2 px-3 py-2"
      >
        {pres.slides.map((slide, idx) => (
          <div key={slide.id} data-slide-id={slide.id}>
            <SlideThumb
              slide={slide}
              index={idx}
              isActive={slide.id === currentSlideId}
              isLive={slide.id === liveSlideId}
              onClick={() => handleClick(slide.id)}
              onDelete={() => currentPresentationId && deleteSlide(currentPresentationId, slide.id)}
              onDuplicate={() => currentPresentationId && duplicateSlide(currentPresentationId, slide.id)}
            />
          </div>
        ))}

        <button
          onClick={() => currentPresentationId && addSlide(currentPresentationId)}
          className="flex-shrink-0 w-36 border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] hover:border-orange-400 rounded flex items-center justify-center transition-colors group"
          style={{ aspectRatio: '16/9' }}
        >
          <span className="text-muted group-hover:text-orange-500 text-2xl transition-colors">+</span>
        </button>
      </div>
    </div>
  )
}
