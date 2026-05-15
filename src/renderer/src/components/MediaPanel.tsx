import React, { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { MediaFile } from '../types'

export function MediaPanel() {
  const {
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    currentPresentationId,
    currentSlideId,
    updateSlide
  } = useStore()

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(true)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const url = URL.createObjectURL(file)
      addMediaFile({ name: file.name, type, url, size: file.size })
    })
    e.target.value = ''
  }

  const applyAsBackground = (file: MediaFile) => {
    if (!currentPresentationId || !currentSlideId) return
    if (file.type === 'image') {
      updateSlide(currentPresentationId, currentSlideId, {
        background: { type: 'image', url: file.url, fit: 'cover' }
      })
    } else {
      updateSlide(currentPresentationId, currentSlideId, {
        background: { type: 'video', url: file.url, loop: true, muted: true }
      })
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex-shrink-0 border-t border-app bg-panel" style={{ height: expanded ? 160 : 36 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-medium text-muted hover:text-primary transition-colors"
        >
          <span className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <span>Media Library</span>
          {mediaFiles.length > 0 && (
            <span className="text-faint">({mediaFiles.length})</span>
          )}
        </button>

        {expanded && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-muted hover:text-primary transition-colors"
            >
              🖼 Image
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-muted hover:text-primary transition-colors"
            >
              🎬 Video
            </button>
          </div>
        )}
      </div>

      {/* Media grid */}
      {expanded && (
        <div className="overflow-x-auto overflow-y-hidden h-[calc(100%-36px)]">
          {mediaFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full gap-4">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-6 py-3 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-lg hover:border-orange-400 hover:text-orange-500 text-muted transition-colors group"
              >
                <span className="text-2xl group-hover:text-orange-500">🖼</span>
                <span className="text-xs">Import Images</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-6 py-3 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-lg hover:border-orange-400 hover:text-orange-500 text-muted transition-colors group"
              >
                <span className="text-2xl group-hover:text-orange-500">🎬</span>
                <span className="text-xs">Import Videos</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 p-2 h-full items-center">
              {mediaFiles.map((file) => (
                <MediaItem
                  key={file.id}
                  file={file}
                  canApply={!!currentSlideId}
                  onApply={() => applyAsBackground(file)}
                  onDelete={() => removeMediaFile(file.id)}
                  formatSize={formatSize}
                />
              ))}

              {/* Add more button */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex-shrink-0 w-16 h-full border-2 border-dashed border-gray-200 dark:border-[#333] rounded-lg hover:border-orange-400 flex flex-col items-center justify-center gap-1 transition-colors group"
                title="Add media"
              >
                <span className="text-muted group-hover:text-orange-500 text-xl transition-colors">+</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'video')}
      />
    </div>
  )
}

function MediaItem({
  file,
  canApply,
  onApply,
  onDelete,
  formatSize
}: {
  file: MediaFile
  canApply: boolean
  onApply: () => void
  onDelete: () => void
  formatSize: (bytes?: number) => string
}) {
  return (
    <div className="flex-shrink-0 w-20 h-full relative group rounded-lg overflow-hidden border border-app cursor-pointer hover:border-orange-400 transition-colors"
      onClick={canApply ? onApply : undefined}
      title={canApply ? `Apply "${file.name}" as slide background` : 'Select a slide first'}
    >
      {file.type === 'image' ? (
        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
          <span className="text-2xl">🎬</span>
          <span className="text-[8px] text-gray-400 mt-0.5 px-1 text-center truncate w-full">{file.name}</span>
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        {canApply && (
          <span className="text-white text-[9px] font-medium bg-orange-500 px-1.5 py-0.5 rounded">
            Use
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-white text-[9px] bg-red-500/80 hover:bg-red-500 px-1.5 py-0.5 rounded transition-colors"
        >
          Delete
        </button>
      </div>

      {/* File info tooltip */}
      {file.size && (
        <div className="absolute bottom-0.5 right-0.5 text-[7px] text-white/60 bg-black/40 px-0.5 rounded">
          {formatSize(file.size)}
        </div>
      )}
    </div>
  )
}
