import type { CSSProperties } from 'react'
import { mediaUrl } from '../../api/media'
import type { Prop, PropPosition } from '../../types'

const MARGIN = 48
const POSITION: Record<PropPosition, CSSProperties> = {
  'top-left': { top: MARGIN, left: MARGIN },
  'top-right': { top: MARGIN, right: MARGIN },
  'bottom-left': { bottom: MARGIN, left: MARGIN },
  'bottom-right': { bottom: MARGIN, right: MARGIN },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
}

export function PropsLayer({ props }: { props: Prop[] }) {
  return (
    <>
      {props.map((p) => (
        <img
          key={p.id}
          src={mediaUrl(p.mediaPath)}
          alt=""
          className="absolute object-contain"
          style={{ ...POSITION[p.position], width: (p.size / 100) * 1920 }}
        />
      ))}
    </>
  )
}

// Bottom bar on the audience screen (announcements, "parent of child #12…").
export function MessageBar({ text }: { text: string }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex items-center justify-center px-16 text-center font-semibold text-white"
      style={{ height: 130, fontSize: 50, background: 'rgba(0,0,0,0.78)' }}
    >
      {text}
    </div>
  )
}
