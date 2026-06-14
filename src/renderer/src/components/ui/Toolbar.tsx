import React, { useState } from "react";
import {
  Presentation,
  Music,
  Settings,
  Plus,
  Sun,
  Moon,
  FolderOpen,
  Save,
} from "lucide-react";

type Panel = "presentations" | "library" | "settings";

interface ToolbarProps {
  activePanel: Panel;
  outputEnabled: boolean;
  currentPresentationName?: string;
  projectFileName?: string;
  dirty?: boolean;
  theme: "dark" | "light";
  onPanelChange: (panel: Panel) => void;
  onToggleOutput: () => void;
  onToggleTheme: () => void;
  onNewPresentation: (name: string) => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
}

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-orange-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/30"
          : "text-muted hover:text-primary bg-hover"
      }`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

export function Toolbar({
  activePanel,
  outputEnabled,
  currentPresentationName,
  projectFileName,
  dirty,
  theme,
  onPanelChange,
  onToggleOutput,
  onToggleTheme,
  onNewPresentation,
  onOpenProject,
  onSaveProject,
}: ToolbarProps) {
  const [showNewPresDialog, setShowNewPresDialog] = useState(false);
  const [newPresName, setNewPresName] = useState("");

  const handleCreate = () => {
    if (newPresName.trim()) {
      onNewPresentation(newPresName.trim());
      setNewPresName("");
      setShowNewPresDialog(false);
    }
  };

  return (
    <>
      <div className="h-14 bg-panel border-b border-app flex items-center px-4 gap-2 select-none app-drag flex-shrink-0">
        <div className="w-16 no-drag" />

        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">OP</span>
          </div>
          <span className="text-primary font-semibold text-sm">
            OpenPresenter
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-[#444]" />

        <div className="flex items-center gap-1 no-drag">
          <ToolbarButton
            active={activePanel === "presentations"}
            onClick={() => onPanelChange("presentations")}
            icon={<Presentation className="w-4 h-4" />}
            label="Presentations"
          />
          <ToolbarButton
            active={activePanel === "library"}
            onClick={() => onPanelChange("library")}
            icon={<Music className="w-4 h-4" />}
            label="Song Library"
          />
          <ToolbarButton
            active={activePanel === "settings"}
            onClick={() => onPanelChange("settings")}
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
          />
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-[#444]" />

        <button
          onClick={() => setShowNewPresDialog(true)}
          className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-hover-2 text-primary text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">New</span>
        </button>

        <button
          onClick={onOpenProject}
          title="Open project (.opres)"
          className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-hover-2 text-primary text-sm transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden lg:inline">Open</span>
        </button>

        <button
          onClick={onSaveProject}
          title="Save project (.opres)"
          className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-hover-2 text-primary text-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="hidden lg:inline">Save</span>
        </button>

        {(projectFileName || currentPresentationName) && (
          <div className="flex items-center gap-2 ml-2 min-w-0">
            <span className="text-muted text-sm">|</span>
            <span className="text-primary text-sm font-medium truncate max-w-48">
              {projectFileName || currentPresentationName}
            </span>
            {dirty && (
              <span
                title="Có thay đổi chưa lưu"
                className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"
              />
            )}
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="no-drag w-8 h-8 flex items-center justify-center rounded bg-surface hover:bg-hover-2 text-muted hover:text-primary transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleOutput}
          className={`no-drag flex items-center gap-2 px-4 py-1.5 rounded font-medium text-sm transition-all ${
            outputEnabled
              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
              : "bg-surface hover:bg-surface text-primary border border-app"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${outputEnabled ? "bg-white animate-pulse" : "bg-gray-400 dark:bg-[#666]"}`}
          />
          <span>Output</span>
        </button>
      </div>

      {showNewPresDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-in">
          <div className="bg-panel rounded-xl border border-app p-6 w-96 shadow-2xl modal-in">
            <h2 className="text-primary font-semibold text-lg mb-4">
              New Presentation
            </h2>
            <input
              autoFocus
              type="text"
              value={newPresName}
              onChange={(e) => setNewPresName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowNewPresDialog(false);
              }}
              placeholder="Presentation name..."
              className="input-base w-full px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewPresDialog(false)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
