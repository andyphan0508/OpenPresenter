import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

export function StatusBar() {
  const { getCurrentPresentation, liveSlideId, outputEnabled } = useStore()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const pres = getCurrentPresentation()
  const liveSlide = pres?.slides.find((s) => s.id === liveSlideId)
  const liveIdx = pres?.slides.findIndex((s) => s.id === liveSlideId) ?? -1

  return (
    <>
      <div className="h-7 bg-panel border-t border-app flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-muted">
          {/* Output status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              outputEnabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-[#444]'
            }`} />
            <span>{outputEnabled ? 'Output On' : 'Output Off'}</span>
          </div>

          {/* Live slide info */}
          {liveSlideId && pres && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
              <span>
                Live: slide {liveIdx + 1} of {pres.slides.length}
                {liveSlide?.textBlocks[0]?.content
                  ? ` — ${liveSlide.textBlocks[0].content.slice(0, 35)}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted">
          <button
            onClick={() => setShowShortcuts(true)}
            className="hover:text-primary transition-colors"
            title="View keyboard shortcuts"
          >
            Shortcuts
          </button>
          <span className="font-mono text-faint">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-panel rounded-xl border border-app p-6 w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-primary font-semibold text-base">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-muted hover:text-primary text-lg leading-none">×</button>
            </div>
            <div className="space-y-1.5">
              {[
                ['→ / ↓ / Space', 'Next slide (go live)'],
                ['← / ↑', 'Previous slide (go live)'],
                ['Click ▶ on thumbnail', 'Present that slide live'],
                ['▶ Present button', 'Present selected slide'],
                ['Escape', 'Clear output (black screen)'],
              ].map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-app last:border-0">
                  <kbd className="bg-gray-100 dark:bg-[#2a2a2a] border border-app rounded px-2 py-0.5 text-xs text-orange-500 font-mono">
                    {key}
                  </kbd>
                  <span className="text-sm text-secondary ml-4">{action}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-faint mt-4 text-center">
              Shortcuts work when focus is not in a text field
            </p>
          </div>
        </div>
      )}
    </>
  )
}
