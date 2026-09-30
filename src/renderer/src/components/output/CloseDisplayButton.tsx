import { X } from '@phosphor-icons/react'
import { toggleDisplay, type DisplayKind } from '../../api/display'

// Hover the top-right corner of a fullscreen display to reveal a close button —
// the escape hatch when the output covers the only screen.
export function CloseDisplayButton({ kind }: { kind: DisplayKind }) {
  return (
    <div className="group absolute right-0 top-0 z-50 flex h-24 w-24 items-start justify-end p-4">
      <button
        type="button"
        title="Tắt trình chiếu"
        aria-label="Tắt trình chiếu"
        onClick={() => toggleDisplay(kind)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X size={20} weight="bold" />
      </button>
    </div>
  )
}
