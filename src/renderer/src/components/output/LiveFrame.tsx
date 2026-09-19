import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../../constants/defaults'
import { resolveSlide } from '../../helpers/theme'
import { useElementSize } from '../../hooks/useElementSize'
import type { OutputPayload, SlideBackground } from '../../types'
import { BackgroundLayer } from '../slides/BackgroundLayer'
import { SlideView } from '../slides/SlideView'
import { TransitionStack } from './TransitionStack'

const TEXT_ONLY = { text: true, media: false }
const NO_LAYERS = { text: false, media: false }

interface LiveFrameProps {
  payload: OutputPayload
  message: string | null
  keyBackground?: string // Blackmagic key feed: no backgrounds, this color behind the lyrics
  master?: boolean // control-window preview: plays the audio and owns the media clock
  onVideo?: (video: HTMLVideoElement | null) => void
}

const bgId = (bg: SlideBackground | null) => (!bg ? 'none' : bg.type === 'color' ? `c:${bg.value}` : bg.url)

// Letterboxed 16:9 audience frame: background and text transition separately, props/message on top.
export function LiveFrame({ payload, message, keyBackground, master = false, onVideo }: LiveFrameProps) {
  const [ref, size] = useElementSize<HTMLDivElement>()
  const scale = Math.min(size.width / DESIGN_WIDTH, size.height / DESIGN_HEIGHT) || 0
  const box = { width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale }

  const { slide, themes, layers, settings } = payload
  const background = layers.media && !keyBackground ? (payload.media ?? (slide ? resolveSlide(slide, themes).background : null)) : null
  const transition = slide?.transition ?? 'fade'
  const textSlide = layers.text ? slide : null

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" style={{ backgroundColor: keyBackground ?? '#000' }}>
      <div
        className="absolute overflow-hidden"
        style={{ ...box, left: (size.width - box.width) / 2, top: (size.height - box.height) / 2, backgroundColor: keyBackground ?? settings.backgroundColor }}
      >
        {!keyBackground && (
          <TransitionStack
            id={bgId(background)}
            value={background}
            transition={transition}
            hold
            render={(bg, isTop) =>
              bg ? (
                <BackgroundLayer bg={bg} play audio={master} clock={master ? undefined : payload.clock} onVideo={isTop ? onVideo : undefined} />
              ) : (
                <div className="absolute inset-0" style={{ backgroundColor: settings.backgroundColor }} />
              )
            }
          />
        )}
        <TransitionStack
          id={textSlide?.id ?? 'none'}
          value={textSlide}
          transition={transition}
          render={(s) => s && <SlideView slide={s} themes={themes} layers={TEXT_ONLY} backgroundColor="transparent" />}
        />
        <div className="absolute inset-0">
          <SlideView slide={null} themes={themes} layers={NO_LAYERS} props={payload.props} message={message} backgroundColor="transparent" />
        </div>
      </div>
    </div>
  )
}
