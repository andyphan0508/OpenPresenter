import type { StagePayload } from '../../types'

// What the stage display currently shows (mirrors the stage window).
export function StageTab({ stage, stageOpen }: { stage: StagePayload; stageOpen: boolean }) {
  return (
    <div className="space-y-3 p-3">
      <p className="text-2xs text-muted">{stageOpen ? 'Màn hình sân khấu đang bật.' : 'Bật “Sân khấu” trên thanh công cụ để mở màn hình cho ban hát.'}</p>
      <section>
        <h3 className="panel-title mb-1 text-live">Đang chiếu{stage.current?.label ? ` · ${stage.current.label}` : ''}</h3>
        <p className="whitespace-pre-wrap rounded-md bg-surface p-2.5 text-[13px] leading-snug text-fg">{stage.current?.text || '—'}</p>
      </section>
      <section>
        <h3 className="panel-title mb-1 text-select">Tiếp theo{stage.next?.label ? ` · ${stage.next.label}` : ''}</h3>
        <p className="whitespace-pre-wrap rounded-md bg-surface p-2.5 text-[13px] leading-snug text-fg-2">{stage.next?.text || '—'}</p>
      </section>
    </div>
  )
}
