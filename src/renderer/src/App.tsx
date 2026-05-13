import React, { useEffect, useCallback } from "react";
import { useStore } from "./store/useStore";
import { Toolbar } from "./components/Toolbar";
import { SlideList } from "./components/SlideList";
import { SlideEditor } from "./components/SlideEditor";
import { LibraryPanel } from "./components/LibraryPanel";
import { PresentationPanel } from "./components/PresentationPanel";
import { OutputSettingsPanel } from "./components/OutputSettingsPanel";
import { StatusBar } from "./components/StatusBar";

export function App() {
  const {
    outputEnabled,
    outputSettings,
    currentPresentationId,
    liveSlideId,
    activePanel,
    theme,
    setOutputEnabled,
    setLiveSlide,
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

  // Also resend when output settings change
  useEffect(() => {
    if (outputEnabled) {
      window.api.updateOutputSettings(outputSettings);
    }
  }, [outputSettings, outputEnabled]);

  // Listen for output window events
  useEffect(() => {
    const cleanupOpen = window.api.onOutputWindowOpened(() => {
      setOutputEnabled(true);
      // Send current slide if any
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

    // Check initial state
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

      // Toggle: if already live, clear
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
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

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
  }, [liveSlideId, handleGoLive]);

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-app text-primary${theme === 'dark' ? ' dark' : ''}`}>
      {/* Toolbar */}
      <Toolbar
        onToggleOutput={handleToggleOutput}
        outputEnabled={outputEnabled}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 border-r border-app flex flex-col overflow-hidden flex-shrink-0">
          {activePanel === "presentations" && <PresentationPanel />}
          {activePanel === "library" && (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-[#555] text-xs text-center">
                Open Library panel to manage songs
              </p>
            </div>
          )}
          {activePanel === "settings" && <OutputSettingsPanel />}
        </div>

        {/* Center: slide list + editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activePanel === "library" ? (
            <LibraryPanel />
          ) : (
            <>
              {/* Slide strip */}
              <SlideList onGoLive={handleGoLive} />

              {/* Slide editor */}
              <SlideEditor onGoLive={handleGoLive} />
            </>
          )}
        </div>

        {/* Right: Live preview */}
        {activePanel !== "library" && (
          <LivePreviewPanel liveSlideId={liveSlideId} onGoLive={handleGoLive} />
        )}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

function LivePreviewPanel({
  liveSlideId,
  onGoLive,
}: {
  liveSlideId: string | null;
  onGoLive: (id: string) => void;
}) {
  const { getCurrentPresentation, outputSettings } = useStore();
  const pres = getCurrentPresentation();
  const liveSlide = pres?.slides.find((s) => s.id === liveSlideId);

  if (!pres) return null;

  const liveIdx = pres.slides.findIndex((s) => s.id === liveSlideId);
  const nextSlide = liveIdx >= 0 ? pres.slides[liveIdx + 1] : pres.slides[0];

  return (
    <div className="w-64 border-l border-app flex flex-col bg-app flex-shrink-0">
      <div className="p-3 border-b border-app">
        <p className="text-xs text-muted font-medium uppercase tracking-wider">
          Live Preview
        </p>
      </div>

      {/* Current live */}
      <div className="p-3 border-b border-app">
        <p className="text-xs text-red-400 mb-1.5 font-medium">● Current</p>
        {liveSlide ? (
          <LiveMiniSlide slide={liveSlide} settings={outputSettings} />
        ) : (
          <div
            className="w-full rounded bg-black border border-app flex items-center justify-center"
            style={{ aspectRatio: "16/9" }}
          >
            <span className="text-faint text-xs">Black</span>
          </div>
        )}
      </div>

      {/* Next slide */}
      <div className="p-3">
        <p className="text-xs text-muted mb-1.5 font-medium">Next</p>
        {nextSlide ? (
          <div
            className="cursor-pointer group"
            onClick={() => onGoLive(nextSlide.id)}
          >
            <LiveMiniSlide slide={nextSlide} settings={outputSettings} />
            <p className="text-xs text-muted mt-1 group-hover:text-primary transition-colors text-center">
              Click to go live
            </p>
          </div>
        ) : (
          <div
            className="w-full rounded bg-black border border-app flex items-center justify-center"
            style={{ aspectRatio: "16/9" }}
          >
            <span className="text-faint text-xs">End</span>
          </div>
        )}
      </div>

      {/* Slide navigator */}
      {pres && (
        <div className="flex-1 p-3 border-t border-app overflow-hidden flex flex-col">
          <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">
            All Slides
          </p>
          <div className="flex-1 overflow-y-auto space-y-1">
            {pres.slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => onGoLive(slide.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  slide.id === liveSlideId
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "text-muted hover:text-primary bg-hover"
                }`}
              >
                <span className="text-faint mr-1">{idx + 1}.</span>
                {slide.textBlocks[0]?.content.slice(0, 30) || "(empty)"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveMiniSlide({
  slide,
  settings,
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
      className="w-full rounded overflow-hidden border border-app"
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
