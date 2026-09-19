import type { CSSProperties } from 'react'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../../constants/defaults'
import type { TextBlock } from '../../types'

const JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function textShadow(b: TextBlock): string {
  if (b.outline) {
    const w = b.outlineWidth
    const c = b.outlineColor
    return `-${w}px -${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}`
  }
  return b.textShadow ? `${b.shadowColor} 0px ${b.shadowBlur / 2}px ${b.shadowBlur}px` : 'none'
}

interface TextBlockViewProps {
  block: TextBlock
  translation?: string
  translationStyle?: { color: string; scale: number }
}

// One text box on the design canvas, with an optional second-language line under it.
export function TextBlockView({ block, translation, translationStyle }: TextBlockViewProps) {
  const style: CSSProperties = {
    fontSize: block.fontSize,
    fontFamily: block.fontFamily,
    fontWeight: block.fontWeight,
    fontStyle: block.fontStyle,
    color: block.color,
    textAlign: block.textAlign,
    textShadow: textShadow(block),
    lineHeight: block.lineHeight,
    textTransform: block.textTransform,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%'
  }
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: (block.x / 100) * DESIGN_WIDTH,
        top: (block.y / 100) * DESIGN_HEIGHT,
        width: (block.width / 100) * DESIGN_WIDTH,
        height: (block.height / 100) * DESIGN_HEIGHT,
        justifyContent: JUSTIFY[block.textAlign]
      }}
    >
      <div style={style}>
        {block.content}
        {translation && translationStyle && (
          <div
            style={{
              fontSize: block.fontSize * translationStyle.scale,
              color: translationStyle.color,
              fontWeight: 'normal',
              fontStyle: 'italic',
              marginTop: '0.35em'
            }}
          >
            {translation}
          </div>
        )}
      </div>
    </div>
  )
}
