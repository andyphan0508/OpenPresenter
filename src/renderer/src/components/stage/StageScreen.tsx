import { formatSeconds, messageText, timerSeconds } from '../../helpers/timer'
import { useClock } from '../../hooks/useClock'
import type { StagePayload } from '../../types'

// Confidence monitor for the worship team: current slide big, next slide, clock, timers, stage message.
export function StageScreen({ data }: { data: StagePayload }) {
  const now = useClock()
  const running = data.timers.filter((t) => t.running)

  return (
    <div className="flex h-screen w-screen select-none flex-col gap-[1.5vw] overflow-hidden bg-black p-[2vw] text-white">
      <header className="flex items-center justify-between gap-4 text-[2.4vw]">
        <span className="truncate text-white/60">{data.groupTitle ?? ''}</span>
        <div className="flex items-center gap-[2vw] font-mono">
          {running.map((t) => (
            <span key={t.id} className={timerSeconds(t, now) < 0 ? 'text-red-400' : 'text-amber-300'}>
              {t.name}: {formatSeconds(timerSeconds(t, now))}
            </span>
          ))}
          <span>{new Date(now).toLocaleTimeString('vi-VN')}</span>
        </div>
      </header>

      {data.cue && (
        <div className="truncate rounded-lg bg-white/10 px-[1.5vw] py-[0.6vw] text-[2.2vw] text-amber-200">{data.cue}</div>
      )}

      {data.message && (
        <div className="rounded-lg bg-red-600 px-[1.5vw] py-[0.8vw] text-center text-[3vw] font-bold">
          {messageText(data.message, data.timers, now)}
        </div>
      )}

      <section className="flex min-h-0 flex-[3] flex-col">
        <span className="text-[1.8vw] font-bold uppercase tracking-wider text-orange-400">
          {data.current ? (data.current.label ?? 'Đang chiếu') : 'Màn hình trống'}
        </span>
        <p className="min-h-0 flex-1 overflow-hidden whitespace-pre-wrap text-[4.5vw] font-bold leading-tight">
          {data.current?.text}
        </p>
      </section>

      <section className="flex min-h-0 flex-[2] flex-col border-t border-white/20 pt-[1vw]">
        <span className="text-[1.8vw] font-bold uppercase tracking-wider text-sky-400">
          Tiếp theo{data.nextGroupTitle ? ` · ${data.nextGroupTitle}` : ''}{data.next?.label ? ` · ${data.next.label}` : ''}
        </span>
        <p className="min-h-0 flex-1 overflow-hidden whitespace-pre-wrap text-[3vw] leading-tight text-white/70">
          {data.next?.text ?? '—'}
        </p>
      </section>
    </div>
  )
}
