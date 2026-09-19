import type { ReactNode } from 'react'
import { ALL_LAYERS_ON, DESIGN_HEIGHT, DESIGN_WIDTH } from '../../constants/defaults'
import { resolveSlide, translationStyle } from '../../helpers/theme'
import { useElementSize } from '../../hooks/useElementSize'
import type { OutputLayers, Prop, Slide, SlideBackground, Theme } from '../../types'
import { BackgroundLayer } from './BackgroundLayer'
import { MessageBar, PropsLayer } from './OverlayLayer'
import { TextBlockView } from './TextBlockView'

interface SlideViewProps {
  slide: Slide | null
  themes: Theme[]
  media?: SlideBackground | null // media layer (from the media bin), drawn instead of the slide background
  layers?: OutputLayers
  props?: Prop[]
  message?: string | null
  backgroundColor?: string
  play?: boolean // autoplay videos (output) vs. static first frame (thumbnails)
  fill?: boolean // letterbox inside the parent instead of a 16:9 box
  className?: string
  children?: ReactNode // extra overlay in design-canvas coordinates
}

// The single renderer for slides: output window, preview, grid tiles and editor all use it.
export function SlideView({
  slide,
  themes,
  media = null,
  layers = ALL_LAYERS_ON,
  props = [],
  message = null,
  backgroundColor = '#000000',
  play = false,
  fill = false,
  className = '',
  children
}: SlideViewProps) {
  const [ref, size] = useElementSize<HTMLDivElement>()
  const scale = fill
    ? Math.min(size.width / DESIGN_WIDTH, size.height / DESIGN_HEIGHT)
    : size.width / DESIGN_WIDTH
  const resolved = slide ? resolveSlide(slide, themes) : null
  const background = layers.media ? (media ?? resolved?.background ?? null) : null
  const trStyle = slide ? translationStyle(slide, themes) : undefined

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${fill ? 'h-full w-full' : 'aspect-video w-full'} ${className}`}
      style={{ backgroundColor: fill && backgroundColor !== 'transparent' ? '#000' : backgroundColor }}
    >
      <div
        className="absolute"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          left: fill ? (size.width - DESIGN_WIDTH * scale) / 2 : 0,
          top: fill ? (size.height - DESIGN_HEIGHT * scale) / 2 : 0,
          transform: `scale(${scale || 0.0001})`,
          transformOrigin: 'top left',
          backgroundColor
        }}
      >
        {background && <BackgroundLayer bg={background} play={play} />}
        {layers.text &&
          resolved?.textBlocks.map((block, i) => (
            <TextBlockView
              key={block.id}
              block={block}
              translation={i === 0 ? resolved.translation : undefined}
              translationStyle={trStyle}
            />
          ))}
        <PropsLayer props={props} />
        {message && <MessageBar text={message} />}
        {children}
      </div>
    </div>
  )
}
