import React, { useState, useEffect } from 'react'

interface StatusBarProps {
  outputEnabled: boolean
  liveSlideText?: string
  liveIndex?: number
  totalSlides?: number
}

export function StatusBar({ outputEnabled, liveSlideText, liveIndex, totalSlides }: StatusBarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const isLive = liveIndex !== undefined && liveIndex >= 0

  return (
    <>
      <div className="h-6 bg-panel border-t border-app flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${outputEnabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-[#444]'}`} />
            <span>{outputEnabled ? 'Output On' : 'Output Off'}</span>
          </div>
          {isLive && totalSlides !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>
                Live: {liveIndex! + 1}/{totalSlides}
                {liveSlideText ? ` — ${liveSlideText}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted">
          <button onClick={() => setShowShortcuts(true)} className="hover:text-primary transition-colors">
            ⌨ Shortcuts
          </button>
          <span className="font-mono">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowShortcuts(false)}>
          <div className="bg-panel rounded-xl border border-app p-6 w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-primary font-semibold text-lg">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-muted hover:text-primary">✕</button>
            </div>
            <div className="space-y-2">
              {[
                ['→ / ↓ / Space', 'Next slide (go live)'],
                ['← / ↑', 'Previous slide (go live)'],
                ['Click slide', 'Go live immediately'],
                ['Escape', 'Clear output (black screen)']
              ].map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-app">
                  <kbd className="bg-surface border border-app-2 rounded px-2 py-0.5 text-xs text-orange-500 font-mono">
                    {key}
                  </kbd>
                  <span className="text-sm text-secondary">{action}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-4 text-center">Shortcuts work when focus is not in a text field</p>
          </div>
        </div>
      )}
    </>
  )
}
