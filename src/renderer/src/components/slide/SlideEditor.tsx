import React, { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Slide, TextBlock, SlideBackground } from '../../types'
import { SlideRenderer } from './SlideRenderer'

const FONT_OPTIONS = [
  'sans-serif', 'serif', 'monospace',
  'Arial', 'Helvetica Neue', 'Georgia', 'Times New Roman',
  'Trebuchet MS', 'Impact', 'Verdana', 'Tahoma'
]

// ── Slide Edit Modal ──────────────────────────────────────────────────────────

export function SlideEditModal({ onGoLive }: { onGoLive: (slideId: string) => void }) {
  const { editingSlideId, setEditingSlide } = useStore()
  if (!editingSlideId) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-app flex-shrink-0">
        <span className="text-primary font-semibold text-sm">Slide Editor</span>
        <button
          onClick={() => setEditingSlide(null)}
          className="text-muted hover:text-primary text-sm px-3 py-1 rounded bg-surface hover:bg-hover-2 transition-colors"
        >
          ✕ Close
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <SlideEditor onGoLive={onGoLive} />
      </div>
    </div>
  )
}

// ── Main Slide Editor ─────────────────────────────────────────────────────────

export function SlideEditor({ onGoLive }: { onGoLive: (slideId: string) => void }) {
  const {
    currentPresentationId,
    currentSlideId,
    liveSlideId,
    getCurrentPresentation,
    getCurrentSlide,
    updateSlide,
    updateTextBlock,
    addTextBlock,
    deleteTextBlock
  } = useStore()

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'background' | 'text' | 'slide'>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pres = getCurrentPresentation()
  const slide = getCurrentSlide()

  if (!slide || !pres || !currentPresentationId || !currentSlideId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-2">
        <p className="text-muted text-sm">Select a slide to edit</p>
      </div>
    )
  }

  const isLive = slide.id === liveSlideId

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    updateSlide(currentPresentationId, currentSlideId, {
      background: { type: 'image', url: URL.createObjectURL(file), fit: 'cover' }
    })
  }

  const handleBlockClick = (blockId: string) => {
    setSelectedBlockId(blockId === selectedBlockId ? null : blockId)
    setActiveTab('text')
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-surface-2">
      {/* Preview area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex items-center justify-center p-6 bg-surface-2">
          <div className="relative w-full max-w-3xl" style={{ aspectRatio: '16/9' }}>
            {/* Slide rendered at correct scale */}
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
              <SlideRenderer slide={slide} isOutput={false} className="w-full h-full" />
            </div>

            {/* Clickable overlays for each text block */}
            <div className="absolute inset-0 rounded-lg" style={{ zIndex: 10 }}>
              {slide.textBlocks.map((block) => (
                <div
                  key={block.id}
                  onClick={() => handleBlockClick(block.id)}
                  title={block.content.slice(0, 40) || 'Empty block'}
                  className={`absolute cursor-pointer transition-all ${
                    block.id === selectedBlockId
                      ? 'ring-2 ring-orange-500'
                      : 'hover:ring-1 hover:ring-orange-400/60'
                  }`}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.width}%`,
                    height: `${block.height}%`
                  }}
                >
                  {block.id === selectedBlockId && (
                    <div className="absolute -top-5 left-0 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-t font-medium whitespace-nowrap">
                      {block.fontFamily} · {block.fontSize}px
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-10 bg-panel border-t border-app flex items-center justify-between px-4 flex-shrink-0">
          <span className="text-muted text-xs">
            {slide.textBlocks.length} text block{slide.textBlocks.length !== 1 ? 's' : ''}
            {selectedBlockId && (
              <span className="ml-2 text-orange-400">
                · {slide.textBlocks.find(b => b.id === selectedBlockId)?.fontSize}px selected
              </span>
            )}
          </span>
          <button
            onClick={() => onGoLive(slide.id)}
            className={`flex items-center gap-2 px-4 py-1 rounded font-medium text-sm transition-all ${
              isLive ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isLive ? '● LIVE' : '▶ Go Live'}
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 bg-panel border-l border-app flex flex-col overflow-hidden flex-shrink-0">
        <div className="flex border-b border-app">
          {(['background', 'text', 'slide'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-surface'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'background' && (
            <BackgroundPanel
              slide={slide}
              onUpdate={(bg) => updateSlide(currentPresentationId, currentSlideId, { background: bg })}
              fileInputRef={fileInputRef}
              onImageUpload={handleImageUpload}
            />
          )}
          {activeTab === 'text' && (
            <TextPanel
              slide={slide}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onAddBlock={() => addTextBlock(currentPresentationId, currentSlideId)}
              onDeleteBlock={(id) => deleteTextBlock(currentPresentationId, currentSlideId, id)}
              onUpdateBlock={(id, updates) => updateTextBlock(currentPresentationId, currentSlideId, id, updates)}
            />
          )}
          {activeTab === 'slide' && (
            <SlideSettingsPanel
              slide={slide}
              onUpdate={(updates) => updateSlide(currentPresentationId, currentSlideId, updates)}
            />
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  )
}

// ── Background Panel ──────────────────────────────────────────────────────────

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
  const bg = slide.background
  const videoBg = bg.type === 'video' ? bg : null
  const [videoUrl, setVideoUrl] = useState(videoBg?.url ?? '')

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="label-xs mb-2 block">Background Type</label>
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
                bg.type === type ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {bg.type === 'color' && (
        <div>
          <label className="label-xs mb-2 block">Color</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={bg.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-app-2" />
            <input type="text" value={bg.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="flex-1 input-base px-2 py-1 text-xs font-mono" />
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b69', '#0d1117'].map((c) => (
              <button key={c} onClick={() => onUpdate({ type: 'color', value: c })}
                className="w-6 h-6 rounded border border-app-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}

      {bg.type === 'image' && (
        <div className="space-y-3">
          <label className="label-xs mb-2 block">Image</label>
          {bg.url ? (
            <div className="relative">
              <img src={bg.url} alt="bg" className="w-full h-24 object-cover rounded border border-app-2" />
              <button onClick={() => onUpdate({ type: 'image', url: '', fit: 'cover' })}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center">✕</button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-app-2 rounded flex flex-col items-center justify-center gap-1 hover:border-orange-500/50 transition-colors group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🖼</span>
              <span className="text-xs text-muted">Click to upload image</span>
            </button>
          )}
          {bg.url && (
            <div>
              <label className="label-xs mb-2 block">Fit</label>
              <div className="flex gap-1">
                {(['cover', 'contain', 'fill'] as const).map((fit) => (
                  <button key={fit}
                    onClick={() => onUpdate({ type: 'image', url: (bg as Extract<SlideBackground, { type: 'image' }>).url, fit })}
                    className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                      (bg as Extract<SlideBackground, { type: 'image' }>).fit === fit ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'
                    }`}>
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {bg.type === 'video' && videoBg && (
        <div className="space-y-3">
          <label className="label-xs mb-2 block">Video URL</label>
          <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={() => onUpdate({ type: 'video', url: videoUrl, loop: videoBg.loop, muted: videoBg.muted })}
            placeholder="https://... or /path/to/video.mp4"
            className="w-full input-base px-2 py-1.5 text-xs" />
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={videoBg.loop}
                onChange={(e) => onUpdate({ type: 'video', url: videoBg.url, loop: e.target.checked, muted: videoBg.muted })}
                className="accent-orange-500" />
              <span className="text-xs text-muted">Loop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={videoBg.muted}
                onChange={(e) => onUpdate({ type: 'video', url: videoBg.url, loop: videoBg.loop, muted: e.target.checked })}
                className="accent-orange-500" />
              <span className="text-xs text-muted">Muted</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Text Panel ────────────────────────────────────────────────────────────────

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
  const block = slide.textBlocks.find((b) => b.id === selectedBlockId) ?? null

  return (
    <div className="p-3 space-y-3">
      {/* Block list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-xs">Text Blocks</span>
          <button onClick={onAddBlock} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">+ Add</button>
        </div>
        <div className="space-y-1">
          {slide.textBlocks.map((b, idx) => (
            <div
              key={b.id}
              onClick={() => onSelectBlock(b.id === selectedBlockId ? null : b.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                b.id === selectedBlockId
                  ? 'bg-orange-500/15 ring-1 ring-orange-500/40'
                  : 'bg-surface hover:bg-hover-2'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-xs text-secondary truncate flex-1">
                {idx + 1}. {b.content.slice(0, 28) || '(empty)'}
              </span>
              <span className="text-[10px] text-muted flex-shrink-0">{b.fontSize}px</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteBlock(b.id) }}
                className="text-muted hover:text-red-400 text-xs flex-shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          {slide.textBlocks.length === 0 && (
            <p className="text-xs text-faint text-center py-3">No text blocks — click + Add</p>
          )}
        </div>
      </div>

      {block && (
        <div className="space-y-3 border-t border-app pt-3">
          <span className="label-xs block">Edit Block</span>

          {/* Content */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Content</label>
            <textarea
              value={block.content}
              onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              rows={3}
              className="w-full input-base px-2 py-1.5 text-xs resize-y font-mono"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Font Family</label>
            <select
              value={block.fontFamily}
              onChange={(e) => onUpdateBlock(block.id, { fontFamily: e.target.value })}
              className="input-base w-full px-2 py-1.5 text-xs"
              style={{ fontFamily: block.fontFamily }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="text-[10px] text-muted flex justify-between mb-1">
              <span>Font Size</span>
              <span className="text-primary font-mono">{block.fontSize}px</span>
            </label>
            <input
              type="range" min={8} max={400} value={block.fontSize}
              onChange={(e) => onUpdateBlock(block.id, { fontSize: +e.target.value })}
              className="w-full accent-orange-500"
            />
            <input
              type="number" min={8} max={400} value={block.fontSize}
              onChange={(e) => onUpdateBlock(block.id, { fontSize: +e.target.value })}
              className="input-base w-full px-2 py-1 text-xs mt-1"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={block.color}
                onChange={(e) => onUpdateBlock(block.id, { color: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent border border-app-2" />
              <input type="text" value={block.color}
                onChange={(e) => onUpdateBlock(block.id, { color: e.target.value })}
                className="flex-1 input-base px-2 py-1 text-xs font-mono" />
            </div>
          </div>

          {/* Style row */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Style</label>
            <div className="flex gap-1">
              <button
                onClick={() => onUpdateBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`px-3 py-1 text-xs rounded font-bold transition-colors ${block.fontWeight === 'bold' ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}
              >B</button>
              <button
                onClick={() => onUpdateBlock(block.id, { fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`px-3 py-1 text-xs rounded italic transition-colors ${block.fontStyle === 'italic' ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}
              >I</button>
            </div>
          </div>

          {/* Text align */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Align</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button key={align}
                  onClick={() => onUpdateBlock(block.id, { textAlign: align })}
                  className={`flex-1 py-1 text-sm rounded transition-colors ${block.textAlign === align ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}>
                  {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                </button>
              ))}
            </div>
          </div>

          {/* Text transform */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Transform</label>
            <div className="flex gap-1">
              {(['none', 'uppercase', 'lowercase'] as const).map((t) => (
                <button key={t}
                  onClick={() => onUpdateBlock(block.id, { textTransform: t })}
                  className={`flex-1 py-1 text-[10px] rounded capitalize transition-colors ${block.textTransform === t ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}>
                  {t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : 'aa'}
                </button>
              ))}
            </div>
          </div>

          {/* Line height */}
          <div>
            <label className="text-[10px] text-muted flex justify-between mb-1">
              <span>Line Height</span>
              <span className="text-primary font-mono">{block.lineHeight.toFixed(2)}</span>
            </label>
            <input type="range" min={0.8} max={3} step={0.05} value={block.lineHeight}
              onChange={(e) => onUpdateBlock(block.id, { lineHeight: +e.target.value })}
              className="w-full accent-orange-500" />
          </div>

          {/* Shadow */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={block.textShadow}
                onChange={(e) => onUpdateBlock(block.id, { textShadow: e.target.checked })}
                className="accent-orange-500" />
              <span className="text-[10px] text-muted">Text Shadow</span>
            </label>
            {block.textShadow && (
              <div className="pl-4 space-y-2">
                <div className="flex gap-2 items-center">
                  <input type="color" value={block.shadowColor}
                    onChange={(e) => onUpdateBlock(block.id, { shadowColor: e.target.value })}
                    className="w-8 h-6 rounded cursor-pointer bg-transparent border border-app-2" />
                  <input type="text" value={block.shadowColor}
                    onChange={(e) => onUpdateBlock(block.id, { shadowColor: e.target.value })}
                    className="flex-1 input-base px-2 py-0.5 text-[10px] font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-muted flex justify-between mb-0.5">
                    <span>Blur</span><span className="text-primary">{block.shadowBlur}px</span>
                  </label>
                  <input type="range" min={0} max={40} value={block.shadowBlur}
                    onChange={(e) => onUpdateBlock(block.id, { shadowBlur: +e.target.value })}
                    className="w-full accent-orange-500" />
                </div>
              </div>
            )}
          </div>

          {/* Outline */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={block.outline}
                onChange={(e) => onUpdateBlock(block.id, { outline: e.target.checked })}
                className="accent-orange-500" />
              <span className="text-[10px] text-muted">Text Outline</span>
            </label>
            {block.outline && (
              <div className="pl-4 space-y-2">
                <div className="flex gap-2 items-center">
                  <input type="color" value={block.outlineColor}
                    onChange={(e) => onUpdateBlock(block.id, { outlineColor: e.target.value })}
                    className="w-8 h-6 rounded cursor-pointer bg-transparent border border-app-2" />
                  <input type="text" value={block.outlineColor}
                    onChange={(e) => onUpdateBlock(block.id, { outlineColor: e.target.value })}
                    className="flex-1 input-base px-2 py-0.5 text-[10px] font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-muted flex justify-between mb-0.5">
                    <span>Width</span><span className="text-primary">{block.outlineWidth}px</span>
                  </label>
                  <input type="range" min={1} max={10} value={block.outlineWidth}
                    onChange={(e) => onUpdateBlock(block.id, { outlineWidth: +e.target.value })}
                    className="w-full accent-orange-500" />
                </div>
              </div>
            )}
          </div>

          {/* Position & size */}
          <div>
            <label className="text-[10px] text-muted block mb-1.5">Position & Size (%)</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['x', 'y', 'width', 'height'] as const).map((prop) => (
                <div key={prop}>
                  <label className="text-[9px] text-muted block mb-0.5 uppercase">{prop}</label>
                  <input
                    type="number" min={0} max={100} value={block[prop]}
                    onChange={(e) => onUpdateBlock(block.id, { [prop]: +e.target.value })}
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

// ── Slide Settings Panel ──────────────────────────────────────────────────────

function SlideSettingsPanel({ slide, onUpdate }: { slide: Slide; onUpdate: (updates: Partial<Slide>) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="label-xs mb-2 block">Transition</label>
        <div className="flex gap-1">
          {(['none', 'fade', 'slide'] as const).map((t) => (
            <button key={t}
              onClick={() => onUpdate({ transition: t })}
              className={`flex-1 py-1.5 text-xs rounded capitalize transition-colors ${
                slide.transition === t ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label-xs mb-2 block">Slide Notes</label>
        <textarea
          value={slide.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={5}
          placeholder="Add notes for this slide..."
          className="w-full input-base px-2 py-1.5 text-xs resize-y"
        />
      </div>
    </div>
  )
}
