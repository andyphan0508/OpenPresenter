import React, { useEffect, useState, useRef } from 'react'
import { Slide, OutputSettings, DEFAULT_OUTPUT_SETTINGS } from './types'

interface DisplaySlideData {
  slide: Slide | null
  settings: OutputSettings
}

function Clock({ position }: { position: OutputSettings['clockPosition'] }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const posClass =
    position === 'top-left'
      ? 'top-4 left-4'
      : position === 'top-right'
        ? 'top-4 right-4'
        : position === 'bottom-left'
          ? 'bottom-4 left-4'
          : 'bottom-4 right-4'

  return (
    <div className={`absolute ${posClass} text-white text-lg font-mono opacity-70 z-10`}
      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
      {time.toLocaleTimeString()}
    </div>
  )
}

export function OutputWindow() {
  const [slideData, setSlideData] = useState<DisplaySlideData | null>(null)
  const [settings, setSettings] = useState<OutputSettings>(DEFAULT_OUTPUT_SETTINGS)
  const [transitioning, setTransitioning] = useState(false)
  const prevSlideRef = useRef<Slide | null>(null)

  useEffect(() => {
    const cleanup = window.api.onDisplaySlide((data: unknown) => {
      const payload = data as DisplaySlideData | null

      if (payload?.slide?.transition === 'fade' || payload?.slide?.transition === 'slide') {
        setTransitioning(true)
        setTimeout(() => {
          setSlideData(payload)
          setTransitioning(false)
        }, 200)
      } else {
        setSlideData(payload)
      }
    })

    const cleanupSettings = window.api.onOutputSettingsChanged((s: unknown) => {
      setSettings(s as OutputSettings)
    })

    return () => {
      cleanup()
      cleanupSettings()
    }
  }, [])

  const slide = slideData?.slide
  const bg = slide?.background

  const bgStyle: React.CSSProperties = bg
    ? bg.type === 'color'
      ? { backgroundColor: bg.value }
      : bg.type === 'image'
        ? {
            backgroundImage: `url(${bg.url})`,
            backgroundSize: bg.fit === 'cover' ? 'cover' : bg.fit === 'contain' ? 'contain' : '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
        : { backgroundColor: '#000' }
    : { backgroundColor: settings.backgroundColor }

  return (
    <div
      className="w-screen h-screen overflow-hidden relative select-none"
      style={bgStyle}
    >
      {/* Video background */}
      {slide && bg?.type === 'video' && bg.url && (
        <video
          key={bg.url}
          className="absolute inset-0 w-full h-full object-cover"
          src={bg.url}
          autoPlay
          loop={bg.loop}
          muted={bg.muted}
          playsInline
        />
      )}

      {/* Transition overlay */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-200 z-20 pointer-events-none"
        style={{ opacity: transitioning ? 1 : 0 }}
      />

      {/* Text blocks */}
      {slide?.textBlocks.map((block) => {
        const shadowStyle = block.textShadow
          ? `${block.shadowColor} 0px ${block.shadowBlur / 2}px ${block.shadowBlur}px`
          : 'none'

        const outlineStyle = block.outline
          ? `-${block.outlineWidth}px -${block.outlineWidth}px 0 ${block.outlineColor}, ${block.outlineWidth}px -${block.outlineWidth}px 0 ${block.outlineColor}, -${block.outlineWidth}px ${block.outlineWidth}px 0 ${block.outlineColor}, ${block.outlineWidth}px ${block.outlineWidth}px 0 ${block.outlineColor}`
          : 'none'

        return (
          <div
            key={block.id}
            className="absolute flex items-center z-10"
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

      {/* Clock */}
      {settings.showClock && <Clock position={settings.clockPosition} />}

      {/* Empty state */}
      {!slide && (
        <div className="absolute inset-0 flex items-center justify-center" />
      )}
    </div>
  )
}
