import type { Slide, SlideGroup } from '../types'

// Service order: consecutive slides sharing a group form one item; ungrouped slides stand alone.
export interface ServiceItem {
  key: string
  group?: SlideGroup
  slides: Slide[]
}

export function serviceItems(slides: Slide[]): ServiceItem[] {
  const items: ServiceItem[] = []
  for (const slide of slides) {
    const last = items[items.length - 1]
    if (slide.group && last?.group?.id === slide.group.id) last.slides.push(slide)
    else items.push({ key: slide.group?.id ?? slide.id, group: slide.group, slides: [slide] })
  }
  return items
}

export function moveItem(slides: Slide[], key: string, dir: -1 | 1): Slide[] {
  const items = serviceItems(slides)
  const idx = items.findIndex((i) => i.key === key)
  const target = idx + dir
  if (idx < 0 || target < 0 || target >= items.length) return slides
  ;[items[idx], items[target]] = [items[target], items[idx]]
  return items.flatMap((i) => i.slides)
}

export const removeItem = (slides: Slide[], key: string) =>
  serviceItems(slides).filter((i) => i.key !== key).flatMap((i) => i.slides)

export const itemOfSlide = (slides: Slide[], slideId: string) =>
  serviceItems(slides).find((i) => i.slides.some((s) => s.id === slideId))
