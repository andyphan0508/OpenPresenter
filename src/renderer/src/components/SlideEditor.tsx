import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Slide, TextBlock, SlideBackground } from '../types'
import { SlideRenderer } from './SlideRenderer'

// ─── Main modal entry point ──────────────────────────────────────────────────

interface SlideEditModalProps {
  onGoLive: (slideId: string) => void
}

export function SlideEditModal({ onGoLive }: SlideEditModalProps) {
  const {
    editingSlideId,
    currentPresentationId,
    liveSlideId,
    outputEnabled,
    setEditingSlide,
    getCurrentPresentation,
    updateSlide,
    updateTextBlock,
    addTextBlock,
    deleteTextBlock
  } = useStore()

  if (!editingSlideId || !currentPresentationId) return null

  const pres = getCurrentPresentation()
  const slide = pres?.slides.find((s) => s.id === editingSlideId)

  if (!slide || !pres) return null

  const isLive = slide.id === liveSlideId
  const slides = pres.slides
  const currentIdx = slides.findIndex((s) => s.id === editingSlideId)

  const goToSlide = (idx: number) => {
    const target = slides[idx]
    if (target) setEditingSlide(target.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setEditingSlide(null)
      }}
    >
      <div className="bg-panel rounded-xl border border-app shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(95vw, 1100px)', height: 'min(90vh, 760px)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-app flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-primary font-semibold text-sm">Edit Slide</span>
            {isLive && outputEnabled && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Slide navigation inside modal */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToSlide(currentIdx - 1)}
              disabled={currentIdx <= 0}
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-muted disabled:opacity-30 transition-colors"
              title="Previous slide"
            >
              ‹
            </button>
            <span className="text-xs text-muted font-mono">{currentIdx + 1} / {slides.length}</span>
            <button
              onClick={() => goToSlide(currentIdx + 1)}
              disabled={currentIdx >= slides.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-muted disabled:opacity-30 transition-colors"
              title="Next slide"
            >
              ›
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-[#333] mx-1" />

            <button
              onClick={() => onGoLive(slide.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                isLive
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isLive ? '■ Stop' : '▶ Present'}
            </button>

            <button
              onClick={() => setEditingSlide(null)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-muted hover:text-primary text-lg leading-none transition-colors"
              title="Close editor (Escape)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Editor body */}
        <SlideEditorBody
          slide={slide}
          presentationId={currentPresentationId}
          isLive={isLive}
          outputEnabled={outputEnabled}
          onGoLive={() => onGoLive(slide.id)}
          onUpdateSlide={(updates) => updateSlide(currentPresentationId, slide.id, updates)}
          onUpdateTextBlock={(blockId, updates) =>
            updateTextBlock(currentPresentationId, slide.id, blockId, updates)
          }
          onAddTextBlock={() => addTextBlock(currentPresentationId, slide.id)}
          onDeleteTextBlock={(blockId) => deleteTextBlock(currentPresentationId, slide.id, blockId)}
        />
      </div>
    </div>
  )
}

// ─── Slide canvas: fills container while preserving 16:9 (like object-fit:contain) ──

function SlideCanvasPreview({ slide }: { slide: Slide }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = ({ width, height }: { width: number; height: number }) => {
      setBox({ w: width, h: height })
    }
    measure(el.getBoundingClientRect())
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      measure({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Compute the largest 16:9 rect that fits in the container
  let slideW = box.w
  let slideH = box.w * 9 / 16
  if (slideH > box.h) {
    slideH = box.h
    slideW = box.h * 16 / 9
  }
  const scale = slideW / 1920

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-surface-2 overflow-hidden"
    >
      {box.w > 0 && (
        <div
          className="rounded-lg overflow-hidden shadow-2xl flex-shrink-0"
          style={{ width: slideW, height: slideH }}
        >
          {/* Render at 1920×1080 and scale down to fill exactly */}
          <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <SlideRenderer slide={slide} isOutput={false} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Editor body (canvas + controls) ────────────────────────────────────────

function SlideEditorBody({
  slide,
  isLive,
  outputEnabled,
  onUpdateSlide,
  onUpdateTextBlock,
  onAddTextBlock,
  onDeleteTextBlock
}: {
  slide: Slide
  presentationId: string
  isLive: boolean
  outputEnabled: boolean
  onGoLive: () => void
  onUpdateSlide: (updates: Partial<Slide>) => void
  onUpdateTextBlock: (blockId: string, updates: Partial<TextBlock>) => void
  onAddTextBlock: () => void
  onDeleteTextBlock: (blockId: string) => void
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    slide.textBlocks[0]?.id ?? null
  )
  const [activeTab, setActiveTab] = useState<'background' | 'text' | 'notes'>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep selectedBlockId in sync if slide changes
  useEffect(() => {
    if (selectedBlockId && !slide.textBlocks.find((b) => b.id === selectedBlockId)) {
      setSelectedBlockId(slide.textBlocks[0]?.id ?? null)
    }
  }, [slide.textBlocks, selectedBlockId])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onUpdateSlide({ background: { type: 'image', url, fit: 'cover' } })
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas preview — fills available space, slide letterboxed inside */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-2">
        <SlideCanvasPreview slide={slide} />


        {/* Slide info bar */}
        <div className="h-10 bg-panel border-t border-app flex items-center px-4 gap-3 text-xs text-muted flex-shrink-0">
          <span>{slide.textBlocks.length} text block{slide.textBlocks.length !== 1 ? 's' : ''}</span>
          {slide.notes && <span className="text-yellow-500/80 truncate max-w-48">✦ {slide.notes}</span>}
          {isLive && outputEnabled && (
            <span className="flex items-center gap-1 text-orange-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              This slide is live
            </span>
          )}
        </div>
      </div>

      {/* Right panel: controls */}
      <div className="w-72 bg-panel border-l border-app flex flex-col overflow-hidden flex-shrink-0">
        {/* Tab bar */}
        <div className="flex border-b border-app flex-shrink-0">
          {(['background', 'text', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-surface-2'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {tab === 'background' ? 'Background' : tab === 'text' ? 'Text' : 'Notes'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'background' && (
            <BackgroundPanel
              slide={slide}
              onUpdate={(bg) => onUpdateSlide({ background: bg })}
              fileInputRef={fileInputRef}
              onImageUpload={handleImageUpload}
            />
          )}
          {activeTab === 'text' && (
            <TextPanel
              slide={slide}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onAddBlock={onAddTextBlock}
              onDeleteBlock={onDeleteTextBlock}
              onUpdateBlock={onUpdateTextBlock}
            />
          )}
          {activeTab === 'notes' && (
            <NotesPanel slide={slide} onUpdate={onUpdateSlide} />
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  )
}

// ─── Background panel ────────────────────────────────────────────────────────

function BackgroundPanel({
  slide,
  onUpdate,
  fileInputRef,
  onImageUpload
}: {
  slide: Slide
  onUpdate: (bg: SlideBackground) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [videoUrl, setVideoUrl] = useState(slide.background.type === 'video' ? slide.background.url : '')

  const PRESET_COLORS = ['#000000', '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b69', '#0d1117', '#1c1c1c']

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-muted font-medium block mb-2">Background Type</label>
        <div className="flex gap-1">
          {(['color', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                if (type === 'color') onUpdate({ type: 'color', value: '#000000' })
                else if (type === 'image') onUpdate({ type: 'image', url: '', fit: 'cover' })
                else onUpdate({ type: 'video', url: '', loop: true, muted: true })
              }}
              className={`flex-1 py-1.5 text-xs rounded capitalize transition-colors ${
                slide.background.type === type
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {slide.background.type === 'color' && (
        <div>
          <label className="text-xs text-muted block mb-2">Color</label>
          <div className="flex gap-2 items-center mb-2">
            <input
              type="color"
              value={slide.background.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-app"
            />
            <input
              type="text"
              value={slide.background.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="flex-1 input-base px-2 py-1 text-xs font-mono"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ type: 'color', value: c })}
                className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                  (slide.background as any).value === c ? 'border-orange-500 scale-110' : 'border-app'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {slide.background.type === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-2">Image</label>
            {(slide.background as any).url ? (
              <div className="relative">
                <img
                  src={(slide.background as any).url}
                  alt="background"
                  className="w-full h-24 object-cover rounded border border-app"
                />
                <button
                  onClick={() => onUpdate({ type: 'image', url: '', fit: 'cover' })}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-[#333] rounded flex flex-col items-center justify-center gap-1 hover:border-orange-400 transition-colors group"
              >
                <span className="text-xl text-muted group-hover:text-orange-500 transition-colors">↑</span>
                <span className="text-xs text-muted">Click to upload image</span>
              </button>
            )}
          </div>
          {(slide.background as any).url && (
            <div>
              <label className="text-xs text-muted block mb-2">Fit</label>
              <div className="flex gap-1">
                {(['cover', 'contain', 'fill'] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() => onUpdate({ type: 'image', url: (slide.background as any).url, fit })}
                    className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                      (slide.background as any).fit === fit
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {slide.background.type === 'video' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-2">Video URL or file path</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() =>
                onUpdate({
                  type: 'video',
                  url: videoUrl,
                  loop: (slide.background as any).loop ?? true,
                  muted: (slide.background as any).muted ?? true
                })
              }
              placeholder="https://... or /path/to/video.mp4"
              className="w-full input-base px-2 py-1.5 text-xs"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(slide.background as any).loop ?? true}
                onChange={(e) =>
                  onUpdate({
                    type: 'video',
                    url: (slide.background as any).url,
                    loop: e.target.checked,
                    muted: (slide.background as any).muted
                  })
                }
                className="accent-orange-500"
              />
              <span className="text-xs text-muted">Loop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(slide.background as any).muted ?? true}
                onChange={(e) =>
                  onUpdate({
                    type: 'video',
                    url: (slide.background as any).url,
                    loop: (slide.background as any).loop,
                    muted: e.target.checked
                  })
                }
                className="accent-orange-500"
              />
              <span className="text-xs text-muted">Muted</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Text panel ──────────────────────────────────────────────────────────────

function TextPanel({
  slide,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onDeleteBlock,
  onUpdateBlock
}: {
  slide: Slide
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onAddBlock: () => void
  onDeleteBlock: (id: string) => void
  onUpdateBlock: (id: string, updates: Partial<TextBlock>) => void
}) {
  const selectedBlock = slide.textBlocks.find((b) => b.id === selectedBlockId)

  const FONTS = [
    'sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica', 'Georgia',
    'Times New Roman', 'Trebuchet MS', 'Impact', 'Verdana'
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Block list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted font-medium">Text Blocks</label>
          <button onClick={onAddBlock} className="text-xs text-orange-500 hover:text-orange-400">
            + Add Block
          </button>
        </div>

        {slide.textBlocks.length === 0 ? (
          <button
            onClick={onAddBlock}
            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-[#333] rounded text-muted hover:border-orange-400 hover:text-orange-500 transition-colors text-xs"
          >
            + Add your first text block
          </button>
        ) : (
          <div className="space-y-1">
            {slide.textBlocks.map((block, idx) => (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id === selectedBlockId ? null : block.id)}
                className={`flex items-center justify-between px-2.5 py-2 rounded cursor-pointer transition-colors ${
                  block.id === selectedBlockId
                    ? 'bg-orange-500/10 border border-orange-500/20'
                    : 'bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <span className="text-xs text-secondary truncate flex-1">
                  {idx + 1}. {block.content.slice(0, 32) || '(empty)'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id) }}
                  className="text-faint hover:text-red-400 ml-2 text-xs transition-colors"
                  title="Delete block"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block editor */}
      {selectedBlock && (
        <div className="space-y-3 border-t border-app pt-4">
          <label className="text-xs text-muted font-medium block">Edit Block</label>

          {/* Content */}
          <div>
            <label className="text-xs text-muted block mb-1">Content</label>
            <textarea
              value={selectedBlock.content}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })}
              rows={4}
              className="w-full input-base px-2 py-1.5 text-xs resize-y font-mono"
              placeholder="Enter text..."
            />
          </div>

          {/* Font family */}
          <div>
            <label className="text-xs text-muted block mb-1">Font</label>
            <select
              value={selectedBlock.fontFamily}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { fontFamily: e.target.value })}
              className="w-full input-base px-2 py-1.5 text-xs"
            >
              {FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs text-muted flex justify-between mb-1">
              <span>Font Size</span>
              <span className="text-primary font-mono">{selectedBlock.fontSize}px</span>
            </label>
            <input
              type="range" min={12} max={200}
              value={selectedBlock.fontSize}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { fontSize: +e.target.value })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted block mb-1">Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selectedBlock.color}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { color: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent border border-app"
              />
              <input
                type="text"
                value={selectedBlock.color}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { color: e.target.value })}
                className="flex-1 input-base px-2 py-1 text-xs font-mono"
              />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-xs text-muted block mb-1">Alignment</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdateBlock(selectedBlock.id, { textAlign: align })}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                    selectedBlock.textAlign === align
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
                  }`}
                >
                  {align === 'left' ? '⟵' : align === 'center' ? '≡' : '⟶'}
                  <span className="text-[8px] block">{align}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style buttons */}
          <div>
            <label className="text-xs text-muted block mb-1">Style</label>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => onUpdateBlock(selectedBlock.id, { fontWeight: selectedBlock.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`px-3 py-1.5 text-xs rounded font-bold transition-colors ${
                  selectedBlock.fontWeight === 'bold' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted'
                }`}
              >
                B
              </button>
              <button
                onClick={() => onUpdateBlock(selectedBlock.id, { fontStyle: selectedBlock.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`px-3 py-1.5 text-xs rounded italic transition-colors ${
                  selectedBlock.fontStyle === 'italic' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted'
                }`}
              >
                I
              </button>
              <label className="flex items-center gap-1.5 px-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBlock.textShadow}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { textShadow: e.target.checked })}
                  className="accent-orange-500"
                />
                <span className="text-xs text-muted">Shadow</span>
              </label>
              <label className="flex items-center gap-1.5 px-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBlock.outline}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { outline: e.target.checked })}
                  className="accent-orange-500"
                />
                <span className="text-xs text-muted">Outline</span>
              </label>
            </div>
          </div>

          {/* Outline color (if enabled) */}
          {selectedBlock.outline && (
            <div>
              <label className="text-xs text-muted flex justify-between mb-1">
                <span>Outline</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={selectedBlock.outlineColor}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { outlineColor: e.target.value })}
                  className="w-8 h-7 rounded cursor-pointer bg-transparent border border-app"
                />
                <input
                  type="range" min={1} max={10}
                  value={selectedBlock.outlineWidth}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { outlineWidth: +e.target.value })}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs text-muted font-mono w-6">{selectedBlock.outlineWidth}px</span>
              </div>
            </div>
          )}

          {/* Line height */}
          <div>
            <label className="text-xs text-muted flex justify-between mb-1">
              <span>Line Height</span>
              <span className="text-primary font-mono">{selectedBlock.lineHeight.toFixed(2)}</span>
            </label>
            <input
              type="range" min={0.8} max={3} step={0.05}
              value={selectedBlock.lineHeight}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { lineHeight: +e.target.value })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Text transform */}
          <div>
            <label className="text-xs text-muted block mb-1">Transform</label>
            <div className="flex gap-1">
              {(['none', 'uppercase', 'lowercase'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateBlock(selectedBlock.id, { textTransform: t })}
                  className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                    selectedBlock.textTransform === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
                  }`}
                >
                  {t === 'none' ? 'None' : t === 'uppercase' ? 'AA' : 'aa'}
                </button>
              ))}
            </div>
          </div>

          {/* Position & size */}
          <div>
            <label className="text-xs text-muted block mb-2">Position & Size (%)</label>
            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y', 'width', 'height'] as const).map((prop) => (
                <div key={prop}>
                  <label className="text-[10px] text-faint block mb-0.5 uppercase">{prop}</label>
                  <input
                    type="number"
                    value={selectedBlock[prop]}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { [prop]: +e.target.value })}
                    className="w-full input-base px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notes panel ─────────────────────────────────────────────────────────────

function NotesPanel({
  slide,
  onUpdate
}: {
  slide: Slide
  onUpdate: (updates: Partial<Slide>) => void
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-muted font-medium block mb-2">Transition</label>
        <div className="flex gap-1">
          {(['none', 'fade', 'slide'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ transition: t })}
              className={`flex-1 py-1.5 text-xs rounded capitalize transition-colors ${
                slide.transition === t
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted font-medium block mb-1">Slide Notes</label>
        <p className="text-[10px] text-faint mb-2">
          Notes are visible to you only — not shown on the output screen.
        </p>
        <textarea
          value={slide.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={8}
          placeholder="Add notes for this slide (speaker notes, reminders, etc.)..."
          className="w-full input-base px-2 py-1.5 text-xs resize-y"
        />
      </div>
    </div>
  )
}
