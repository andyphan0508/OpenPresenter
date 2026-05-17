import { useEffect, useCallback } from 'react'
import { useStore } from './store/useStore'
import { Toolbar } from './components/ui/Toolbar'
import { StatusBar } from './components/ui/StatusBar'
import { SlideList } from './components/presentation/SlideList'
import { SlideEditor } from './components/slide/SlideEditor'
import { LibraryPanel } from './components/library/LibraryPanel'
import { PresentationPanel } from './components/presentation/PresentationPanel'
import { OutputSettingsPanel } from './components/output/OutputSettingsPanel'
import { LivePreviewPanel } from './components/output/LivePreviewPanel'

export function App() {
  const {
    outputEnabled,
    outputSettings,
    liveSlideId,
    activePanel,
    theme,
    setOutputEnabled,
    setLiveSlide,
    setActivePanel,
    toggleTheme,
    createPresentation,
    getCurrentPresentation
  } = useStore()

  const pres = getCurrentPresentation()

  useEffect(() => {
    const liveSlide = pres?.slides.find((s) => s.id === liveSlideId)
    if (outputEnabled) {
      if (liveSlide) {
        window.api.showSlide({ slide: liveSlide, settings: outputSettings })
      } else {
        window.api.clearOutput()
      }
    }
  }, [liveSlideId, outputEnabled])

  useEffect(() => {
    if (outputEnabled) {
      window.api.updateOutputSettings(outputSettings)
    }
  }, [outputSettings, outputEnabled])

  useEffect(() => {
    const cleanupOpen = window.api.onOutputWindowOpened(() => {
      setOutputEnabled(true)
      const currentPres = getCurrentPresentation()
      const liveSlide = currentPres?.slides.find((s) => s.id === liveSlideId)
      if (liveSlide) {
        setTimeout(() => {
          window.api.showSlide({ slide: liveSlide, settings: outputSettings })
        }, 500)
      }
    })

    const cleanupClose = window.api.onOutputWindowClosed(() => {
      setOutputEnabled(false)
    })

    window.api.getOutputState().then((state: boolean) => {
      setOutputEnabled(state)
    })

    return () => {
      cleanupOpen()
      cleanupClose()
    }
  }, [])

  const handleToggleOutput = useCallback(async () => {
    const newState = await window.api.toggleOutput()
    setOutputEnabled(newState)
  }, [])

  const handleGoLive = useCallback(
    (slideId: string) => {
      const currentPres = getCurrentPresentation()
      const slide = currentPres?.slides.find((s) => s.id === slideId)

      if (slideId === liveSlideId) {
        setLiveSlide(null)
        if (outputEnabled) window.api.clearOutput()
        return
      }

      setLiveSlide(slideId)
      if (outputEnabled && slide) {
        window.api.showSlide({ slide, settings: outputSettings })
      }
    },
    [outputEnabled, liveSlideId, outputSettings, getCurrentPresentation]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const currentPres = getCurrentPresentation()
      if (!currentPres) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        const slides = currentPres.slides
        const liveIdx = slides.findIndex((s) => s.id === liveSlideId)
        const nextSlide = slides[liveIdx + 1]
        if (nextSlide) handleGoLive(nextSlide.id)
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const slides = currentPres.slides
        const liveIdx = slides.findIndex((s) => s.id === liveSlideId)
        const prevSlide = slides[liveIdx - 1]
        if (prevSlide) handleGoLive(prevSlide.id)
      }

      if (e.key === 'Escape') {
        setLiveSlide(null)
        window.api.clearOutput()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [liveSlideId, handleGoLive])

  // Compute status bar props
  const liveIdx = pres ? pres.slides.findIndex((s) => s.id === liveSlideId) : -1
  const liveSlideText = liveIdx >= 0 && pres
    ? pres.slides[liveIdx].textBlocks[0]?.content.slice(0, 40)
    : undefined

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-app text-primary${theme === 'dark' ? ' dark' : ''}`}>
      <Toolbar
        activePanel={activePanel}
        outputEnabled={outputEnabled}
        currentPresentationName={pres?.name}
        theme={theme}
        onPanelChange={setActivePanel}
        onToggleOutput={handleToggleOutput}
        onToggleTheme={toggleTheme}
        onNewPresentation={createPresentation}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 border-r border-app flex flex-col overflow-hidden flex-shrink-0">
          {activePanel === 'presentations' && <PresentationPanel />}
          {activePanel === 'library' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-muted text-xs text-center">Open Library panel to manage songs</p>
            </div>
          )}
          {activePanel === 'settings' && <OutputSettingsPanel />}
        </div>

        {/* Center: slide list + editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activePanel === 'library' ? (
            <LibraryPanel />
          ) : (
            <>
              <SlideList onGoLive={handleGoLive} />
              <SlideEditor onGoLive={handleGoLive} />
            </>
          )}
        </div>

        {/* Right: live preview */}
        {activePanel !== 'library' && pres && (
          <LivePreviewPanel
            pres={pres}
            liveSlideId={liveSlideId}
            outputSettings={outputSettings}
            outputEnabled={outputEnabled}
            onGoLive={handleGoLive}
          />
        )}
      </div>

      <StatusBar
        outputEnabled={outputEnabled}
        liveSlideText={liveSlideText}
        liveIndex={liveIdx}
        totalSlides={pres?.slides.length}
      />
    </div>
  )
}
