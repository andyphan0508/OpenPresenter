export const FILTERS = {
  openLyrics: [{ name: 'OpenLyrics', extensions: ['xml'] }],
  songMarkdown: [{ name: 'Bài hát (Markdown)', extensions: ['md', 'txt'] }],
  songIndex: [{ name: 'Kho bài hát (JSON)', extensions: ['json'] }]
}

export const openTextFiles = (filters: { name: string; extensions: string[] }[], multiple = false) =>
  window.api.files.openText(filters, multiple)

export const saveTextFile = (defaultName: string, content: string, filters: { name: string; extensions: string[] }[]) =>
  window.api.files.saveText(defaultName, content, filters)
