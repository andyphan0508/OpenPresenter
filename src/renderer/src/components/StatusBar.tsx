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
      <div className="h-6 bg-[#141414] border-t border-[#2a2a2a] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-[#555]">
          {/* Output indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${outputEnabled ? 'bg-green-500' : 'bg-[#444]'}`} />
            <span>{outputEnabled ? 'Output On' : 'Output Off'}</span>
          </div>

          {/* Live slide */}
          {liveSlideId && pres && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>
                Live: {liveIdx + 1}/{pres.slides.length}
                {liveSlide?.textBlocks[0]?.content
                  ? ` — ${liveSlide.textBlocks[0].content.slice(0, 30)}...`
                  : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-[#555]">
          <button
            onClick={() => setShowShortcuts(true)}
            className="hover:text-white transition-colors"
          >
            ⌨ Shortcuts
          </button>
          <span className="font-mono">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Shortcuts overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[#1e1e1e] rounded-xl border border-[#444] p-6 w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-[#888] hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              {[
                ['→ / ↓ / Space', 'Next slide (go live)'],
                ['← / ↑', 'Previous slide (go live)'],
                ['Escape', 'Clear output (black screen)'],
                ['Double-click slide', 'Go live immediately'],
                ['Ctrl+N', 'New presentation (via menu)']
              ].map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#2a2a2a]">
                  <kbd className="bg-[#2a2a2a] border border-[#444] rounded px-2 py-0.5 text-xs text-orange-400 font-mono">
                    {key}
                  </kbd>
                  <span className="text-sm text-[#aaa]">{action}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#555] mt-4 text-center">
              Shortcuts work when focus is not in a text field
            </p>
          </div>
        </div>
      )}
    </>
  )
}
