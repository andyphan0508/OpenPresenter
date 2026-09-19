import { useStore } from '../../store'
import type { Slide } from '../../types'
import { BackgroundFields } from './BackgroundFields'

export function BackgroundInspector({ presId, slide, themed }: { presId: string; slide: Slide; themed: boolean }) {
  const updateSlide = useStore((s) => s.updateSlide)
  if (themed) return <p className="rounded-md bg-surface p-3 text-xs text-muted">Nền của slide này do theme quyết định. Sửa theme trong ngăn Themes, hoặc “Tách khỏi theme”.</p>
  return (
    <div className="space-y-2">
      <span className="label">Nền slide</span>
      <BackgroundFields bg={slide.background} onChange={(background) => updateSlide(presId, slide.id, { background })} />
      <p className="text-2xs text-muted">Khi đang chiếu một media từ ngăn Media, media đó thay cho nền slide.</p>
    </div>
  )
}
