import React, { useState, useRef, useEffect } from 'react'
import {
  X, Play, Pause, Radio, Plus, Trash2, Image as ImageIcon, Video, Film, Layers,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  CaseSensitive, CaseUpper, CaseLower,
  SkipBack, SkipForward, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Slide, TextBlock, SlideBackground, MediaItem, VideoControlCommand } from '../../types'
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-in">
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-app flex-shrink-0">
        <span className="text-primary font-semibold text-sm">Slide Editor</span>
        <button
          onClick={() => setEditingSlide(null)}
          className="flex items-center gap-1.5 text-muted hover:text-primary text-sm px-3 py-1 rounded bg-surface hover:bg-hover-2 transition-colors"
        >
          <X className="w-4 h-4" /> Close
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
    outputEnabled,
    getCurrentPresentation,
    getCurrentSlide,
    updateSlide,
    updateTextBlock,
    addTextBlock,
    deleteTextBlock
  } = useStore()

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'text' | 'slide'>('text')
  const canvasRef = useRef<HTMLDivElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const interactionRef = useRef<{
    mode: 'move' | 'resize'
    handle?: string
    blockId: string
    startX: number
    startY: number
    start: { x: number; y: number; width: number; height: number }
  } | null>(null)

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

  const handleBlockClick = (blockId: string) => {
    setSelectedBlockId(blockId === selectedBlockId ? null : blockId)
    setActiveTab('text')
  }

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const startInteraction = (
    e: React.MouseEvent,
    block: TextBlock,
    mode: 'move' | 'resize',
    handle?: string
  ) => {
    if (editingBlockId === block.id) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedBlockId(block.id)
    setActiveTab('text')
    interactionRef.current = {
      mode,
      handle,
      blockId: block.id,
      startX: e.clientX,
      startY: e.clientY,
      start: { x: block.x, y: block.y, width: block.width, height: block.height }
    }

    const onMove = (ev: MouseEvent) => {
      const it = interactionRef.current
      const canvas = canvasRef.current
      if (!it || !canvas) return
      const rect = canvas.getBoundingClientRect()
      const dx = ((ev.clientX - it.startX) / rect.width) * 100
      const dy = ((ev.clientY - it.startY) / rect.height) * 100
      const s = it.start
      if (it.mode === 'move') {
        updateTextBlock(currentPresentationId, currentSlideId, it.blockId, {
          x: clamp(s.x + dx, 0, 100 - s.width),
          y: clamp(s.y + dy, 0, 100 - s.height)
        })
      } else {
        let { x, y, width, height } = s
        const h = it.handle || ''
        if (h.includes('e')) width = clamp(s.width + dx, 5, 100 - s.x)
        if (h.includes('s')) height = clamp(s.height + dy, 5, 100 - s.y)
        if (h.includes('w')) {
          width = clamp(s.width - dx, 5, s.x + s.width)
          x = s.x + s.width - width
        }
        if (h.includes('n')) {
          height = clamp(s.height - dy, 5, s.y + s.height)
          y = s.y + s.height - height
        }
        updateTextBlock(currentPresentationId, currentSlideId, it.blockId, { x, y, width, height })
      }
    }
    const onUp = () => {
      interactionRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-surface-2">
      {/* Preview area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex items-center justify-center p-6 bg-surface-2">
          <div ref={canvasRef} className="relative w-full max-w-3xl" style={{ aspectRatio: '16/9' }}>
            {/* Slide rendered at correct scale */}
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
              <SlideRenderer slide={slide} isOutput={false} className="w-full h-full" videoRef={previewVideoRef} />
            </div>

            {/* Interactive overlays for each text block — drag to move, handles to resize, double-click to edit */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{ zIndex: 10 }}
              onMouseDown={() => { setSelectedBlockId(null); setEditingBlockId(null) }}
            >
              {slide.textBlocks.map((block) => {
                const isSelected = block.id === selectedBlockId
                const isEditing = block.id === editingBlockId
                return (
                  <div
                    key={block.id}
                    onMouseDown={(e) => startInteraction(e, block, 'move')}
                    onClick={(e) => { e.stopPropagation(); handleBlockClick(block.id) }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setSelectedBlockId(block.id)
                      setEditingBlockId(block.id)
                      setActiveTab('text')
                    }}
                    title={isEditing ? '' : 'Drag to move · double-click to edit text'}
                    className={`absolute transition-shadow ${isEditing ? 'cursor-text' : 'cursor-move'} ${
                      isSelected ? 'ring-2 ring-orange-500' : 'hover:ring-1 hover:ring-orange-400/60'
                    }`}
                    style={{
                      left: `${block.x}%`,
                      top: `${block.y}%`,
                      width: `${block.width}%`,
                      height: `${block.height}%`
                    }}
                  >
                    {isSelected && !isEditing && (
                      <div className="absolute -top-5 left-0 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-t font-medium whitespace-nowrap pointer-events-none">
                        {block.fontFamily} · {block.fontSize}px
                      </div>
                    )}

                    {/* Resize handles */}
                    {isSelected && !isEditing &&
                      (['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                        <div
                          key={h}
                          onMouseDown={(e) => startInteraction(e, block, 'resize', h)}
                          className="absolute w-2.5 h-2.5 bg-orange-500 border border-white rounded-sm"
                          style={{
                            cursor: h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize',
                            left: h.includes('w') ? -5 : undefined,
                            right: h.includes('e') ? -5 : undefined,
                            top: h.includes('n') ? -5 : undefined,
                            bottom: h.includes('s') ? -5 : undefined
                          }}
                        />
                      ))}

                    {/* Inline text editor */}
                    {isEditing && (
                      <textarea
                        autoFocus
                        value={block.content}
                        onChange={(e) =>
                          updateTextBlock(currentPresentationId, currentSlideId, block.id, {
                            content: e.target.value
                          })
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onBlur={() => setEditingBlockId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingBlockId(null)
                          e.stopPropagation()
                        }}
                        className="absolute inset-0 w-full h-full resize-none bg-black/60 text-white text-center text-sm p-1 outline-none rounded"
                      />
                    )}
                  </div>
                )
              })}
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
            {isLive ? <><Radio className="w-4 h-4" /> LIVE</> : <><Play className="w-4 h-4" fill="currentColor" /> Go Live</>}
          </button>
        </div>

        {/* Background media manager + playback controls */}
        <BackgroundMediaBar
          slide={slide}
          previewVideoRef={previewVideoRef}
          isLive={isLive}
          outputEnabled={outputEnabled}
          onUpdate={(bg) => updateSlide(currentPresentationId, currentSlideId, { background: bg })}
        />
      </div>

      {/* Right panel */}
      <div className="w-72 bg-panel border-l border-app flex flex-col overflow-hidden flex-shrink-0">
        <div className="flex border-b border-app">
          {(['text', 'slide'] as const).map((tab) => (
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
          <button onClick={onAddBlock} className="flex items-center gap-0.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"><Plus className="w-3 h-3" /> Add</button>
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
                className="text-muted hover:text-red-400 flex-shrink-0 transition-colors"
                title="Delete block"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
                title="Bold"
                onClick={() => onUpdateBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`px-3 py-1.5 rounded transition-colors ${block.fontWeight === 'bold' ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}
              ><Bold className="w-3.5 h-3.5" /></button>
              <button
                title="Italic"
                onClick={() => onUpdateBlock(block.id, { fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`px-3 py-1.5 rounded transition-colors ${block.fontStyle === 'italic' ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}
              ><Italic className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Text align */}
          <div>
            <label className="text-[10px] text-muted block mb-1">Align</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button key={align}
                  title={align}
                  onClick={() => onUpdateBlock(block.id, { textAlign: align })}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${block.textAlign === align ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}>
                  {align === 'left' ? <AlignLeft className="w-4 h-4" /> : align === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
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
                  title={t}
                  onClick={() => onUpdateBlock(block.id, { textTransform: t })}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-colors ${block.textTransform === t ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'}`}>
                  {t === 'none' ? <CaseSensitive className="w-4 h-4" /> : t === 'uppercase' ? <CaseUpper className="w-4 h-4" /> : <CaseLower className="w-4 h-4" />}
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

// ── Background Media Bar (collapsible, below the canvas) ─────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function BackgroundMediaBar({
  slide,
  previewVideoRef,
  isLive,
  outputEnabled,
  onUpdate
}: {
  slide: Slide
  previewVideoRef: React.RefObject<HTMLVideoElement>
  isLive: boolean
  outputEnabled: boolean
  onUpdate: (bg: SlideBackground) => void
}) {
  const { media, addMedia, deleteMedia, currentPresentationId, applyBackgroundToAll } = useStore()
  const [expanded, setExpanded] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const vidInputRef = useRef<HTMLInputElement>(null)

  const bg = slide.background
  const isVideo = bg.type === 'video' && !!bg.url
  const videoUrl = bg.type === 'video' ? bg.url : ''
  const currentUrl = bg.type === 'image' || bg.type === 'video' ? bg.url : ''
  const dim = (bg.type === 'image' || bg.type === 'video' ? bg.dim : 0) ?? 0

  // Draft for the video-URL text field (committed on blur).
  const [urlDraft, setUrlDraft] = useState(videoUrl)
  useEffect(() => setUrlDraft(videoUrl), [videoUrl])

  const setDim = (value: number) => {
    if (bg.type === 'image' || bg.type === 'video') onUpdate({ ...bg, dim: value })
  }

  // Mirror the preview <video> element's state into the transport UI.
  useEffect(() => {
    if (!isVideo) {
      setPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }
    const v = previewVideoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onMeta = () => setDuration(v.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    setDuration(v.duration || 0)
    setCurrentTime(v.currentTime)
    setPlaying(!v.paused)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [isVideo, videoUrl, expanded, previewVideoRef])

  // Apply a transport command to the preview, and mirror it to the live output.
  const sendCmd = (cmd: VideoControlCommand) => {
    const v = previewVideoRef.current
    if (v) {
      if (cmd.action === 'play') void v.play()
      else if (cmd.action === 'pause') v.pause()
      else if (cmd.action === 'restart') {
        v.currentTime = 0
        void v.play()
      } else if (cmd.action === 'seek' && cmd.time != null) {
        v.currentTime = cmd.time
      }
    }
    if (outputEnabled && isLive) window.api.controlOutputVideo(cmd)
  }

  const togglePlay = () => sendCmd({ action: playing ? 'pause' : 'play' })
  const seekTo = (t: number) => {
    setCurrentTime(t)
    sendCmd({ action: 'seek', time: t })
  }
  const skip = (delta: number) =>
    seekTo(Math.max(0, Math.min(duration || 0, currentTime + delta)))

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      addMedia({ type, name: file.name, url })
      onUpdate(
        type === 'image'
          ? { type: 'image', url, fit: 'cover', dim: 0 }
          : { type: 'video', url, loop: true, muted: true, dim: 0 }
      )
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const applyMedia = (m: MediaItem) => {
    onUpdate(
      m.type === 'image'
        ? { type: 'image', url: m.url, fit: 'cover', dim: 0 }
        : { type: 'video', url: m.url, loop: true, muted: true, dim: 0 }
    )
  }

  return (
    <div className="border-t border-app bg-panel flex-shrink-0">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-secondary hover:text-primary transition-colors"
      >
        <Film className="w-3.5 h-3.5 text-orange-500" />
        <span className="font-medium">Background Media</span>
        <span className="text-faint">({media.length})</span>
        {isVideo && (
          <span className="ml-1 text-orange-400 font-mono">
            · {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
        <div className="flex-1" />
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-3">
          {/* Background settings */}
          <div className="w-52 flex-shrink-0 space-y-2.5">
            <div>
              <span className="label-xs mb-1.5 block">Loại nền</span>
              <div className="flex gap-1">
                {(['color', 'image', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'color') onUpdate({ type: 'color', value: '#000000' })
                      else if (type === 'image') onUpdate({ type: 'image', url: '', fit: 'cover', dim: 0 })
                      else onUpdate({ type: 'video', url: '', loop: true, muted: true, dim: 0 })
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
                <span className="label-xs mb-1.5 block">Màu</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bg.value}
                    onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
                    className="w-9 h-7 rounded cursor-pointer bg-transparent border border-app-2"
                  />
                  <input
                    type="text"
                    value={bg.value}
                    onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
                    className="flex-1 input-base px-2 py-1 text-xs font-mono"
                  />
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b69', '#0d1117'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ type: 'color', value: c })}
                      className="w-6 h-6 rounded border border-app-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {bg.type === 'image' && bg.url && (
              <div>
                <span className="label-xs mb-1.5 block">Fit</span>
                <div className="flex gap-1">
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <button
                      key={fit}
                      onClick={() => onUpdate({ ...bg, fit })}
                      className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                        bg.fit === fit ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:bg-hover-2'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bg.type === 'video' && (
              <div>
                <span className="label-xs mb-1.5 block">Video URL</span>
                <input
                  type="text"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onBlur={() => onUpdate({ ...bg, url: urlDraft })}
                  placeholder="https://... hoặc /đường-dẫn/video.mp4"
                  className="w-full input-base px-2 py-1.5 text-xs"
                />
              </div>
            )}

            {(bg.type === 'image' || bg.type === 'video') && (
              <div>
                <label className="text-[10px] text-muted flex justify-between mb-1">
                  <span>Dim overlay</span>
                  <span className="text-primary font-mono">{Math.round(dim * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={dim}
                  onChange={(e) => setDim(+e.target.value)}
                  className="w-full accent-orange-500"
                />
              </div>
            )}

            <button
              onClick={() => {
                if (currentPresentationId && confirm('Áp nền này cho TẤT CẢ slide trong presentation?')) {
                  applyBackgroundToAll(currentPresentationId, bg)
                }
              }}
              className="w-full py-1.5 text-xs rounded bg-surface hover:bg-hover-2 text-secondary border border-app transition-colors flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> Áp cho mọi slide
            </button>
          </div>

          {/* Media library */}
          <div className="flex-1 min-w-[200px] border-l border-app pl-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-xs">Thư viện media</span>
              <div className="flex gap-2">
                <button
                  onClick={() => imgInputRef.current?.click()}
                  className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
                >
                  <ImageIcon className="w-3 h-3" /> Ảnh
                </button>
                <button
                  onClick={() => vidInputRef.current?.click()}
                  className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
                >
                  <Video className="w-3 h-3" /> Video
                </button>
              </div>
            </div>
            {media.length === 0 ? (
              <p className="text-[10px] text-faint py-5 text-center border border-dashed border-app-2 rounded">
                Chưa có media — tải ảnh hoặc video lên để tái sử dụng làm nền
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto">
                {media.map((m) => (
                  <div key={m.id} className="relative group aspect-video">
                    {m.type === 'image' ? (
                      <img
                        src={m.url}
                        alt={m.name}
                        title={m.name}
                        onClick={() => applyMedia(m)}
                        className={`w-full h-full object-cover rounded cursor-pointer border transition-all ${
                          currentUrl === m.url
                            ? 'border-orange-500 ring-1 ring-orange-500'
                            : 'border-app-2 hover:border-orange-400'
                        }`}
                      />
                    ) : (
                      <div
                        onClick={() => applyMedia(m)}
                        title={m.name}
                        className={`relative w-full h-full rounded cursor-pointer border overflow-hidden transition-all ${
                          currentUrl === m.url
                            ? 'border-orange-500 ring-1 ring-orange-500'
                            : 'border-app-2 hover:border-orange-400'
                        }`}
                      >
                        <video src={m.url} className="w-full h-full object-cover pointer-events-none" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMedia(m.id)
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white hidden group-hover:flex items-center justify-center"
                      title="Xóa khỏi thư viện"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="w-72 flex-shrink-0 grow border-l border-app pl-4 min-w-[260px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-xs">Playback nền</span>
              <span className="text-[10px] text-faint">
                {!isVideo
                  ? 'Nền không phải video'
                  : isLive && outputEnabled
                    ? 'Đồng bộ output'
                    : 'Chỉ preview'}
              </span>
            </div>
            <div className={isVideo ? '' : 'opacity-40 pointer-events-none'}>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => sendCmd({ action: 'restart' })}
                  title="Về đầu"
                  className="p-1.5 rounded bg-surface hover:bg-hover-2 text-secondary"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => skip(-10)}
                  title="Lùi 10 giây"
                  className="p-1.5 rounded bg-surface hover:bg-hover-2 text-secondary"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2 rounded bg-orange-500 hover:bg-orange-600 text-white"
                  title={playing ? 'Tạm dừng' : 'Phát'}
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
                </button>
                <button
                  onClick={() => skip(10)}
                  title="Tiến 10 giây"
                  className="p-1.5 rounded bg-surface hover:bg-hover-2 text-secondary"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-muted font-mono ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(+e.target.value)}
                className="w-full accent-orange-500"
              />
              {bg.type === 'video' && (
                <div className="flex gap-3 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bg.loop}
                      onChange={(e) => onUpdate({ ...bg, loop: e.target.checked })}
                      className="accent-orange-500"
                    />
                    <span className="text-[10px] text-muted">Loop</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bg.muted}
                      onChange={(e) => onUpdate({ ...bg, muted: e.target.checked })}
                      className="accent-orange-500"
                    />
                    <span className="text-[10px] text-muted">Muted</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleUpload(e, 'image')}
        className="hidden"
      />
      <input
        ref={vidInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleUpload(e, 'video')}
        className="hidden"
      />
    </div>
  )
}
