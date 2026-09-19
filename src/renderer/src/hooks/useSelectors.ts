import { useStore } from '../store'

export const useCurrentPresentation = () =>
  useStore((s) => s.presentations.find((p) => p.id === s.currentPresentationId))

export const useLiveSlide = () =>
  useStore((s) => s.presentations.find((p) => p.id === s.currentPresentationId)?.slides.find((sl) => sl.id === s.liveSlideId))

export const useCurrentSlide = () =>
  useStore((s) => s.presentations.find((p) => p.id === s.currentPresentationId)?.slides.find((sl) => sl.id === s.currentSlideId))

export const useSelectedSong = () => useStore((s) => s.songs.find((song) => song.id === s.selectedSongId))
