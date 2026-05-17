import React from 'react'
import { Song } from '../../types'
import { CATEGORY_LABELS, CATEGORY_BADGE, SECTION_DOT_COLORS } from './constants'

type CategoryFilter = 'all' | Song['category']

interface SongListProps {
  songs: Song[]
  selectedSongId: string | null
  activeCategory: CategoryFilter
  searchQuery: string
  onSelectSong: (id: string) => void
  onSearchChange: (q: string) => void
  onCategoryChange: (cat: CategoryFilter) => void
  onAddSong: () => void
  onShowSyntaxGuide: () => void
}

const CATEGORIES: Array<{ key: CategoryFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'thanh-ca', label: 'Thánh Ca' },
  { key: 'biet-thanh-ca', label: 'Biệt Thánh Ca' },
  { key: 'tvchh', label: 'TVCHH' },
  { key: 'custom', label: 'Khác' }
]

export function SongList({
  songs,
  selectedSongId,
  activeCategory,
  searchQuery,
  onSelectSong,
  onSearchChange,
  onCategoryChange,
  onAddSong,
  onShowSyntaxGuide
}: SongListProps) {
  return (
    <div className="w-72 flex flex-col border-r border-app bg-app flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-app">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-primary font-semibold text-sm">Song Library</h2>
          <div className="flex gap-1">
            <button
              onClick={onShowSyntaxGuide}
              title="Syntax Guide"
              className="text-muted hover:text-primary text-xs px-1.5 py-0.5 rounded bg-hover transition-colors"
            >
              ?
            </button>
            <button
              onClick={onAddSong}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search songs..."
          className="input-base w-full px-3 py-1.5 text-xs mb-2"
        />

        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={`px-2 py-0.5 rounded-full text-xs transition-colors border ${
                activeCategory === key
                  ? key === 'all'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700/40 font-medium'
                  : 'bg-transparent text-muted border-transparent hover:border-app hover:text-primary'
              }`}
            >
              {label}
              <span className="ml-1 text-[9px] text-faint">
                {key === 'all' ? songs.length : songs.filter((s) => s.category === key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {songs.length === 0 ? (
          <div className="p-4 text-center text-muted text-sm">
            {searchQuery ? 'No songs found' : 'No songs yet'}
          </div>
        ) : (
          songs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className={`p-3 cursor-pointer border-b border-app transition-colors ${
                selectedSongId === song.id
                  ? 'bg-orange-500/10 border-l-2 border-l-orange-500'
                  : 'hover:bg-gray-50 dark:hover:bg-[#252525]'
              }`}
            >
              <p className="text-primary text-sm font-medium truncate">{song.title}</p>
              {song.author && <p className="text-muted text-xs truncate">{song.author}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_BADGE[song.category]}`}>
                  {CATEGORY_LABELS[song.category]}
                </span>
                {song.key && <span className="text-xs text-muted">Key: {song.key}</span>}
                <div className="flex gap-0.5">
                  {[...new Set((song.slides ?? []).map((s) => s.sectionType))].map((type) => (
                    <div
                      key={type}
                      className={`w-2 h-2 rounded-full ${SECTION_DOT_COLORS[type]}`}
                      title={type}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
