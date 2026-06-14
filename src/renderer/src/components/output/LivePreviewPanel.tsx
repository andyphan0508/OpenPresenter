import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Presentation, OutputSettings, Slide } from '../../types'

interface LiveMiniSlideProps {
  slide: Slide
}

function LiveMiniSlide({ slide }: LiveMiniSlideProps) {
  const bg = slide.background
  const mainText = slide.textBlocks[0]

  const bgStyle: React.CSSProperties =
    bg.type === 'color'
      ? { backgroundColor: bg.value }
      : bg.type === 'image'
        ? { backgroundImage: `url(${bg.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#111' }

  return (
    <div
      className="w-full rounded overflow-hidden border border-app shadow-sm"
      style={{ ...bgStyle, aspectRatio: '16/9', position: 'relative' }}
    >
      {(bg.type === 'image' || bg.type === 'video') && !!bg.dim && bg.dim > 0 && (
        <div className="absolute inset-0 bg-black" style={{ opacity: bg.dim }} />
      )}
      {mainText && (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <p
            className="text-center text-[6px] leading-tight font-bold"
            style={{ color: mainText.color, textShadow: '0 1px 2px rgba(0,0,0,0.8)', whiteSpace: 'pre-wrap' }}
          >
            {mainText.content.slice(0, 80)}
          </p>
        </div>
      )}
    </div>
  )
}

interface LivePreviewPanelProps {
  pres: Presentation
  liveSlideId: string | null
  outputSettings: OutputSettings
  outputEnabled: boolean
  onGoLive: (slideId: string) => void
}

export function LivePreviewPanel({
  pres,
  liveSlideId,
  outputEnabled,
  onGoLive
}: LivePreviewPanelProps) {
  const liveSlide = pres.slides.find((s) => s.id === liveSlideId)
  const liveIdx = pres.slides.findIndex((s) => s.id === liveSlideId)
  const nextSlide = liveIdx >= 0 ? pres.slides[liveIdx + 1] : pres.slides[0]

  return (
    <div className="w-64 border-l border-app flex flex-col bg-panel flex-shrink-0 fade-in-up">
      <div className="px-3 py-2 border-b border-app flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Output Preview</span>
        {outputEnabled && liveSlideId && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Now showing */}
      <div className="p-3 border-b border-app">
        <p className="text-[10px] text-muted font-medium mb-2 uppercase tracking-wider">Now Showing</p>
        {liveSlide ? (
          <LiveMiniSlide slide={liveSlide} />
        ) : (
          <div
            className="w-full rounded bg-black border border-app flex items-center justify-center"
            style={{ aspectRatio: '16/9' }}
          >
            <span className="text-faint text-[10px]">Black Screen</span>
          </div>
        )}
        {liveSlide && (
          <p className="text-[10px] text-muted mt-1.5 text-center truncate">
            {liveSlide.textBlocks[0]?.content.slice(0, 40) || '(no text)'}
          </p>
        )}
      </div>

      {/* Up next */}
      <div className="p-3 border-b border-app">
        <p className="text-[10px] text-muted font-medium mb-2 uppercase tracking-wider">Up Next</p>
        {nextSlide && nextSlide.id !== liveSlideId ? (
          <button className="w-full group text-left" onClick={() => onGoLive(nextSlide.id)}>
            <LiveMiniSlide slide={nextSlide} />
            <p className="flex items-center justify-center gap-0.5 text-[10px] text-faint group-hover:text-orange-500 mt-1.5 transition-colors">
              Click to present <ChevronRight className="w-3 h-3" />
            </p>
          </button>
        ) : (
          <div
            className="w-full rounded bg-gray-100 dark:bg-[#1e1e1e] border border-app flex items-center justify-center"
            style={{ aspectRatio: '16/9' }}
          >
            <span className="text-faint text-[10px]">
              {pres.slides.length === 0 ? 'No slides' : 'End of slides'}
            </span>
          </div>
        )}
      </div>

      {/* Navigator */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-app flex items-center justify-between">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Navigator</p>
          <div className="flex gap-0.5">
            <button
              onClick={() => { const prev = pres.slides[liveIdx - 1]; if (prev) onGoLive(prev.id) }}
              disabled={liveIdx <= 0}
              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { const next = pres.slides[liveIdx + 1]; if (next) onGoLive(next.id) }}
              disabled={liveIdx >= pres.slides.length - 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {pres.slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => onGoLive(slide.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                slide.id === liveSlideId
                  ? 'bg-orange-500/15 text-orange-500 dark:text-orange-400'
                  : 'text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              <span className="text-faint font-mono text-[10px] w-4 text-right flex-shrink-0">{idx + 1}</span>
              <span className="truncate">{slide.textBlocks[0]?.content.slice(0, 28) || '(empty)'}</span>
              {slide.id === liveSlideId && (
                <span className="ml-auto text-[9px] font-bold text-orange-500 flex-shrink-0">LIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
