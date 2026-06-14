import { useRef, useEffect, useState } from 'react'
import { Slide, SlideBackground } from '../../types'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

interface SlideRendererProps {
  slide: Slide | null
  className?: string
  isOutput?: boolean
  backgroundColor?: string
}

function DimOverlay({ dim }: { dim?: number }) {
  if (!dim || dim <= 0) return null
  return <div className="absolute inset-0" style={{ backgroundColor: '#000', opacity: dim }} />
}

function BackgroundLayer({ bg, isOutput }: { bg: SlideBackground; isOutput: boolean }) {
  if (bg.type === 'color') {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.value }} />
  }
  if (bg.type === 'image') {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bg.url})`,
            backgroundSize: bg.fit === 'cover' ? 'cover' : bg.fit === 'contain' ? 'contain' : '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <DimOverlay dim={bg.dim} />
      </>
    )
  }
  if (bg.type === 'video') {
    return (
      <>
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bg.url}
          autoPlay
          loop={bg.loop}
          muted={bg.muted || !isOutput}
          playsInline
        />
        <DimOverlay dim={bg.dim} />
      </>
    )
  }
  return null
}

export function SlideRenderer({
  slide,
  className = '',
  isOutput = false,
  backgroundColor = '#000000'
}: SlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      setScale(entries[0].contentRect.width / DESIGN_WIDTH)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!slide) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{ backgroundColor, aspectRatio: '16/9' }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        <BackgroundLayer bg={slide.background} isOutput={isOutput} />

        {slide.textBlocks.map((block) => {
          const shadowStyle = block.textShadow
            ? `${block.shadowColor} 0px ${block.shadowBlur / 2}px ${block.shadowBlur}px`
            : 'none'
          const outlineStyle = block.outline
            ? `-${block.outlineWidth}px -${block.outlineWidth}px 0 ${block.outlineColor}, ${block.outlineWidth}px -${block.outlineWidth}px 0 ${block.outlineColor}, -${block.outlineWidth}px ${block.outlineWidth}px 0 ${block.outlineColor}, ${block.outlineWidth}px ${block.outlineWidth}px 0 ${block.outlineColor}`
            : 'none'

          return (
            <div
              key={block.id}
              className="absolute flex items-center"
              style={{
                left: `${block.x / 100 * DESIGN_WIDTH}px`,
                top: `${block.y / 100 * DESIGN_HEIGHT}px`,
                width: `${block.width / 100 * DESIGN_WIDTH}px`,
                height: `${block.height / 100 * DESIGN_HEIGHT}px`,
                justifyContent:
                  block.textAlign === 'left' ? 'flex-start'
                  : block.textAlign === 'right' ? 'flex-end'
                  : 'center'
              }}
            >
              <div
                style={{
                  fontSize: `${block.fontSize}px`,
                  fontFamily: block.fontFamily,
                  fontWeight: block.fontWeight,
                  fontStyle: block.fontStyle,
                  color: block.color,
                  textAlign: block.textAlign,
                  textShadow: outlineStyle !== 'none' ? outlineStyle : shadowStyle,
                  lineHeight: block.lineHeight,
                  textTransform: block.textTransform,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  width: '100%'
                }}
              >
                {block.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
