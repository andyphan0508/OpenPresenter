import React, { useEffect, useCallback } from "react";
import { useStore } from "./store/useStore";
import { Toolbar } from "./components/Toolbar";
import { SlideList } from "./components/SlideList";
import { SlideEditModal } from "./components/SlideEditor";
import { MediaPanel } from "./components/MediaPanel";
import { LibraryPanel } from "./components/LibraryPanel";
import { PresentationPanel } from "./components/PresentationPanel";
import { OutputSettingsPanel } from "./components/OutputSettingsPanel";
import { StatusBar } from "./components/StatusBar";

export function App() {
  const {
    outputEnabled,
    outputSettings,
    liveSlideId,
    editingSlideId,
    activePanel,
    theme,
    setOutputEnabled,
    setLiveSlide,
    setEditingSlide,
    getCurrentPresentation,
  } = useStore();

  // Send slide to output window whenever liveSlideId changes
  useEffect(() => {
    const pres = getCurrentPresentation();
    const liveSlide = pres?.slides.find((s) => s.id === liveSlideId);

    if (outputEnabled) {
      if (liveSlide) {
        window.api.showSlide({ slide: liveSlide, settings: outputSettings });
      } else {
        window.api.clearOutput();
      }
    }
  }, [liveSlideId, outputEnabled]);

  // Resend when output settings change
  useEffect(() => {
    if (outputEnabled) {
      window.api.updateOutputSettings(outputSettings);
    }
  }, [outputSettings, outputEnabled]);

  // Listen for output window events
  useEffect(() => {
    const cleanupOpen = window.api.onOutputWindowOpened(() => {
      setOutputEnabled(true);
      const pres = getCurrentPresentation();
      const liveSlide = pres?.slides.find((s) => s.id === liveSlideId);
      if (liveSlide) {
        setTimeout(() => {
          window.api.showSlide({ slide: liveSlide, settings: outputSettings });
        }, 500);
      }
    });

    const cleanupClose = window.api.onOutputWindowClosed(() => {
      setOutputEnabled(false);
    });

    window.api.getOutputState().then((state: boolean) => {
      setOutputEnabled(state);
    });

    return () => {
      cleanupOpen();
      cleanupClose();
    };
  }, []);

  const handleToggleOutput = useCallback(async () => {
    const newState = await window.api.toggleOutput();
    setOutputEnabled(newState);
  }, []);

  const handleGoLive = useCallback(
    (slideId: string) => {
      const pres = getCurrentPresentation();
      const slide = pres?.slides.find((s) => s.id === slideId);

      if (slideId === liveSlideId) {
        setLiveSlide(null);
        if (outputEnabled) {
          window.api.clearOutput();
        }
        return;
      }

      setLiveSlide(slideId);
      if (outputEnabled && slide) {
        window.api.showSlide({ slide, settings: outputSettings });
      }
    },
    [outputEnabled, liveSlideId, outputSettings, getCurrentPresentation],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow shortcuts unless editing text (but not in modal)
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      // Don't trigger shortcuts while slide edit modal is open
      if (editingSlideId) {
        if (e.key === "Escape") {
          setEditingSlide(null);
        }
        return;
      }

      const pres = getCurrentPresentation();
      if (!pres) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        const slides = pres.slides;
        const liveIdx = slides.findIndex((s) => s.id === liveSlideId);
        const nextSlide = slides[liveIdx + 1];
        if (nextSlide) handleGoLive(nextSlide.id);
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const slides = pres.slides;
        const liveIdx = slides.findIndex((s) => s.id === liveSlideId);
        const prevSlide = slides[liveIdx - 1];
        if (prevSlide) handleGoLive(prevSlide.id);
      }

      if (e.key === "Escape") {
        setLiveSlide(null);
        window.api.clearOutput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [liveSlideId, editingSlideId, handleGoLive]);

  const isLibraryMode = activePanel === "library";

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden bg-app text-primary${theme === "dark" ? " dark" : ""}`}
    >
      <Toolbar onToggleOutput={handleToggleOutput} outputEnabled={outputEnabled} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        {!isLibraryMode && (
          <div className="w-60 border-r border-app flex flex-col overflow-hidden flex-shrink-0">
            {activePanel === "presentations" && <PresentationPanel />}
            {activePanel === "settings" && <OutputSettingsPanel />}
          </div>
        )}

        {/* Center content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {isLibraryMode ? (
            <LibraryPanel />
          ) : (
            <>
              {/* Slide management grid — fills remaining height */}
              <SlideList onGoLive={handleGoLive} />
              {/* Media import panel at bottom */}
              <MediaPanel />
            </>
          )}
        </div>

        {/* Right: Live Output Preview */}
        {!isLibraryMode && (
          <LivePreviewPanel liveSlideId={liveSlideId} onGoLive={handleGoLive} />
        )}
      </div>

      <StatusBar />

      {/* Slide edit modal — rendered on top of everything */}
      <SlideEditModal onGoLive={handleGoLive} />
    </div>
  );
}

// ─── Live Preview Panel ──────────────────────────────────────────────────────

function LivePreviewPanel({
  liveSlideId,
  onGoLive,
}: {
  liveSlideId: string | null;
  onGoLive: (id: string) => void;
}) {
  const { getCurrentPresentation, outputSettings, outputEnabled } = useStore();
  const pres = getCurrentPresentation();

  if (!pres) return null;

  const liveSlide = pres?.slides.find((s) => s.id === liveSlideId);
  const liveIdx = pres.slides.findIndex((s) => s.id === liveSlideId);
  const nextSlide = liveIdx >= 0 ? pres.slides[liveIdx + 1] : pres.slides[0];

  return (
    <div className="w-64 border-l border-app flex flex-col bg-panel flex-shrink-0">
      {/* Panel header */}
      <div className="px-3 py-2 border-b border-app flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Output Preview</span>
        {outputEnabled && liveSlideId && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Now showing */}
      <div className="p-3 border-b border-app">
        <p className="text-[10px] text-muted font-medium mb-2 uppercase tracking-wider">Now Showing</p>
        {liveSlide ? (
          <LiveMiniSlide slide={liveSlide} settings={outputSettings} />
        ) : (
          <div
            className="w-full rounded bg-black border border-app flex items-center justify-center"
            style={{ aspectRatio: "16/9" }}
          >
            <span className="text-faint text-[10px]">Black Screen</span>
          </div>
        )}
        {liveSlide && (
          <p className="text-[10px] text-muted mt-1.5 text-center truncate">
            {liveSlide.textBlocks[0]?.content.slice(0, 40) || "(no text)"}
          </p>
        )}
      </div>

      {/* Up next */}
      <div className="p-3 border-b border-app">
        <p className="text-[10px] text-muted font-medium mb-2 uppercase tracking-wider">Up Next</p>
        {nextSlide && nextSlide.id !== liveSlideId ? (
          <button
            className="w-full group text-left"
            onClick={() => onGoLive(nextSlide.id)}
            title="Click to present this slide"
          >
            <LiveMiniSlide slide={nextSlide} settings={outputSettings} />
            <p className="text-[10px] text-faint group-hover:text-orange-500 mt-1.5 text-center transition-colors">
              Click to present →
            </p>
          </button>
        ) : (
          <div
            className="w-full rounded bg-gray-100 dark:bg-[#1e1e1e] border border-app flex items-center justify-center"
            style={{ aspectRatio: "16/9" }}
          >
            <span className="text-faint text-[10px]">
              {pres.slides.length === 0 ? "No slides" : "End of slides"}
            </span>
          </div>
        )}
      </div>

      {/* Slide navigator with prev/next arrows */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-app flex items-center justify-between">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Navigator</p>
          <div className="flex gap-0.5">
            <button
              onClick={() => {
                const idx = pres.slides.findIndex((s) => s.id === liveSlideId)
                const prev = pres.slides[idx - 1]
                if (prev) onGoLive(prev.id)
              }}
              disabled={liveIdx <= 0}
              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors text-xs"
              title="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={() => {
                const idx = pres.slides.findIndex((s) => s.id === liveSlideId)
                const next = pres.slides[idx + 1]
                if (next) onGoLive(next.id)
              }}
              disabled={liveIdx >= pres.slides.length - 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-orange-500 hover:text-white text-muted disabled:opacity-30 transition-colors text-xs"
              title="Next slide"
            >
              ›
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {pres.slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => onGoLive(slide.id)}
              title="Click to present this slide"
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                slide.id === liveSlideId
                  ? "bg-orange-500/15 text-orange-500 dark:text-orange-400"
                  : "text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
              }`}
            >
              <span className="text-faint font-mono text-[10px] w-4 text-right flex-shrink-0">{idx + 1}</span>
              <span className="truncate">{slide.textBlocks[0]?.content.slice(0, 28) || "(empty)"}</span>
              {slide.id === liveSlideId && (
                <span className="ml-auto text-[9px] font-bold text-orange-500 flex-shrink-0">LIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveMiniSlide({
  slide,
}: {
  slide: import("./types").Slide;
  settings: import("./types").OutputSettings;
}) {
  const bg = slide.background;
  const mainText = slide.textBlocks[0];

  const bgStyle: React.CSSProperties =
    bg.type === "color"
      ? { backgroundColor: bg.value }
      : bg.type === "image"
        ? {
            backgroundImage: `url(${bg.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : { backgroundColor: "#111" };

  return (
    <div
      className="w-full rounded overflow-hidden border border-app shadow-sm"
      style={{ ...bgStyle, aspectRatio: "16/9", position: "relative" }}
    >
      {mainText && (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <p
            className="text-center text-[6px] leading-tight font-bold"
            style={{
              color: mainText.color,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              whiteSpace: "pre-wrap",
            }}
          >
            {mainText.content.slice(0, 80)}
          </p>
        </div>
      )}
    </div>
  );
}
