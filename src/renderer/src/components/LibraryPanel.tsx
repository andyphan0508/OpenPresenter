import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Song } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

[Verse 2]
Second verse content
\`\`\`

## Section Types:
- \`[Verse 1]\`, \`[Verse 2]\` → Verse sections
- \`[Chorus]\` → Chorus
- \`[Bridge]\` → Bridge
- \`[Pre-Chorus]\` → Pre-chorus
- \`[Intro]\` → Intro
- \`[Outro]\` → Outro
- \`[Tag]\` → Tag

## Tips:
- Use blank lines between sections
- Sections become individual slides in presentation
- Content within a section = slide text
`

export function LibraryPanel() {
  const {
    songs,
    currentPresentationId,
    selectedSongId,
    addSong,
    updateSong,
    deleteSong,
    importSongFromMarkdown,
    addSlidesFromSong,
    setSelectedSong,
    getCurrentPresentation
  } = useStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | Song['category']>('all')
  const [showNewSongDialog, setShowNewSongDialog] = useState(false)
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [markdownContent, setMarkdownContent] = useState('')
  const [newSongCategory, setNewSongCategory] = useState<Song['category']>('thanh-ca')

  const pres = getCurrentPresentation()

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        !searchQuery ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'all' || song.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [songs, searchQuery, activeCategory])

  const selectedSong = songs.find((s) => s.id === selectedSongId)

  const handleImportSong = () => {
    if (!markdownContent.trim()) return
    importSongFromMarkdown(markdownContent, newSongCategory)
    setMarkdownContent('')
    setShowNewSongDialog(false)
  }

  const handleAddToPresentation = (song: Song) => {
    if (!currentPresentationId) return
    addSlidesFromSong(currentPresentationId, song)
  }

  const handleSaveSong = (song: Song) => {
    updateSong(song.id, {
      rawMarkdown: markdownContent,
      ...parseMarkdownMeta(markdownContent)
    })
    setEditingSong(null)
  }

  const parseMarkdownMeta = (md: string) => {
    const lines = md.split('\n')
    let title = ''
    let author = ''
    for (const line of lines) {
      if (line.startsWith('# ')) title = line.slice(2).trim()
      if (line.startsWith('## Author:')) author = line.slice(10).trim()
    }
    return { title: title || 'Untitled', author }
  }

  const categoryColors: Record<string, string> = {
    'thanh-ca': 'text-blue-400',
    'biet-thanh-ca': 'text-purple-400',
    custom: 'text-green-400'
  }

  const categoryLabels: Record<string, string> = {
    'thanh-ca': 'Thánh Ca',
    'biet-thanh-ca': 'Biệt Thánh Ca',
    custom: 'Custom'
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Song list */}
      <div className="w-72 flex flex-col border-r border-[#2a2a2a] bg-[#1a1a1a]">
        {/* Header */}
        <div className="p-3 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold text-sm">Song Library</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setShowSyntaxGuide(true)}
                title="Markdown Syntax Guide"
                className="text-[#666] hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-[#2a2a2a]"
              >
                ?
              </button>
              <button
                onClick={() => setShowNewSongDialog(true)}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-white text-xs placeholder-[#555] focus:border-orange-500 outline-none"
          />

          {/* Category filter */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {(['all', 'thanh-ca', 'biet-thanh-ca', 'custom'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#2a2a2a] text-[#666] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Song list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <div className="p-4 text-center text-[#555] text-sm">
              {searchQuery ? 'No songs found' : 'No songs yet'}
            </div>
          ) : (
            filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => setSelectedSong(song.id)}
                className={`p-3 cursor-pointer border-b border-[#1f1f1f] transition-colors group ${
                  selectedSongId === song.id
                    ? 'bg-orange-500/10 border-l-2 border-l-orange-500'
                    : 'hover:bg-[#222]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{song.title}</p>
                    {song.author && (
                      <p className="text-[#666] text-xs truncate">{song.author}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${categoryColors[song.category]}`}>
                        {categoryLabels[song.category]}
                      </span>
                      {song.key && (
                        <span className="text-xs text-[#555]">Key: {song.key}</span>
                      )}
                      <span className="text-xs text-[#555]">{song.slides.length} slides</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Song detail / editor */}
      {selectedSong ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Song header */}
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">{selectedSong.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                {selectedSong.author && (
                  <span className="text-[#888] text-sm">{selectedSong.author}</span>
                )}
                <span className={`text-xs ${categoryColors[selectedSong.category]}`}>
                  {categoryLabels[selectedSong.category]}
                </span>
                {selectedSong.key && (
                  <span className="text-xs text-[#666]">Key: {selectedSong.key}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {pres && (
                <button
                  onClick={() => handleAddToPresentation(selectedSong)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors font-medium"
                >
                  <span>+</span>
                  <span>Add to Presentation</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingSong(selectedSong)
                  setMarkdownContent(selectedSong.rawMarkdown)
                }}
                className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm rounded transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${selectedSong.title}"?`)) {
                    deleteSong(selectedSong.id)
                    setSelectedSong(null)
                  }
                }}
                className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-red-700 text-[#888] hover:text-white text-sm rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Song slides preview */}
          {editingSong?.id === selectedSong.id ? (
            <div className="flex-1 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[#888] text-xs">Edit Markdown</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSyntaxGuide(true)}
                    className="text-xs text-[#666] hover:text-white"
                  >
                    Syntax Guide
                  </button>
                  <button
                    onClick={() => setEditingSong(null)}
                    className="text-xs text-[#666] hover:text-white px-2 py-1 rounded bg-[#2a2a2a]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveSong(selectedSong)}
                    className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                  >
                    Save
                  </button>
                </div>
              </div>
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-sm font-mono resize-none focus:border-orange-500 outline-none"
                placeholder="Enter song in markdown format..."
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {selectedSong.slides.map((slide, idx) => (
                  <div key={slide.id} className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-orange-400 uppercase tracking-wide">
                        {slide.sectionLabel}
                      </span>
                      <span className="text-xs text-[#555]">#{idx + 1}</span>
                    </div>
                    <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">
                      {slide.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-20">🎵</div>
            <p className="text-[#555] text-sm">Select a song to view details</p>
            <p className="text-[#444] text-xs mt-1">or add a new song to the library</p>
          </div>
        </div>
      )}

      {/* New Song Dialog */}
      {showNewSongDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1e1e1e] rounded-xl border border-[#444] p-6 w-[700px] h-[600px] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Import Song from Markdown</h2>
              <button
                onClick={() => setShowSyntaxGuide(true)}
                className="text-xs text-[#666] hover:text-orange-400"
              >
                Syntax Guide
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs text-[#888] block mb-1">Category</label>
              <div className="flex gap-2">
                {(['thanh-ca', 'biet-thanh-ca', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewSongCategory(cat)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      newSongCategory === cat
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#2a2a2a] text-[#888] hover:bg-[#333]'
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              autoFocus
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder={`# Song Title\n## Author: Author Name\n## Key: G\n\n[Verse 1]\nLyrics here...\n\n[Chorus]\nChorus lyrics...`}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm font-mono resize-none focus:border-orange-500 outline-none mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNewSongDialog(false); setMarkdownContent('') }}
                className="px-4 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSong}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
              >
                Import Song
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Syntax Guide Modal */}
      {showSyntaxGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1e1e1e] rounded-xl border border-[#444] p-6 w-[600px] max-h-[80vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Markdown Syntax Guide</h2>
              <button
                onClick={() => setShowSyntaxGuide(false)}
                className="text-[#888] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto prose prose-invert prose-sm max-w-none text-[#ccc]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{MARKDOWN_SYNTAX_GUIDE}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
