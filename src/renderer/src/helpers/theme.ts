import type { Slide, Theme } from '../types'

// The slide as it should be drawn: a linked theme supplies background + first text block style/box.
export function resolveSlide(slide: Slide, themes: Theme[]): Slide {
  const theme = slide.themeId ? themes.find((t) => t.id === slide.themeId) : undefined
  if (!theme) return slide
  const [first, ...rest] = slide.textBlocks
  return {
    ...slide,
    background: theme.background,
    textBlocks: first ? [{ ...first, ...theme.text, ...theme.box }, ...rest] : rest
  }
}

// Unlink from the theme, keeping the current look as the slide's own style (before manual editing).
export function detachTheme(slide: Slide, themes: Theme[]): Slide {
  return { ...resolveSlide(slide, themes), themeId: undefined }
}

export const translationStyle = (slide: Slide, themes: Theme[]) =>
  themes.find((t) => t.id === slide.themeId)?.translation ?? { color: '#fde68a', scale: 0.7 }
