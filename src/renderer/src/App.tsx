import { useEffect, useCallback, useState, useRef } from 'react'
import { useStore } from './store/useStore'
import { saveProject, openProjectDialog, openProjectPath } from './store/project'
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
    currentFilePath,
    dirty,
    setOutputEnabled,
    setLiveSlide,
    setActivePanel,
    toggleTheme,
    createPresentation,
    getCurrentPresentation
  } = useStore()

  const pres = getCurrentPresentation()

  // Transient toast feedback for project save/open actions
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const fileName = currentFilePath ? currentFilePath.split(/[\\/]/).pop() : undefined

  const handleSaveProject = useCallback(
    async (saveAs = false) => {
      const res = await saveProject(saveAs)
      if (res.ok) showToast(`Đã lưu ${res.path?.split(/[\\/]/).pop() ?? 'dự án'}`, 'ok')
      else if (!res.canceled) showToast(res.error || 'Lưu thất bại', 'err')
    },
    [showToast]
  )

  const handleOpenProject = useCallback(
    async (path?: string) => {
      if (useStore.getState().dirty) {
        const ok = window.confirm(
          'Dự án hiện tại có thay đổi chưa lưu sẽ bị thay thế. Tiếp tục mở?'
        )
        if (!ok) return
      }
      const res = path ? await openProjectPath(path) : await openProjectDialog()
      if (res.ok) showToast(`Đã mở ${res.path?.split(/[\\/]/).pop() ?? 'dự án'}`, 'ok')
      else if (!res.canceled) showToast(res.error || 'Mở thất bại', 'err')
    },
    [showToast]
  )

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
      // Never hijack keys while the user is typing or interacting with a control,
      // and ignore shortcut combos (Cmd/Ctrl) handled by the native menu.
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey
      )
        return

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

  // Wire native menu + file-association (double-click .opres) into the app
  useEffect(() => {
    const cleanupMenu = window.api.onMenuAction((action) => {
      if (action === 'new') {
        createPresentation('Untitled')
        setActivePanel('presentations')
      } else if (action === 'open') {
        handleOpenProject()
      } else if (action === 'save') {
        handleSaveProject(false)
      } else if (action === 'save-as') {
        handleSaveProject(true)
      }
    })
    const cleanupOpenFile = window.api.onOpenProjectFile((filePath) => {
      handleOpenProject(filePath)
    })
    window.api.notifyReady()
    return () => {
      cleanupMenu()
      cleanupOpenFile()
    }
  }, [handleOpenProject, handleSaveProject, createPresentation, setActivePanel])

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
        projectFileName={fileName}
        dirty={dirty}
        theme={theme}
        onPanelChange={setActivePanel}
        onToggleOutput={handleToggleOutput}
        onToggleTheme={toggleTheme}
        onNewPresentation={createPresentation}
        onOpenProject={() => handleOpenProject()}
        onSaveProject={() => handleSaveProject(false)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — hidden in Library mode (the library has its own song list) */}
        {activePanel !== 'library' && (
          <div
            key={`side-${activePanel}`}
            className="w-64 border-r border-app flex flex-col overflow-hidden flex-shrink-0 fade-in-right"
          >
            {activePanel === 'presentations' && <PresentationPanel />}
            {activePanel === 'settings' && <OutputSettingsPanel />}
          </div>
        )}

        {/* Center: slide list + editor */}
        <div
          key={`center-${activePanel === 'library' ? 'library' : 'main'}`}
          className="flex-1 flex flex-col overflow-hidden min-w-0 fade-in-up"
        >
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

      {/* Transient save/open feedback */}
      {toast && (
        <div
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-2xl text-sm font-medium modal-in ${
            toast.kind === 'ok'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
