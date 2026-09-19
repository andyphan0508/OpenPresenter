import type { ReactNode } from 'react'
import { sectionColor } from '../../constants/sections'
import type { Slide, Theme } from '../../types'
import { SlideView } from '../slides/SlideView'

interface SlideTileProps {
  slide: Slide
  themes: Theme[]
  index: number
  live?: boolean
  selected?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
  actions?: ReactNode // hover actions (top-right)
}

// ProPresenter-style tile: thumbnail on top, colored group label bar underneath.
export function SlideTile({ slide, themes, index, live, selected, onClick, onDoubleClick, actions }: SlideTileProps) {
  const color = slide.group ? sectionColor(slide.sectionType) : '#6b7280'
  const ring = live ? 'ring-[3px] ring-live' : selected ? 'ring-2 ring-select' : 'ring-1 ring-line-strong hover:ring-fg-2'
  return (
    <div className={`group relative overflow-hidden rounded-md bg-surface transition-shadow duration-150 ${ring}`}>
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        aria-label={`Slide ${index + 1}${slide.label ? `, ${slide.label}` : ''}${live ? ', đang chiếu' : ''}`}
        aria-current={live ? 'true' : undefined}
        className="block w-full cursor-pointer text-left"
      >
        <SlideView slide={slide} themes={themes} />
        <span className="flex h-6 items-center gap-1.5 px-2 text-2xs font-medium text-white" style={{ backgroundColor: color }}>
          <span className="font-mono opacity-80">{index + 1}</span>
          <span className="truncate">{slide.label ?? ''}</span>
          {live && <span className="ml-auto rounded bg-black/30 px-1 font-bold tracking-wide">LIVE</span>}
        </span>
      </button>
      {actions && <div className="absolute right-1 top-1 hidden gap-0.5 rounded-md bg-black/60 p-0.5 group-hover:flex">{actions}</div>}
    </div>
  )
}
