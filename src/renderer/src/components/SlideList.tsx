import React, { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Slide } from '../types'

interface SlideThumbProps {
  slide: Slide
  index: number
  isActive: boolean
  isLive: boolean
  onSelect: () => void
  onGoLive: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SlideThumb({
  slide,
  index,
  isActive,
  isLive,
  onSelect,
  onGoLive,
  onDelete,
  onDuplicate
}: SlideThumbProps) {
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
      className={`relative flex-shrink-0 w-36 cursor-pointer group select-none transition-all duration-150 ${
        isActive ? 'ring-2 ring-orange-500' : 'ring-1 ring-[#3a3a3a] hover:ring-[#555]'
      }`}
      style={{ aspectRatio: '16/9', borderRadius: 4 }}
      onClick={onSelect}
      onDoubleClick={onGoLive}
    >
      {/* Background */}
      <div className="absolute inset-0 rounded overflow-hidden" style={bgStyle}>
        {bg.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-2xl opacity-50">▶</span>
          </div>
        )}
      </div>

      {/* Text preview */}
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

      {/* Slide number */}
      <div className="absolute bottom-0.5 left-1 text-[9px] text-white/50 font-mono">{index + 1}</div>

      {/* Notes indicator */}
      {slide.notes && (
        <div className="absolute top-0.5 left-1 text-[8px] text-yellow-400/70">✦</div>
      )}

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 rounded-bl font-bold">
          LIVE
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded" />
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onGoLive() }}
          className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded text-white text-[9px] flex items-center justify-center font-bold"
          title="Go Live"
        >
          ▶
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="w-5 h-5 bg-[#444] hover:bg-[#555] rounded text-white text-[9px] flex items-center justify-center"
          title="Duplicate"
        >
          ⧉
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="w-5 h-5 bg-[#444] hover:bg-red-700 rounded text-white text-[9px] flex items-center justify-center"
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

  // Auto-scroll to active slide
  useEffect(() => {
    if (!currentSlideId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-slide-id="${currentSlideId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'nearest' })
  }, [currentSlideId])

  if (!pres) {
    return (
      <div className="h-44 bg-[#1e1e1e] border-b border-[#3a3a3a] flex items-center justify-center">
        <p className="text-[#555] text-sm">No presentation open</p>
      </div>
    )
  }

  return (
    <div className="h-44 bg-[#1e1e1e] border-b border-[#3a3a3a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a2a]">
        <span className="text-[#888] text-xs font-medium uppercase tracking-wider">
          Slides ({pres.slides.length})
        </span>
        <button
          onClick={() => currentPresentationId && addSlide(currentPresentationId)}
          className="flex items-center gap-1 text-xs text-[#888] hover:text-white px-2 py-0.5 rounded hover:bg-[#3a3a3a] transition-colors"
        >
          <span>+</span>
          <span>Add Slide</span>
        </button>
      </div>

      {/* Slides strip */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-2 px-3 py-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent"
      >
        {pres.slides.map((slide, idx) => (
          <div key={slide.id} data-slide-id={slide.id}>
            <SlideThumb
              slide={slide}
              index={idx}
              isActive={slide.id === currentSlideId}
              isLive={slide.id === liveSlideId}
              onSelect={() => setCurrentSlide(slide.id)}
              onGoLive={() => onGoLive(slide.id)}
              onDelete={() => currentPresentationId && deleteSlide(currentPresentationId, slide.id)}
              onDuplicate={() => currentPresentationId && duplicateSlide(currentPresentationId, slide.id)}
            />
          </div>
        ))}

        {/* Add slide button at end */}
        <button
          onClick={() => currentPresentationId && addSlide(currentPresentationId)}
          className="flex-shrink-0 w-36 border-2 border-dashed border-[#3a3a3a] hover:border-orange-500/50 rounded flex items-center justify-center transition-colors group"
          style={{ aspectRatio: '16/9' }}
        >
          <span className="text-[#555] group-hover:text-orange-500 text-2xl transition-colors">+</span>
        </button>
      </div>
    </div>
  )
}
