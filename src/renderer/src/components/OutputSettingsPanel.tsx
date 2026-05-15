import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

interface DisplayInfo {
  id: number
  label: string
  width: number
  height: number
  x: number
  y: number
  isPrimary: boolean
}

interface CaptureDevice {
  deviceId: string
  label: string
  kind: string
}

export function OutputSettingsPanel() {
  const { outputSettings, updateOutputSettings, outputEnabled } = useStore()

  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [captureDevices, setCaptureDevices] = useState<CaptureDevice[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  const FONT_OPTIONS = [
    'sans-serif', 'serif', 'monospace',
    'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
    'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Verdana'
  ]

  // Load connected displays via IPC
  useEffect(() => {
    window.api.getDisplays?.().then((list: DisplayInfo[]) => {
      setDisplays(list ?? [])
    }).catch(() => {})
  }, [])

  // Enumerate capture devices (Blackmagic, etc.) via Web API
  const refreshCaptureDevices = async () => {
    setLoadingDevices(true)
    try {
      // Request permission first (may be needed on first call)
      await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {})
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput').map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        kind: d.kind
      }))
      setCaptureDevices(videoInputs)
    } catch {
      setCaptureDevices([])
    } finally {
      setLoadingDevices(false)
    }
  }

  useEffect(() => {
    refreshCaptureDevices()
  }, [])

  const isBlackmagic = (label: string) =>
    /blackmagic|ultrastudio|decklink|atem|intensity/i.test(label)

  return (
    <div className="flex flex-col h-full bg-panel overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-app">
        <h2 className="text-primary font-semibold text-sm">Output Settings</h2>
        <p className="text-muted text-xs mt-0.5">Configure the audience display</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Output status */}
        <div className={`p-3 rounded-lg border ${
          outputEnabled
            ? 'border-orange-500/30 bg-orange-500/5'
            : 'border-app bg-surface'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              outputEnabled ? 'bg-orange-500 animate-pulse' : 'bg-gray-300 dark:bg-[#555]'
            }`} />
            <span className="text-sm font-medium text-primary">
              Output {outputEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            {outputEnabled
              ? 'Audience screen is connected and receiving slides.'
              : 'Click "Output" in the toolbar to open the audience screen.'}
          </p>
        </div>

        {/* ── Display / Monitor selector ── */}
        <div>
          <label className="text-xs text-muted font-medium block mb-2">Output Display</label>
          {displays.length === 0 ? (
            <div className="p-3 rounded bg-surface text-xs text-muted text-center">
              Only one display detected
            </div>
          ) : (
            <div className="space-y-1.5">
              {displays.map((d) => (
                <button
                  key={d.id}
                  onClick={() => updateOutputSettings({ targetDisplayId: d.id })}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    outputSettings.targetDisplayId === d.id
                      ? 'border-orange-500 bg-orange-500/5 text-primary'
                      : 'border-app hover:border-gray-300 dark:hover:border-[#444] text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">
                        {d.label}
                        {d.isPrimary && (
                          <span className="ml-1.5 text-[9px] text-muted">(Primary)</span>
                        )}
                      </p>
                      <p className="text-[10px] text-faint mt-0.5">{d.width}×{d.height}</p>
                    </div>
                    {outputSettings.targetDisplayId === d.id && (
                      <span className="text-orange-500 text-xs">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Capture Devices (Blackmagic etc.) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted font-medium">Capture Devices</label>
            <button
              onClick={refreshCaptureDevices}
              disabled={loadingDevices}
              className="text-[10px] text-muted hover:text-primary transition-colors"
            >
              {loadingDevices ? 'Scanning...' : '↺ Refresh'}
            </button>
          </div>

          {captureDevices.length === 0 ? (
            <div className="p-3 rounded border border-dashed border-gray-200 dark:border-[#333] text-xs text-muted text-center">
              No capture devices found.
              <br />
              Connect a Blackmagic or SDI device and click Refresh.
            </div>
          ) : (
            <div className="space-y-1.5">
              {captureDevices.map((device) => (
                <div
                  key={device.deviceId}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                    isBlackmagic(device.label)
                      ? 'border-amber-400/40 bg-amber-500/5'
                      : 'border-app bg-surface'
                  }`}
                >
                  <span className="text-base flex-shrink-0">
                    {isBlackmagic(device.label) ? '🎥' : '📷'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium truncate">{device.label}</p>
                    {isBlackmagic(device.label) && (
                      <p className="text-[9px] text-amber-500 mt-0.5">Blackmagic Device Detected</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-faint mt-2 leading-relaxed">
            Devices like Blackmagic UltraStudio HD Mini appear as video capture inputs.
            Connect via Thunderbolt/USB and they will be listed here.
          </p>
        </div>

        <div className="border-t border-app pt-4 space-y-4">
          {/* Default background color */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Default Background</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={outputSettings.backgroundColor}
                onChange={(e) => updateOutputSettings({ backgroundColor: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer bg-transparent border border-app"
              />
              <input
                type="text"
                value={outputSettings.backgroundColor}
                onChange={(e) => updateOutputSettings({ backgroundColor: e.target.value })}
                className="flex-1 input-base px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Default text color */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Default Text Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={outputSettings.defaultTextColor}
                onChange={(e) => updateOutputSettings({ defaultTextColor: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer bg-transparent border border-app"
              />
              <input
                type="text"
                value={outputSettings.defaultTextColor}
                onChange={(e) => updateOutputSettings({ defaultTextColor: e.target.value })}
                className="flex-1 input-base px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs text-muted font-medium flex justify-between mb-2">
              <span>Default Font Size</span>
              <span className="text-primary font-mono">{outputSettings.defaultFontSize}px</span>
            </label>
            <input
              type="range" min={24} max={200}
              value={outputSettings.defaultFontSize}
              onChange={(e) => updateOutputSettings({ defaultFontSize: +e.target.value })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Default Font</label>
            <select
              value={outputSettings.defaultFontFamily}
              onChange={(e) => updateOutputSettings({ defaultFontFamily: e.target.value })}
              className="w-full input-base px-2 py-1.5 text-sm"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Text alignment */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Default Text Alignment</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateOutputSettings({ defaultTextAlign: align })}
                  className={`flex-1 py-1.5 text-xs rounded capitalize transition-colors ${
                    outputSettings.defaultTextAlign === align
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:bg-gray-200 dark:hover:bg-[#333]'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Clock overlay */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Clock Overlay</label>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={outputSettings.showClock}
                onChange={(e) => updateOutputSettings({ showClock: e.target.checked })}
                className="accent-orange-500"
              />
              <span className="text-sm text-primary">Show clock on output screen</span>
            </label>

            {outputSettings.showClock && (
              <select
                value={outputSettings.clockPosition}
                onChange={(e) => updateOutputSettings({ clockPosition: e.target.value as any })}
                className="w-full input-base px-2 py-1.5 text-sm"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs text-muted font-medium block mb-2">Preview</label>
            <div
              className="w-full rounded-lg overflow-hidden border border-app"
              style={{ aspectRatio: '16/9', backgroundColor: outputSettings.backgroundColor }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <p
                  style={{
                    color: outputSettings.defaultTextColor,
                    fontFamily: outputSettings.defaultFontFamily,
                    fontSize: Math.min(outputSettings.defaultFontSize * 0.08, 18) + 'px',
                    textAlign: outputSettings.defaultTextAlign,
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    fontWeight: 'bold'
                  }}
                >
                  Sample Text Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
