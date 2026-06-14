import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Song, SongStyle, DEFAULT_SONG_STYLE } from "../../types";

const FONT_OPTIONS = [
  "sans-serif",
  "serif",
  "monospace",
  "Arial",
  "Helvetica Neue",
  "Georgia",
  "Times New Roman",
  "Trebuchet MS",
  "Impact",
  "Verdana",
  "Tahoma",
];

/**
 * Per-song style template. Applied to every slide generated when the song is
 * added to a presentation (see addSlidesFromSong in the store).
 */
export function SongTemplateEditor({ song }: { song: Song }) {
  const { media, updateSongStyle, updateSong } = useStore();
  const style: SongStyle = { ...DEFAULT_SONG_STYLE, ...song.style };
  const imageMedia = media.filter((m) => m.type === "image");

  const set = (patch: Partial<SongStyle>) => updateSongStyle(song.id, patch);
  const bg = style.background;

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <p className="text-muted font-medium uppercase tracking-wider text-[10px]">
          Song Template
        </p>
        <button
          onClick={() =>
            updateSong(song.id, { style: { ...DEFAULT_SONG_STYLE } })
          }
          className="text-[10px] text-muted hover:text-primary"
        >
          Reset
        </button>
      </div>
      <p className="text-[10px] text-faint -mt-2">
        Style applied to every slide when you add this song to a presentation.
      </p>

      {/* Background */}
      <div>
        <label className="label-xs mb-1.5 block">Background</label>
        <div className="flex gap-1 mb-2">
          {(["color", "image"] as const).map((t) => (
            <button
              key={t}
              onClick={() =>
                set({
                  background:
                    t === "color"
                      ? {
                          type: "color",
                          value: bg.type === "color" ? bg.value : "#000000",
                        }
                      : {
                          type: "image",
                          url: bg.type === "image" ? bg.url : "",
                          fit: "cover",
                          dim: 0.3,
                        },
                })
              }
              className={`flex-1 py-1.5 rounded capitalize transition-colors ${
                bg.type === t
                  ? "bg-orange-500 text-white"
                  : "bg-surface text-muted hover:bg-hover-2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {bg.type === "color" && (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={bg.value}
              onChange={(e) =>
                set({ background: { type: "color", value: e.target.value } })
              }
              className="w-9 h-7 rounded cursor-pointer bg-transparent border border-app-2"
            />
            <input
              type="text"
              value={bg.value}
              onChange={(e) =>
                set({ background: { type: "color", value: e.target.value } })
              }
              className="flex-1 input-base px-2 py-1 font-mono"
            />
          </div>
        )}

        {bg.type === "image" && (
          <div className="space-y-2">
            {imageMedia.length === 0 ? (
              <p className="text-[10px] text-faint text-center py-2">
                No saved images. Upload one from a slide's Background tab first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                {imageMedia.map((m) => (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.name}
                    title={m.name}
                    onClick={() => set({ background: { ...bg, url: m.url } })}
                    className={`w-full aspect-video object-cover rounded cursor-pointer border transition-all ${
                      bg.url === m.url
                        ? "border-orange-500 ring-1 ring-orange-500"
                        : "border-app-2 hover:border-orange-400"
                    }`}
                  />
                ))}
              </div>
            )}
            <div>
              <label className="text-[10px] text-muted flex justify-between mb-0.5">
                <span>Dim overlay</span>
                <span className="text-primary font-mono">
                  {Math.round((bg.dim ?? 0) * 100)}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={bg.dim ?? 0}
                onChange={(e) =>
                  set({ background: { ...bg, dim: +e.target.value } })
                }
                className="w-full accent-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Font family */}
      <div>
        <label className="label-xs mb-1 block">Font</label>
        <select
          value={style.fontFamily}
          onChange={(e) => set({ fontFamily: e.target.value })}
          className="input-base w-full px-2 py-1.5"
          style={{ fontFamily: style.fontFamily }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div>
        <label className="text-[10px] text-muted flex justify-between mb-1">
          <span>Font Size</span>
          <span className="text-primary font-mono">{style.fontSize}px</span>
        </label>
        <input
          type="range"
          min={24}
          max={200}
          value={style.fontSize}
          onChange={(e) => set({ fontSize: +e.target.value })}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Color */}
      <div>
        <label className="label-xs mb-1 block">Text Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={style.color}
            onChange={(e) => set({ color: e.target.value })}
            className="w-9 h-7 rounded cursor-pointer bg-transparent border border-app-2"
          />
          <input
            type="text"
            value={style.color}
            onChange={(e) => set({ color: e.target.value })}
            className="flex-1 input-base px-2 py-1 font-mono"
          />
        </div>
      </div>

      {/* Align */}
      <div>
        <label className="label-xs mb-1 block">Align</label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              onClick={() => set({ textAlign: a })}
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors ${
                style.textAlign === a
                  ? "bg-orange-500 text-white"
                  : "bg-surface text-muted hover:bg-hover-2"
              }`}
            >
              {a === "left" ? (
                <AlignLeft className="w-4 h-4" />
              ) : a === "center" ? (
                <AlignCenter className="w-4 h-4" />
              ) : (
                <AlignRight className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Line height */}
      <div>
        <label className="text-[10px] text-muted flex justify-between mb-1">
          <span>Line Height</span>
          <span className="text-primary font-mono">
            {style.lineHeight.toFixed(2)}
          </span>
        </label>
        <input
          type="range"
          min={0.8}
          max={2.5}
          step={0.05}
          value={style.lineHeight}
          onChange={(e) => set({ lineHeight: +e.target.value })}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Shadow */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={style.textShadow}
          onChange={(e) => set({ textShadow: e.target.checked })}
          className="accent-orange-500"
        />
        <span className="text-[10px] text-muted">Text Shadow</span>
      </label>

      {/* Auto-split */}
      <div className="border-t border-app pt-3">
        <label className="text-[10px] text-muted flex justify-between mb-1">
          <span>Max lines per slide (auto-split)</span>
          <span className="text-primary font-mono">
            {style.maxLinesPerSlide || "Off"}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={12}
          value={style.maxLinesPerSlide}
          onChange={(e) => set({ maxLinesPerSlide: +e.target.value })}
          className="w-full accent-orange-500"
        />
        <p className="text-[9px] text-faint mt-1">
          0 = keep each section on one slide. Higher = split long sections into
          multiple slides.
        </p>
      </div>
    </div>
  );
}
