import React, { useRef, useEffect } from 'react'
import { Slide, SlideBackground } from '../types'

interface SlideRendererProps {
  slide: Slide | null
  width?: number
  height?: number
  className?: string
  isOutput?: boolean
  backgroundColor?: string
}

function BackgroundLayer({ bg, isOutput }: { bg: SlideBackground; isOutput: boolean }) {
  if (bg.type === 'color') {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.value }} />
  }

  if (bg.type === 'image') {
    return (
      <div
        className="absolute inset-0 bg-center"
        style={{
          backgroundImage: `url(${bg.url})`,
          backgroundSize: bg.fit === 'cover' ? 'cover' : bg.fit === 'contain' ? 'contain' : '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    )
  }

  if (bg.type === 'video') {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={bg.url}
        autoPlay
        loop={bg.loop}
        muted={bg.muted || !isOutput}
        playsInline
      />
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
      <BackgroundLayer bg={slide.background} isOutput={isOutput} />

      {/* Text blocks */}
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
              left: `${block.x}%`,
              top: `${block.y}%`,
              width: `${block.width}%`,
              height: `${block.height}%`,
              justifyContent:
                block.textAlign === 'left'
                  ? 'flex-start'
                  : block.textAlign === 'right'
                    ? 'flex-end'
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
  )
}

// Scaled version that auto-fits to container
export function SlidePreview({
  slide,
  className = '',
  onClick,
  isLive = false,
  backgroundColor
}: SlideRendererProps & { onClick?: () => void; isLive?: boolean }) {
  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onClick={onClick}
      style={{ aspectRatio: '16/9' }}
    >
      {/* We render at a fixed internal resolution and scale down */}
      <div className="absolute inset-0 overflow-hidden rounded-sm">
        <div
          style={{
            width: '1920px',
            height: '1080px',
            transform: 'scale(var(--slide-scale, 0.1))',
            transformOrigin: 'top left'
          }}
          className="slide-inner"
        >
          <SlideRenderer
            slide={slide}
            isOutput={false}
            backgroundColor={backgroundColor}
            className="w-full h-full"
          />
        </div>
      </div>

      {isLive && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded font-bold z-10">
          LIVE
        </div>
      )}
    </div>
  )
}
