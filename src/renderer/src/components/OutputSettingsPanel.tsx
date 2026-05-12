import React from 'react'
import { useStore } from '../store/useStore'

export function OutputSettingsPanel() {
  const { outputSettings, updateOutputSettings, outputEnabled } = useStore()

  const FONT_OPTIONS = [
    'sans-serif',
    'serif',
    'monospace',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS'
  ]

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <h2 className="text-white font-semibold text-sm">Output Settings</h2>
        <p className="text-[#555] text-xs mt-1">Configure the audience display</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Output status */}
        <div className={`p-3 rounded-lg border ${outputEnabled ? 'border-green-500/30 bg-green-500/10' : 'border-[#333] bg-[#1e1e1e]'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${outputEnabled ? 'bg-green-500 animate-pulse' : 'bg-[#555]'}`} />
            <span className="text-sm font-medium text-white">
              Output {outputEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-[#666] mt-1">
            {outputEnabled ? 'Audience display is connected' : 'Use the Output button in toolbar to activate'}
          </p>
        </div>

        {/* Background color */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Default Background
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={outputSettings.backgroundColor}
              onChange={(e) => updateOutputSettings({ backgroundColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-[#444]"
            />
            <input
              type="text"
              value={outputSettings.backgroundColor}
              onChange={(e) => updateOutputSettings({ backgroundColor: e.target.value })}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-xs font-mono"
            />
          </div>
        </div>

        {/* Default text color */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Default Text Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={outputSettings.defaultTextColor}
              onChange={(e) => updateOutputSettings({ defaultTextColor: e.target.value })}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-[#444]"
            />
            <input
              type="text"
              value={outputSettings.defaultTextColor}
              onChange={(e) => updateOutputSettings({ defaultTextColor: e.target.value })}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-xs font-mono"
            />
          </div>
        </div>

        {/* Font size */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider flex justify-between mb-2">
            <span>Default Font Size</span>
            <span className="text-white">{outputSettings.defaultFontSize}px</span>
          </label>
          <input
            type="range"
            min={24}
            max={200}
            value={outputSettings.defaultFontSize}
            onChange={(e) => updateOutputSettings({ defaultFontSize: +e.target.value })}
            className="w-full accent-orange-500"
          />
        </div>

        {/* Font family */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Default Font
          </label>
          <select
            value={outputSettings.defaultFontFamily}
            onChange={(e) => updateOutputSettings({ defaultFontFamily: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-sm focus:border-orange-500 outline-none"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Text align */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Default Text Align
          </label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateOutputSettings({ defaultTextAlign: align })}
                className={`flex-1 py-1.5 text-sm rounded capitalize transition-colors ${
                  outputSettings.defaultTextAlign === align
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
                }`}
              >
                {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
              </button>
            ))}
          </div>
        </div>

        {/* Clock overlay */}
        <div>
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Clock Overlay
          </label>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={outputSettings.showClock}
              onChange={(e) => updateOutputSettings({ showClock: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-sm text-white">Show clock on output</span>
          </label>

          {outputSettings.showClock && (
            <select
              value={outputSettings.clockPosition}
              onChange={(e) => updateOutputSettings({ clockPosition: e.target.value as any })}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1.5 text-white text-sm focus:border-orange-500 outline-none"
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
          <label className="text-xs text-[#888] font-medium uppercase tracking-wider block mb-2">
            Preview
          </label>
          <div
            className="w-full rounded-lg overflow-hidden border border-[#333]"
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
  )
}
