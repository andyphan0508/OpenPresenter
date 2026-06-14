import React, { useState, useMemo } from "react";
import { Music } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Song, SongSlide } from "../../types";
import { SongList } from "./SongList";
import { SongDetail } from "./SongDetail";
import { NewSongDialog } from "./NewSongDialog";
import { SyntaxGuideModal } from "./SyntaxGuideModal";

export function LibraryPanel() {
  const {
    songs,
    currentPresentationId,
    selectedSongId,
    updateSong,
    updateSongFromMarkdown,
    deleteSong,
    importSongFromMarkdown,
    addSlidesFromSong,
    setSelectedSong,
    getCurrentPresentation,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | Song["category"]
  >("all");
  const [showNewSongDialog, setShowNewSongDialog] = useState(false);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [newSongCategory, setNewSongCategory] =
    useState<Song["category"]>("thanh-ca");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEditContent, setSectionEditContent] = useState("");

  const pres = getCurrentPresentation();
  const selectedSong = songs.find((s) => s.id === selectedSongId);

  const filteredSongs = useMemo(
    () =>
      songs.filter((song) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          song.title.toLowerCase().includes(q) ||
          song.author?.toLowerCase().includes(q) ||
          (song.tags ?? []).some((t) => t.toLowerCase().includes(q));
        const matchesCategory =
          activeCategory === "all" || song.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [songs, searchQuery, activeCategory],
  );

  // ── Handlers ──────────────────────────────────────────────────────

  const handleImportSong = (markdown: string, addToPresentation: boolean) => {
    if (!markdown.trim()) return;
    const newId = importSongFromMarkdown(markdown, newSongCategory);
    // Optionally push the freshly imported song straight onto the current presentation.
    if (addToPresentation && currentPresentationId) {
      const song = useStore.getState().songs.find((s) => s.id === newId);
      if (song) addSlidesFromSong(currentPresentationId, song);
    }
    setShowNewSongDialog(false);
    setSelectedSong(newId);
    setIsEditingMarkdown(false);
    setEditingSectionId(null);
  };

  const handleAddToPresentation = (song: Song) => {
    if (!currentPresentationId) return;
    addSlidesFromSong(currentPresentationId, song);
  };

  const handleSectionAddToPres = (song: Song, sectionId: string) => {
    if (!currentPresentationId) return;
    const section = (song.slides ?? []).find((s) => s.id === sectionId);
    if (!section) return;
    addSlidesFromSong(currentPresentationId, { ...song, slides: [section] });
  };

  const handleSectionSave = (song: Song, sectionId: string) => {
    const newSlides = (song.slides ?? []).map((s) =>
      s.id === sectionId ? { ...s, content: sectionEditContent } : s,
    );
    updateSong(song.id, { slides: newSlides });
    setEditingSectionId(null);
  };

  const handleSectionDelete = (song: Song, sectionId: string) => {
    updateSong(song.id, {
      slides: (song.slides ?? []).filter((s) => s.id !== sectionId),
    });
  };

  const handleSectionMove = (song: Song, sectionId: string, dir: -1 | 1) => {
    const slides = [...(song.slides ?? [])];
    const idx = slides.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    [slides[idx], slides[target]] = [slides[target], slides[idx]];
    updateSong(song.id, { slides });
  };

  const handleAddSection = (song: Song, newSection: SongSlide) => {
    updateSong(song.id, { slides: [...(song.slides ?? []), newSection] });
    setEditingSectionId(newSection.id);
    setSectionEditContent("");
  };

  const handleDeleteSong = (song: Song) => {
    if (confirm(`Delete "${song.title}"?`)) {
      deleteSong(song.id);
      setSelectedSong(null);
    }
  };

  const handleSaveMarkdown = (song: Song) => {
    updateSongFromMarkdown(song.id, markdownContent);
    setIsEditingMarkdown(false);
  };

  const handleEditMarkdown = (song: Song) => {
    setIsEditingMarkdown(true);
    setMarkdownContent(song.rawMarkdown);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <SongList
        songs={filteredSongs}
        selectedSongId={selectedSongId}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        onSelectSong={(id) => {
          setSelectedSong(id);
          setIsEditingMarkdown(false);
          setEditingSectionId(null);
        }}
        onSearchChange={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onAddSong={() => setShowNewSongDialog(true)}
        onShowSyntaxGuide={() => setShowSyntaxGuide(true)}
      />

      {selectedSong ? (
        <SongDetail
          song={selectedSong}
          hasPres={!!pres}
          isEditingMarkdown={isEditingMarkdown}
          markdownContent={markdownContent}
          editingSectionId={editingSectionId}
          sectionEditContent={sectionEditContent}
          onAddToPresentation={() => handleAddToPresentation(selectedSong)}
          onEditMarkdown={() => handleEditMarkdown(selectedSong)}
          onDeleteSong={() => handleDeleteSong(selectedSong)}
          onSaveMarkdown={() => handleSaveMarkdown(selectedSong)}
          onCancelMarkdownEdit={() => setIsEditingMarkdown(false)}
          onMarkdownChange={setMarkdownContent}
          onSectionEditStart={(id, content) => {
            setEditingSectionId(id);
            setSectionEditContent(content);
          }}
          onSectionSave={(sectionId) =>
            handleSectionSave(selectedSong, sectionId)
          }
          onSectionCancel={() => setEditingSectionId(null)}
          onSectionDelete={(sectionId) =>
            handleSectionDelete(selectedSong, sectionId)
          }
          onSectionMove={(sectionId, dir) =>
            handleSectionMove(selectedSong, sectionId, dir)
          }
          onSectionAddToPres={(sectionId) =>
            handleSectionAddToPres(selectedSong, sectionId)
          }
          onAddSection={(section) => handleAddSection(selectedSong, section)}
          onShowSyntaxGuide={() => setShowSyntaxGuide(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-app">
          <div className="text-center">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-20 text-muted" />
            <p className="text-muted text-sm">Select a song to view</p>
            <p className="text-faint text-xs mt-1">
              or add a new song to the library
            </p>
          </div>
        </div>
      )}

      <NewSongDialog
        open={showNewSongDialog}
        category={newSongCategory}
        hasPres={!!pres}
        onClose={() => setShowNewSongDialog(false)}
        onCategoryChange={setNewSongCategory}
        onImport={handleImportSong}
        onShowSyntaxGuide={() => setShowSyntaxGuide(true)}
      />

      <SyntaxGuideModal
        open={showSyntaxGuide}
        onClose={() => setShowSyntaxGuide(false)}
      />
    </div>
  );
}
