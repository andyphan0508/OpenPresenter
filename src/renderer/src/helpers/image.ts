const MAX_SIDE = 2000 // plenty for OCR; keeps phone photos far under the API's 5 MB image limit

// Load an image file and re-encode it as a JPEG data URL no larger than MAX_SIDE px.
export async function downscaleImage(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff' // transparent PNGs → white, not black, behind the text
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.9)
}

// Blank-line separated paragraphs → one slide each.
export const splitSlides = (text: string) =>
  text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
