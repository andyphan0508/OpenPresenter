import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Slide } from '../types'
import { SlideRenderer } from './SlideRenderer'

// ─── Scaled thumbnail using SlideRenderer ───────────────────────────────────
// Uses ResizeObserver so the scale always matches the actual rendered cell width

function SlideThumbnail({ slide }: { slide: Slide }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Measure immediately
    const measure = (width: number) => setScale(width / 1920)
    measure(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      measure(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded"
      style={{ aspectRatio: '16/9', position: 'relative' }}
    >
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }}
      >
        <SlideRenderer slide={slide} isOutput={false} className="w-full h-full" />
      </div>
    </div>
  )
}

// ─── Context menu ────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number
  y: number
  slideId: string
}

function ContextMenu({
  menu,
  isLive,
  onClose,
  onEdit,
  onGoLive,
  onDuplicate,
  onDelete
}: {
  menu: ContextMenuState
  isLive: boolean
  onClose: () => void
  onEdit: () => void
  onGoLive: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  useEffect(() => {
    const handleClick = () => onClose()
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: menu.x,
    top: menu.y,
    zIndex: 9999,
    minWidth: 180
  }

  const item = (icon: string, label: string, onClick: () => void, danger = false) => (
    <button
      onMouseDown={(e) => { e.stopPropagation(); onClick() }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
        danger
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-primary hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div
      style={menuStyle}
      className="bg-panel border border-app rounded-lg shadow-2xl py-1 overflow-hidden"
    >
      {item('✏️', 'Edit Slide', onEdit)}
      {item(isLive ? '■' : '▶', isLive ? 'Stop Presenting' : 'Present Live', onGoLive)}
      <div className="my-1 border-t border-app" />
      {item('⧉', 'Duplicate Slide', onDuplicate)}
      <div className="my-1 border-t border-app" />
      {item('🗑', 'Delete Slide', onDelete, true)}
    </div>
  )
}

// ─── Single slide card ───────────────────────────────────────────────────────

interface SlideCardProps {
  slide: Slide
  index: number
  isActive: boolean
  isLive: boolean
  isOutputOn: boolean
  onSelect: () => void
  onEdit: () => void
  onGoLive: () => void
  onDelete: () => void
  onDuplicate: () => void
  onContextMenu: (e: React.MouseEvent, slideId: string) => void
}

function SlideCard({
  slide,
  index,
  isActive,
  isLive,
  isOutputOn,
  onSelect,
  onEdit,
  onGoLive,
  onDelete,
  onDuplicate,
  onContextMenu
}: SlideCardProps) {
  return (
    <div
      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-100 select-none ${
        isLive
          ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20'
          : isActive
            ? 'ring-2 ring-blue-400 dark:ring-blue-500'
            : 'ring-1 ring-black/10 dark:ring-[#3a3a3a] hover:ring-gray-300 dark:hover:ring-[#555]'
      }`}
      onClick={onSelect}
      onDoubleClick={onEdit}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, slide.id) }}
    >
      {/* Thumbnail using SlideRenderer for accurate live preview */}
      <SlideThumbnail slide={slide} />

      {/* LIVE badge */}
      {isLive && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 font-bold tracking-wide rounded-bl">
          LIVE
        </div>
      )}

      {/* Notes dot */}
      {slide.notes && (
        <div className="absolute top-1 left-1 text-[8px] text-yellow-400/80">✦</div>
      )}

      {/* Slide number */}
      <div className="absolute bottom-0.5 left-1.5 text-[9px] text-white/60 font-mono drop-shadow">
        {index + 1}
      </div>

      {/* Hover overlay with action buttons */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
        {/* Go live center button */}
        <button
          onClick={(e) => { e.stopPropagation(); onGoLive() }}
          title={isOutputOn ? 'Present this slide' : 'Set active (enable Output to show live)'}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors ${
            isLive
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-white/90 text-gray-800 hover:bg-orange-500 hover:text-white'
          }`}
        >
          {isLive ? '■' : '▶'}
        </button>

        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="px-2 py-0.5 rounded text-[10px] bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Top-right quick actions */}
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
        {!isLive && (
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            className="w-5 h-5 bg-black/50 hover:bg-black/70 rounded text-white text-[9px] flex items-center justify-center"
            title="Duplicate"
          >
            ⧉
          </button>
        )}
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

// ─── Main SlideList ──────────────────────────────────────────────────────────

interface SlideListProps {
  onGoLive: (slideId: string) => void
}

export function SlideList({ onGoLive }: SlideListProps) {
  const {
    currentPresentationId,
    currentSlideId,
    liveSlideId,
    outputEnabled,
    getCurrentPresentation,
    setCurrentSlide,
    setEditingSlide,
    deleteSlide,
    addSlide,
    duplicateSlide
  } = useStore()

  const pres = getCurrentPresentation()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to live or active slide
  useEffect(() => {
    const id = liveSlideId || currentSlideId
    if (!id || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-slide-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [liveSlideId, currentSlideId])

  const handleContextMenu = useCallback((e: React.MouseEvent, slideId: string) => {
    e.preventDefault()
    // Clamp to viewport
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 180)
    setContextMenu({ x, y, slideId })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  // Navigate live slide prev/next
  const navigateLive = useCallback((dir: -1 | 1) => {
    if (!pres) return
    const slides = pres.slides
    const liveIdx = slides.findIndex((s) => s.id === liveSlideId)
    if (liveIdx === -1) {
      // No live slide — start from beginning or end
      const target = dir === 1 ? slides[0] : slides[slides.length - 1]
      if (target) onGoLive(target.id)
      return
    }
    const next = slides[liveIdx + dir]
    if (next) onGoLive(next.id)
  }, [pres, liveSlideId, onGoLive])

  if (!pres) {
    return (
      <div className="flex-1 bg-surface-2 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#333] flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-300 dark:text-[#444] text-2xl">▣</span>
          </div>
          <p className="text-muted text-sm font-medium">No presentation open</p>
          <p className="text-faint text-xs mt-1">Select or create one in the sidebar</p>
        </div>
      </div>
    )
  }

  const liveIdx = pres.slides.findIndex((s) => s.id === liveSlideId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-2 relative">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app bg-panel flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-medium">
            {pres.slides.length} {pres.slides.length === 1 ? 'slide' : 'slides'}
          </span>
          {liveSlideId && (
            <span className="flex items-center gap-1 text-[10px] text-orange-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Slide {liveIdx + 1} live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation arrows */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigateLive(-1)}
              disabled={liveIdx <= 0 && liveSlideId !== null}
              title="Previous slide (live)"
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors text-sm"
            >
              ‹
            </button>
            <button
              onClick={() => navigateLive(1)}
              disabled={liveIdx >= pres.slides.length - 1 && liveSlideId !== null}
              title="Next slide (live)"
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors text-sm"
            >
              ›
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-[#333]" />

          <span className="text-faint text-[10px] hidden sm:inline">Double-click or right-click to edit</span>

          <button
            onClick={() => currentPresentationId && addSlide(currentPresentationId)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors"
          >
            + Add Slide
          </button>
        </div>
      </div>

      {/* Slides grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3"
      >
        {pres.slides.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted text-sm">No slides yet</p>
              <button
                onClick={() => currentPresentationId && addSlide(currentPresentationId)}
                className="mt-3 px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                + Add First Slide
              </button>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${THUMB_W}px, 1fr))` }}
          >
            {pres.slides.map((slide, idx) => (
              <div key={slide.id} data-slide-id={slide.id}>
                <SlideCard
                  slide={slide}
                  index={idx}
                  isActive={slide.id === currentSlideId}
                  isLive={slide.id === liveSlideId}
                  isOutputOn={outputEnabled}
                  onSelect={() => setCurrentSlide(slide.id)}
                  onEdit={() => { setCurrentSlide(slide.id); setEditingSlide(slide.id) }}
                  onGoLive={() => onGoLive(slide.id)}
                  onDelete={() => currentPresentationId && deleteSlide(currentPresentationId, slide.id)}
                  onDuplicate={() => currentPresentationId && duplicateSlide(currentPresentationId, slide.id)}
                  onContextMenu={handleContextMenu}
                />
              </div>
            ))}

            {/* Add slide placeholder card */}
            <button
              onClick={() => currentPresentationId && addSlide(currentPresentationId)}
              className="border-2 border-dashed border-gray-200 dark:border-[#3a3a3a] hover:border-orange-400 dark:hover:border-orange-400/60 rounded-lg flex items-center justify-center transition-colors group"
              style={{ aspectRatio: '16/9' }}
              title="Add a new slide"
            >
              <span className="text-muted group-hover:text-orange-500 text-3xl transition-colors leading-none">+</span>
            </button>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          isLive={contextMenu.slideId === liveSlideId}
          onClose={closeContextMenu}
          onEdit={() => {
            setCurrentSlide(contextMenu.slideId)
            setEditingSlide(contextMenu.slideId)
            closeContextMenu()
          }}
          onGoLive={() => {
            onGoLive(contextMenu.slideId)
            closeContextMenu()
          }}
          onDuplicate={() => {
            if (currentPresentationId) duplicateSlide(currentPresentationId, contextMenu.slideId)
            closeContextMenu()
          }}
          onDelete={() => {
            if (currentPresentationId) {
              if (window.confirm('Delete this slide?')) {
                deleteSlide(currentPresentationId, contextMenu.slideId)
              }
            }
            closeContextMenu()
          }}
        />
      )}
    </div>
  )
}
