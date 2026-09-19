import type { MediaItem, SlideBackground } from '../types'

// Served by the main process "media://" protocol, so every window can show local files.
export const mediaUrl = (path: string) => `media://local/${encodeURIComponent(path)}`

export const pickMediaFiles = (imagesOnly = false) => window.api.files.pickMedia(imagesOnly)

export function mediaBackground(item: MediaItem): SlideBackground {
  return item.type === 'video'
    ? { type: 'video', url: mediaUrl(item.path), loop: true, muted: true }
    : { type: 'image', url: mediaUrl(item.path), fit: 'cover' }
}
