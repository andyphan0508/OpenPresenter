import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Song } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Color mapping per section type
const SECTION_COLORS: Record<Song['slides'][0]['sectionType'], string> = {
  verse:       'section-verse',
  chorus:      'section-chorus',
  bridge:      'section-bridge',
  'pre-chorus':'section-pre-chorus',
  intro:       'section-intro',
  outro:       'section-outro',
  tag:         'section-tag'
}

const SECTION_DOT_COLORS: Record<Song['slides'][0]['sectionType'], string> = {
  verse:       'bg-blue-500',
  chorus:      'bg-orange-500',
  bridge:      'bg-purple-500',
  'pre-chorus':'bg-green-500',
  intro:       'bg-teal-500',
  outro:       'bg-rose-500',
  tag:         'bg-pink-500'
}

const CATEGORY_LABELS: Record<Song['category'], string> = {
  'thanh-ca':      'Thánh Ca',
  'biet-thanh-ca': 'Biệt Thánh Ca',
  custom:          'Custom'
}

const CATEGORY_COLORS: Record<Song['category'], string> = {
  'thanh-ca':      'text-blue-500',
  'biet-thanh-ca': 'text-purple-500',
  custom:          'text-green-500'
}

const MARKDOWN_SYNTAX_GUIDE = `# Song Markdown Syntax Guide

## File Structure:
\`\`\`
# Song Title
## Author: Author Name
## Key: G

[Verse 1]
Line 1 of verse
Line 2 of verse

[Chorus]
Chorus line 1
Chorus line 2

[Bridge]
Bridge content
\`\`\`

## Section Types:
- \`[Verse 1]\`, \`[Verse 2]\` → Verse (🔵 blue)
- \`[Chorus]\` → Chorus (🟠 orange)
- \`[Bridge]\` → Bridge (🟣 purple)
- \`[Pre-Chorus]\` or \`[PC]\` → Pre-chorus (🟢 green)
- \`[Intro]\` → Intro (🩵 teal)
- \`[Outro]\` → Outro (🔴 rose)
- \`[Tag]\` → Tag (🩷 pink)
`

export function LibraryPanel() {
  const {
    songs, currentPresentationId, selectedSongId,
    addSong, updateSong, deleteSong, importSongFromMarkdown,
    addSlidesFromSong, setSelectedSong, getCurrentPresentation
  } = useStore()

  const [searchQuery, setSearchQuery]     = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | Song['category']>('all')
  const [showNewSongDialog, setShowNewSongDialog] = useState(false)
  const [showSyntaxGuide, setShowSyntaxGuide]     = useState(false)
  const [editingSong, setEditingSong]     = useState<Song | null>(null)
  const [markdownContent, setMarkdownContent] = useState('')
  const [newSongCategory, setNewSongCategory] = useState<Song['category']>('thanh-ca')
  // Which section is being inline-edited
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionEditContent, setSectionEditContent] = useState('')

  const pres = getCurrentPresentation()
  const selectedSong = songs.find((s) => s.id === selectedSongId)

  const filteredSongs = useMemo(() => songs.filter((song) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      song.title.toLowerCase().includes(q) ||
      (song.author?.toLowerCase().includes(q)) ||
      song.tags.some((t) => t.toLowerCase().includes(q))
    const matchesCategory = activeCategory === 'all' || song.category === activeCategory
    return matchesSearch && matchesCategory
  }), [songs, searchQuery, activeCategory])

  // ─── Actions ───────────────────────────────────────────────
  const handleImportSong = () => {
    if (!markdownContent.trim()) return
    const id = importSongFromMarkdown(markdownContent, newSongCategory)
    setMarkdownContent('')
    setShowNewSongDialog(false)
    setSelectedSong(id)
  }

  const handleAddToPresentation = (song: Song) => {
    if (!currentPresentationId) return
    addSlidesFromSong(currentPresentationId, song)
  }

  const handleAddSectionToPresentation = (song: Song, sectionId: string) => {
    if (!currentPresentationId) return
    const section = song.slides.find((s) => s.id === sectionId)
    if (!section) return
    // Create a mini-song with only this section
    addSlidesFromSong(currentPresentationId, { ...song, slides: [section] })
  }

  const startEditingSection = (sectionId: string, content: string) => {
    setEditingSectionId(sectionId)
    setSectionEditContent(content)
  }

  const saveSection = (song: Song, sectionId: string) => {
    const newSlides = song.slides.map((s) =>
      s.id === sectionId ? { ...s, content: sectionEditContent } : s
    )
    updateSong(song.id, { slides: newSlides })
    setEditingSectionId(null)
  }

  const deleteSection = (song: Song, sectionId: string) => {
    updateSong(song.id, { slides: song.slides.filter((s) => s.id !== sectionId) })
  }

  const moveSection = (song: Song, sectionId: string, dir: -1 | 1) => {
    const idx = song.slides.findIndex((s) => s.id === sectionId)
    if (idx < 0) return
    const slides = [...song.slides]
    const target = idx + dir
    if (target < 0 || target >= slides.length) return
    ;[slides[idx], slides[target]] = [slides[target], slides[idx]]
    updateSong(song.id, { slides })
  }

  const parseMarkdownMeta = (md: string) => {
    const lines = md.split('\n')
    let title = '', author = ''
    for (const line of lines) {
      if (line.startsWith('# ')) title = line.slice(2).trim()
      if (line.startsWith('## Author:')) author = line.slice(10).trim()
    }
    return { title: title || 'Untitled', author }
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Song list ── */}
      <div className="w-72 flex flex-col border-r border-app bg-app flex-shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-app">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-primary font-semibold text-sm">Song Library</h2>
            <div className="flex gap-1">
              <button onClick={() => setShowSyntaxGuide(true)} title="Syntax Guide"
                className="text-muted hover:text-primary text-xs px-1.5 py-0.5 rounded bg-hover transition-colors">
                ?
              </button>
              <button onClick={() => setShowNewSongDialog(true)}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors">
                + Add
              </button>
            </div>
          </div>

          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="input-base w-full px-3 py-1.5 text-xs mb-2" />

          <div className="flex gap-1 flex-wrap">
            {(['all', 'thanh-ca', 'biet-thanh-ca', 'custom'] as const).map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-surface text-muted hover:text-primary'
                }`}>
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Song list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <div className="p-4 text-center text-muted text-sm">
              {searchQuery ? 'No songs found' : 'No songs yet'}
            </div>
          ) : filteredSongs.map((song) => (
            <div key={song.id} onClick={() => setSelectedSong(song.id)}
              className={`p-3 cursor-pointer border-b border-app transition-colors group ${
                selectedSongId === song.id
                  ? 'bg-orange-500/10 border-l-2 border-l-orange-500'
                  : 'bg-hover'
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium truncate">{song.title}</p>
                  {song.author && <p className="text-muted text-xs truncate">{song.author}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-medium ${CATEGORY_COLORS[song.category]}`}>
                      {CATEGORY_LABELS[song.category]}
                    </span>
                    {song.key && <span className="text-xs text-muted">Key: {song.key}</span>}
                    {/* Section color dots */}
                    <div className="flex gap-0.5">
                      {[...new Set(song.slides.map((s) => s.sectionType))].map((type) => (
                        <div key={type} className={`w-2 h-2 rounded-full ${SECTION_DOT_COLORS[type]}`}
                          title={type} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Song detail ── */}
      {selectedSong ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-app">
          {/* Song header */}
          <div className="p-4 border-b border-app bg-panel flex items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h2 className="text-primary font-semibold text-lg">{selectedSong.title}</h2>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {selectedSong.author && <span className="text-secondary text-sm">{selectedSong.author}</span>}
                <span className={`text-xs font-medium ${CATEGORY_COLORS[selectedSong.category]}`}>
                  {CATEGORY_LABELS[selectedSong.category]}
                </span>
                {selectedSong.key && <span className="text-xs text-muted">Key: {selectedSong.key}</span>}
                <span className="text-xs text-faint">{selectedSong.slides.length} sections</span>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex gap-1.5 flex-shrink-0">
              {pres && (
                <button onClick={() => handleAddToPresentation(selectedSong)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors font-medium">
                  + All Slides
                </button>
              )}
              <button
                onClick={() => { setEditingSong(selectedSong); setMarkdownContent(selectedSong.rawMarkdown) }}
                className="px-3 py-1.5 bg-surface hover:bg-hover-2 text-primary text-sm rounded transition-colors"
                title="Edit full markdown">
                Edit MD
              </button>
              <button
                onClick={() => { if (confirm(`Delete "${selectedSong.title}"?`)) { deleteSong(selectedSong.id); setSelectedSong(null) } }}
                className="px-3 py-1.5 bg-surface hover:bg-red-500 hover:text-white text-muted text-sm rounded transition-colors"
                title="Delete song">
                Delete
              </button>
            </div>
          </div>

          {/* Sections list or markdown editor */}
          {editingSong?.id === selectedSong.id ? (
            /* Markdown full editor */
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
              <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Markdown Editor</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowSyntaxGuide(true)} className="text-xs text-muted hover:text-primary">Syntax Guide</button>
                  <button onClick={() => setEditingSong(null)}
                    className="text-xs text-muted hover:text-primary px-2 py-1 rounded bg-surface">Cancel</button>
                  <button
                    onClick={() => {
                      const meta = parseMarkdownMeta(markdownContent)
                      updateSong(selectedSong.id, { ...meta, rawMarkdown: markdownContent })
                      setEditingSong(null)
                    }}
                    className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">
                    Save
                  </button>
                </div>
              </div>
              <textarea value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)}
                className="flex-1 input-base px-3 py-2 text-sm font-mono resize-none"
                placeholder="Enter song in markdown format..." />
            </div>
          ) : (
            /* Color-coded section list */
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedSong.slides.map((section, idx) => {
                const colorClass = SECTION_COLORS[section.sectionType]
                const dotColor = SECTION_DOT_COLORS[section.sectionType]
                const isEditing = editingSectionId === section.id

                return (
                  <div key={section.id} className="card overflow-hidden">
                    {/* Section header bar */}
                    <div className={`flex items-center justify-between px-3 py-2 ${colorClass} rounded-t`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          {section.sectionLabel}
                        </span>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1">
                        {pres && (
                          <button
                            onClick={() => handleAddSectionToPresentation(selectedSong, section.id)}
                            className="px-2 py-0.5 text-[10px] font-medium bg-white/20 hover:bg-white/40 rounded transition-colors"
                            title="Add this section to presentation">
                            + Slide
                          </button>
                        )}
                        <button
                          onClick={() => moveSection(selectedSong, section.id, -1)}
                          disabled={idx === 0}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-[10px] disabled:opacity-30 transition-colors"
                          title="Move up">
                          ↑
                        </button>
                        <button
                          onClick={() => moveSection(selectedSong, section.id, 1)}
                          disabled={idx === selectedSong.slides.length - 1}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-[10px] disabled:opacity-30 transition-colors"
                          title="Move down">
                          ↓
                        </button>
                        <button
                          onClick={() => isEditing ? saveSection(selectedSong, section.id) : startEditingSection(section.id, section.content)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                            isEditing ? 'bg-white/40 hover:bg-white/60' : 'bg-white/20 hover:bg-white/40'
                          }`}
                          title={isEditing ? 'Save' : 'Edit'}>
                          {isEditing ? '✓ Save' : '✏ Edit'}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => setEditingSectionId(null)}
                            className="px-2 py-0.5 text-[10px] bg-white/20 hover:bg-white/40 rounded transition-colors">
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm('Delete this section?')) deleteSection(selectedSong, section.id) }}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/40 text-[10px] transition-colors"
                          title="Delete section">
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Section content */}
                    <div className="px-3 py-2 bg-panel">
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={sectionEditContent}
                          onChange={(e) => setSectionEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveSection(selectedSong, section.id)
                            if (e.key === 'Escape') setEditingSectionId(null)
                          }}
                          rows={Math.max(3, sectionEditContent.split('\n').length + 1)}
                          className="w-full input-base px-2 py-1.5 text-sm font-mono resize-none"
                          placeholder="Section lyrics..."
                        />
                      ) : (
                        <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                          {section.content || <span className="text-faint italic">Empty section</span>}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Add section button */}
              <button
                onClick={() => {
                  const { v4: uuidv4 } = require('uuid')
                  const newSection = {
                    id: uuidv4(),
                    sectionType: 'verse' as const,
                    sectionLabel: `Verse ${selectedSong.slides.filter(s => s.sectionType === 'verse').length + 1}`,
                    content: ''
                  }
                  updateSong(selectedSong.id, { slides: [...selectedSong.slides, newSection] })
                  setEditingSectionId(newSection.id)
                  setSectionEditContent('')
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-[#333] rounded-lg text-muted hover:text-orange-500 hover:border-orange-400 transition-colors text-sm">
                + Add Section
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-app">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">🎵</div>
            <p className="text-muted text-sm">Select a song to view</p>
            <p className="text-faint text-xs mt-1">or add a new song to the library</p>
          </div>
        </div>
      )}

      {/* ── New Song Dialog ── */}
      {showNewSongDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-panel rounded-xl border border-app p-6 w-[700px] h-[600px] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-primary font-semibold text-lg">Import Song from Markdown</h2>
              <button onClick={() => setShowSyntaxGuide(true)} className="text-xs text-muted hover:text-orange-500">
                Syntax Guide
              </button>
            </div>

            <div className="mb-3 flex-shrink-0">
              <div className="flex gap-2">
                {(['thanh-ca', 'biet-thanh-ca', 'custom'] as const).map((cat) => (
                  <button key={cat} onClick={() => setNewSongCategory(cat)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      newSongCategory === cat ? 'bg-orange-500 text-white' : 'bg-surface text-muted hover:text-primary'
                    }`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <textarea autoFocus value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder={`# Song Title\n## Author: Author Name\n## Key: G\n\n[Verse 1]\nLyrics here...\n\n[Chorus]\nChorus lyrics...`}
              className="flex-1 input-base px-3 py-2 text-sm font-mono resize-none mb-4" />

            <div className="flex gap-2 justify-end flex-shrink-0">
              <button onClick={() => { setShowNewSongDialog(false); setMarkdownContent('') }}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm">
                Cancel
              </button>
              <button onClick={handleImportSong}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium">
                Import Song
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Syntax Guide Modal ── */}
      {showSyntaxGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-panel rounded-xl border border-app p-6 w-[560px] max-h-[80vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-primary font-semibold text-lg">Markdown Syntax Guide</h2>
              <button onClick={() => setShowSyntaxGuide(false)} className="text-muted hover:text-primary">✕</button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
              {(Object.entries(SECTION_DOT_COLORS) as [Song['slides'][0]['sectionType'], string][]).map(([type, dot]) => (
                <span key={type} className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${SECTION_COLORS[type]}`}>
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {type}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{MARKDOWN_SYNTAX_GUIDE}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
