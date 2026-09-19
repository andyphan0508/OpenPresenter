import { LinkBreak, Play, Presentation } from '@phosphor-icons/react'
import { useState } from 'react'
import { resolveSlide } from '../../helpers/theme'
import { useCurrentSlide } from '../../hooks/useSelectors'
import { useStore } from '../../store'
import { SlideView } from '../slides/SlideView'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Tabs } from '../ui/Tabs'
import { BackgroundInspector } from './BackgroundInspector'
import { SlideInspector } from './SlideInspector'
import { TextInspector } from './TextInspector'

type InspectorTab = 'text' | 'background' | 'slide'

// Edit mode for one slide: canvas with selectable text boxes + inspector.
export function SlideEditor() {
  const slide = useCurrentSlide()
  const presId = useStore((s) => s.currentPresentationId)
  const themes = useStore((s) => s.themes)
  const isLive = useStore((s) => !!slide && s.liveSlideId === slide.id)
  const { goLive, detachSlideTheme } = useStore.getState()
  const [tab, setTab] = useState<InspectorTab>('text')
  const [blockId, setBlockId] = useState<string | null>(null)

  if (!slide || !presId) {
    return <EmptyState icon={<Presentation size={36} />} title="Chọn một slide để soạn" hint="Bấm đúp vào slide trong chế độ Trình chiếu." />
  }

  const theme = themes.find((t) => t.id === slide.themeId)
  const resolved = resolveSlide(slide, themes)
  const selectedId = blockId && slide.textBlocks.some((b) => b.id === blockId) ? blockId : (slide.textBlocks[0]?.id ?? null)

  return (
    <div className="flex h-full bg-app">
      <div className="flex min-w-0 flex-1 flex-col">
        {theme && (
          <div className="flex items-center justify-between gap-3 border-b border-line bg-select/10 px-4 py-2 text-xs text-fg-2">
            <span>
              Slide dùng theme <strong className="text-fg">{theme.name}</strong> — nội dung sửa ở đây; kiểu chữ & nền lấy từ theme (ngăn Themes).
            </span>
            <Button size="sm" icon={<LinkBreak size={13} />} onClick={() => detachSlideTheme(presId, slide.id)}>
              Tách khỏi theme
            </Button>
          </div>
        )}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-lg shadow-2xl ring-1 ring-line-strong">
            <SlideView slide={slide} themes={themes} play />
            {/* Click targets over each text box */}
            {resolved.textBlocks.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Chọn khung chữ: ${b.content.slice(0, 30) || 'trống'}`}
                onClick={() => {
                  setBlockId(b.id)
                  setTab('text')
                }}
                className={`absolute cursor-pointer ${b.id === selectedId ? 'ring-2 ring-select' : 'hover:ring-1 hover:ring-select/60'}`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
              />
            ))}
          </div>
        </div>
        <footer className="flex h-10 items-center justify-between border-t border-line bg-panel px-4 text-xs text-muted">
          <span>
            {slide.group?.title ?? 'Slide'} {slide.label ? `· ${slide.label}` : ''}
          </span>
          <Button size="sm" variant={isLive ? 'live' : 'secondary'} icon={<Play size={13} weight="fill" />} onClick={() => goLive(slide.id)}>
            {isLive ? 'Đang chiếu' : 'Chiếu slide này'}
          </Button>
        </footer>
      </div>

      <aside className="flex w-80 flex-shrink-0 flex-col border-l border-line bg-panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'text', label: 'Chữ' },
            { id: 'background', label: 'Nền' },
            { id: 'slide', label: 'Slide' }
          ]}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'text' && <TextInspector presId={presId} slide={slide} themed={!!theme} selectedId={selectedId} onSelect={setBlockId} />}
          {tab === 'background' && <BackgroundInspector presId={presId} slide={slide} themed={!!theme} />}
          {tab === 'slide' && <SlideInspector presId={presId} slide={slide} />}
        </div>
      </aside>
    </div>
  )
}
