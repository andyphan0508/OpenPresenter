import { ArrowsClockwise, Play, Plus, Scan, SpinnerGap, Swap, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { ocrImage } from '../../api/ocr'
import { downscaleImage, splitSlides } from '../../helpers/image'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

// Photo of a hymn sheet / bulletin → AI reads the text → edit → slides.
export function OcrBin() {
  const images = useStore((s) => s.ocrImages)
  const selectedId = useStore((s) => s.selectedOcrId)
  const apiKey = useStore((s) => s.settings.anthropicApiKey)
  const currentPresentationId = useStore((s) => s.currentPresentationId)
  const currentSlideId = useStore((s) => s.currentSlideId)
  const themeId = useStore((s) => s.settings.songThemeId)
  const { addOcrImage, updateOcrImage, removeOcrImage, selectOcrImage, updateSettings, addSlideGroup, goLive } = useStore.getState()

  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const image = images.find((i) => i.id === selectedId)
  const slides = image ? splitSlides(image.text) : []

  const read = async (id: string, src: string) => {
    updateOcrImage(id, { status: 'loading', error: undefined })
    try {
      updateOcrImage(id, { status: 'done', text: await ocrImage(apiKey, src) })
    } catch (e) {
      updateOcrImage(id, { status: 'error', error: (e as Error).message })
    }
  }

  const addFiles = async (files: Iterable<File>) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const src = await downscaleImage(file)
      read(addOcrImage(file.name.replace(/\.[^.]+$/, '') || 'Ảnh dán', src), src)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }
  const onPaste = (e: ClipboardEvent) => {
    const files = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/'))
    if (files.length) {
      e.preventDefault()
      addFiles(files)
    }
  }

  const add = (live: boolean) => {
    if (!currentPresentationId || !image || !slides.length) return
    const first = addSlideGroup(currentPresentationId, image.name, 'text', slides.map((content) => ({ content })), themeId)
    if (live && first) goLive(first)
  }

  const replaceCurrent = () => {
    const { getCurrentSlide, updateTextBlock } = useStore.getState()
    const slide = getCurrentSlide()
    const block = slide?.textBlocks[0]
    if (!currentPresentationId || !slide || !block || !image) return
    updateTextBlock(currentPresentationId, slide.id, block.id, { content: image.text.trim() })
  }

  return (
    <div
      className={`flex h-full ${dragging ? 'ring-2 ring-inset ring-select' : ''}`}
      onPaste={onPaste}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="flex w-60 flex-shrink-0 flex-col gap-2 border-r border-line p-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files ?? [])
            e.target.value = ''
          }}
        />
        <Button size="sm" icon={<UploadSimple size={13} />} onClick={() => fileInput.current?.click()}>
          Tải ảnh lên
        </Button>
        <p className="text-2xs text-muted">Hoặc kéo thả / dán (⌘V) ảnh vào đây.</p>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Ảnh đã tải">
          {images.map((img) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => selectOcrImage(img.id)}
                className={`flex w-full items-center gap-2 rounded-md p-1.5 text-left cursor-pointer ${
                  img.id === selectedId ? 'bg-select/15 text-fg' : 'text-fg-2 hover:bg-raised'
                }`}
              >
                <img src={img.src} alt="" className="h-9 w-12 flex-shrink-0 rounded object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{img.name}</span>
                  <span className={`block text-2xs ${img.status === 'error' ? 'text-danger' : 'text-muted'}`}>
                    {img.status === 'loading' ? 'Đang đọc…' : img.status === 'error' ? 'Lỗi' : img.status === 'done' ? 'Đã đọc' : 'Chưa đọc'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <label className="space-y-1 text-2xs text-muted">
          <span>Claude API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => updateSettings({ anthropicApiKey: e.target.value.trim() })}
            placeholder="sk-ant-… (để trống: dùng ANTHROPIC_API_KEY)"
            className="input"
            autoComplete="off"
          />
        </label>
      </div>

      {image ? (
        <div className="flex min-w-0 flex-1 gap-3 p-3">
          <img src={image.src} alt={image.name} className="h-full w-1/3 flex-shrink-0 rounded-md bg-black/20 object-contain" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <input
                value={image.name}
                onChange={(e) => updateOcrImage(image.id, { name: e.target.value })}
                aria-label="Tên nhóm slide"
                className="input flex-1"
              />
              <Button
                size="sm"
                icon={image.status === 'loading' ? <SpinnerGap size={13} className="animate-spin" /> : image.text ? <ArrowsClockwise size={13} /> : <Scan size={13} />}
                disabled={image.status === 'loading'}
                onClick={() => read(image.id, image.src)}
              >
                {image.text ? 'Đọc lại' : 'Đọc chữ'}
              </Button>
              <IconButton size="sm" label="Xoá ảnh" icon={<Trash size={14} />} onClick={() => removeOcrImage(image.id)} />
            </div>
            {image.error && <p role="alert" className="text-xs text-danger">{image.error}</p>}
            <textarea
              value={image.text}
              onChange={(e) => updateOcrImage(image.id, { text: e.target.value })}
              disabled={image.status === 'loading'}
              placeholder={image.status === 'loading' ? 'AI đang đọc ảnh…' : 'Chữ đọc được sẽ hiện ở đây. Dòng trống = sang slide mới.'}
              aria-label="Chữ đọc từ ảnh"
              className="input min-h-0 flex-1 resize-none py-2 font-sans text-[13px] leading-relaxed"
            />
            <div className="flex items-center gap-1.5">
              <span className="mr-auto text-2xs text-muted">
                {currentPresentationId ? `${slides.length} slide · dòng trống = slide mới` : 'Mở một buổi nhóm để thêm slide.'}
              </span>
              <Button size="sm" variant="ghost" icon={<Swap size={13} />} disabled={!currentSlideId || !image.text.trim()} onClick={replaceCurrent}>
                Thay chữ slide đang chọn
              </Button>
              <Button size="sm" icon={<Plus size={13} />} disabled={!currentPresentationId || !slides.length} onClick={() => add(false)}>
                Thêm
              </Button>
              <Button size="sm" variant="live" icon={<Play size={13} weight="fill" />} disabled={!currentPresentationId || !slides.length} onClick={() => add(true)}>
                Thêm & chiếu
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-xs text-muted">Chưa có ảnh. Tải lên, kéo thả hoặc dán ảnh để bắt đầu.</div>
      )}
    </div>
  )
}
