import { Plus, Trash } from '@phosphor-icons/react'
import { useStore } from '../../store'
import type { Slide } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { IconButton } from '../ui/IconButton'
import { BoxFields, TextStyleFields } from './TextStyleFields'

interface TextInspectorProps {
  presId: string
  slide: Slide
  themed: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TextInspector({ presId, slide, themed, selectedId, onSelect }: TextInspectorProps) {
  const { updateTextBlock, addTextBlock, deleteTextBlock, updateSlide } = useStore.getState()
  const block = slide.textBlocks.find((b) => b.id === selectedId)
  const isMain = block?.id === slide.textBlocks[0]?.id
  const update = (u: Parameters<typeof updateTextBlock>[3]) => block && updateTextBlock(presId, slide.id, block.id, u)

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label mb-0">Khung chữ</span>
          <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={() => onSelect(addTextBlock(presId, slide.id))}>
            Thêm
          </Button>
        </div>
        <ul className="space-y-1">
          {slide.textBlocks.map((b, i) => (
            <li key={b.id} className={`flex items-center gap-1 rounded-md pl-2 ${b.id === selectedId ? 'bg-select/15' : 'hover:bg-raised'}`}>
              <button type="button" onClick={() => onSelect(b.id)} className="min-w-0 flex-1 truncate py-1.5 text-left text-xs text-fg-2 cursor-pointer">
                {i + 1}. {b.content.split('\n')[0] || '(trống)'}
              </button>
              <IconButton size="sm" tone="danger" label="Xóa khung chữ" icon={<Trash size={12} />} onClick={() => deleteTextBlock(presId, slide.id, b.id)} />
            </li>
          ))}
        </ul>
      </div>

      {block && (
        <>
          <Field label="Nội dung">
            {(id) => (
              <textarea id={id} rows={5} value={block.content} onChange={(e) => update({ content: e.target.value })} className="input resize-y leading-relaxed" />
            )}
          </Field>
          {isMain && (
            <Field label="Lời dịch (song ngữ)" hint="Hiện nhỏ hơn, bên dưới lời chính.">
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={slide.translation ?? ''}
                  onChange={(e) => updateSlide(presId, slide.id, { translation: e.target.value || undefined })}
                  className="input resize-y"
                />
              )}
            </Field>
          )}
          {themed && isMain ? (
            <p className="rounded-md bg-surface p-3 text-xs text-muted">Kiểu chữ và vị trí khung này do theme quyết định.</p>
          ) : (
            <>
              <TextStyleFields style={block} onChange={update} />
              <BoxFields box={block} onChange={update} />
            </>
          )}
        </>
      )}
    </div>
  )
}
