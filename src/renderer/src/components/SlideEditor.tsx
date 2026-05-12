import React, { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Slide, TextBlock, SlideBackground } from '../types'
import { SlideRenderer } from './SlideRenderer'

interface SlideEditorProps {
  onGoLive: (slideId: string) => void
}

export function SlideEditor({ onGoLive }: SlideEditorProps) {
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
      <div className="flex-1 flex items-center justify-center bg-[#181818]">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">🖼</div>
          <p className="text-[#555] text-sm">Select a slide to edit</p>
        </div>
      </div>
    )
  }

  const selectedBlock = slide.textBlocks.find((b) => b.id === selectedBlockId)
  const isLive = slide.id === liveSlideId

  const updateBg = (updates: Partial<SlideBackground>) => {
    updateSlide(currentPresentationId, currentSlideId, {
      background: { ...slide.background, ...updates } as SlideBackground
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateSlide(currentPresentationId, currentSlideId, {
      background: { type: 'image', url, fit: 'cover' }
    })
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#181818]">
      {/* Center: Canvas preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[#181818]">
          <div className="relative w-full max-w-3xl" style={{ aspectRatio: '16/9' }}>
            {/* Slide preview at actual edit scale */}
            <div className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl">
              <SlideRenderer
                slide={slide}
                isOutput={false}
                className="w-full h-full"
              />
            </div>

            {/* Overlay for interaction (future: drag blocks) */}
            <div className="absolute inset-0 rounded-lg" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-10 bg-[#1e1e1e] border-t border-[#2a2a2a] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-[#555] text-xs">
              {slide.textBlocks.length} text block{slide.textBlocks.length !== 1 ? 's' : ''}
            </span>
            {slide.notes && (
              <span className="text-yellow-500/70 text-xs">✦ {slide.notes}</span>
            )}
          </div>
          <button
            onClick={() => onGoLive(slide.id)}
            className={`flex items-center gap-2 px-4 py-1 rounded font-medium text-sm transition-all ${
              isLive
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isLive ? '● LIVE' : '▶ Go Live'}
          </button>
        </div>
      </div>

      {/* Right panel: Edit controls */}
      <div className="w-72 bg-[#1e1e1e] border-l border-[#2a2a2a] flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[#2a2a2a]">
          {(['background', 'text', 'slide'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-orange-400 border-b-2 border-orange-500 bg-[#252525]'
                  : 'text-[#666] hover:text-white'
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
              onUpdateBlock={(id, updates) =>
                updateTextBlock(currentPresentationId, currentSlideId, id, updates)
              }
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}

// Background Panel
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

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
          Background Type
        </label>
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
                  : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {slide.background.type === 'color' && (
        <div>
          <label className="text-xs text-[#888] block mb-2">Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={slide.background.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-[#444]"
            />
            <input
              type="text"
              value={slide.background.value}
              onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-white text-xs font-mono"
            />
          </div>
          {/* Quick colors */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b69', '#0d1117'].map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ type: 'color', value: c })}
                className="w-6 h-6 rounded border border-[#444] transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {slide.background.type === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#888] block mb-2">Image</label>
            {slide.background.url ? (
              <div className="relative">
                <img
                  src={slide.background.url}
                  alt="bg"
                  className="w-full h-24 object-cover rounded border border-[#444]"
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
                className="w-full h-24 border-2 border-dashed border-[#444] rounded flex flex-col items-center justify-center gap-1 hover:border-orange-500/50 transition-colors group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🖼</span>
                <span className="text-xs text-[#666]">Click to upload image</span>
              </button>
            )}
          </div>
          {slide.background.url && (
            <div>
              <label className="text-xs text-[#888] block mb-2">Fit</label>
              <div className="flex gap-1">
                {(['cover', 'contain', 'fill'] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() =>
                      onUpdate({ type: 'image', url: (slide.background as any).url, fit })
                    }
                    className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                      (slide.background as any).fit === fit
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
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
            <label className="text-xs text-[#888] block mb-2">Video URL or file path</label>
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
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-xs"
            />
          </div>
          <div className="flex gap-3">
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
              <span className="text-xs text-[#888]">Loop</span>
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
              <span className="text-xs text-[#888]">Muted</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// Text Panel
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

  return (
    <div className="p-4 space-y-4">
      {/* Block list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider">
            Text Blocks
          </label>
          <button
            onClick={onAddBlock}
            className="text-xs text-orange-400 hover:text-orange-300"
          >
            + Add
          </button>
        </div>
        <div className="space-y-1">
          {slide.textBlocks.map((block, idx) => (
            <div
              key={block.id}
              onClick={() => onSelectBlock(block.id === selectedBlockId ? null : block.id)}
              className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                block.id === selectedBlockId
                  ? 'bg-orange-500/20 border border-orange-500/30'
                  : 'bg-[#2a2a2a] hover:bg-[#333]'
              }`}
            >
              <span className="text-xs text-[#aaa] truncate flex-1">
                {idx + 1}. {block.content.slice(0, 30) || '(empty)'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id) }}
                className="text-[#555] hover:text-red-400 ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Block editor */}
      {selectedBlock && (
        <div className="space-y-3 border-t border-[#2a2a2a] pt-3">
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block">
            Edit Text Block
          </label>

          {/* Content */}
          <div>
            <label className="text-xs text-[#666] block mb-1">Content</label>
            <textarea
              value={selectedBlock.content}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })}
              rows={4}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-xs resize-y focus:border-orange-500 outline-none font-mono"
            />
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs text-[#666] flex justify-between mb-1">
              <span>Font Size</span>
              <span className="text-white">{selectedBlock.fontSize}px</span>
            </label>
            <input
              type="range"
              min={12}
              max={200}
              value={selectedBlock.fontSize}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { fontSize: +e.target.value })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-[#666] block mb-1">Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selectedBlock.color}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { color: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent border border-[#444]"
              />
              <input
                type="text"
                value={selectedBlock.color}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { color: e.target.value })}
                className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Text align */}
          <div>
            <label className="text-xs text-[#666] block mb-1">Align</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdateBlock(selectedBlock.id, { textAlign: align })}
                  className={`flex-1 py-1 text-sm rounded transition-colors ${
                    selectedBlock.textAlign === align
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
                  }`}
                >
                  {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                </button>
              ))}
            </div>
          </div>

          {/* Font style */}
          <div>
            <label className="text-xs text-[#666] block mb-1">Style</label>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  onUpdateBlock(selectedBlock.id, {
                    fontWeight: selectedBlock.fontWeight === 'bold' ? 'normal' : 'bold'
                  })
                }
                className={`px-3 py-1 text-xs rounded font-bold transition-colors ${
                  selectedBlock.fontWeight === 'bold'
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#2a2a2a] text-[#888]'
                }`}
              >
                B
              </button>
              <button
                onClick={() =>
                  onUpdateBlock(selectedBlock.id, {
                    fontStyle: selectedBlock.fontStyle === 'italic' ? 'normal' : 'italic'
                  })
                }
                className={`px-3 py-1 text-xs rounded italic transition-colors ${
                  selectedBlock.fontStyle === 'italic'
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#2a2a2a] text-[#888]'
                }`}
              >
                I
              </button>
            </div>
          </div>

          {/* Text shadow */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBlock.textShadow}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { textShadow: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-xs text-[#888]">Text Shadow</span>
          </label>

          {/* Position & size */}
          <div className="grid grid-cols-2 gap-2">
            {(['x', 'y', 'width', 'height'] as const).map((prop) => (
              <div key={prop}>
                <label className="text-xs text-[#666] block mb-1 uppercase">{prop} %</label>
                <input
                  type="number"
                  value={selectedBlock[prop]}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { [prop]: +e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-white text-xs"
                />
              </div>
            ))}
          </div>

          {/* Line height */}
          <div>
            <label className="text-xs text-[#666] flex justify-between mb-1">
              <span>Line Height</span>
              <span className="text-white">{selectedBlock.lineHeight}</span>
            </label>
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.05}
              value={selectedBlock.lineHeight}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { lineHeight: +e.target.value })}
              className="w-full accent-orange-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Slide Settings Panel
function SlideSettingsPanel({
  slide,
  onUpdate
}: {
  slide: Slide
  onUpdate: (updates: Partial<Slide>) => void
}) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
          Transition
        </label>
        <div className="flex gap-1">
          {(['none', 'fade', 'slide'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ transition: t })}
              className={`flex-1 py-1.5 text-xs rounded capitalize transition-colors ${
                slide.transition === t
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
          Slide Notes
        </label>
        <textarea
          value={slide.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={5}
          placeholder="Add notes for this slide..."
          className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-xs resize-y focus:border-orange-500 outline-none"
        />
      </div>
    </div>
  )
}
