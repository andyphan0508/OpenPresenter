// Read the text in an image with Claude (runs in the main process). `src` is a base64 data URL.
export async function ocrImage(apiKey: string, src: string): Promise<string> {
  const [, mediaType, data] = src.match(/^data:([^;]+);base64,(.*)$/) ?? []
  if (!data) throw new Error('Ảnh không hợp lệ')
  const res = await window.api.ocr.image(apiKey, mediaType, data)
  if (!res.ok) throw new Error(res.error)
  return res.text
}
