import Anthropic from '@anthropic-ai/sdk'
import { ipcMain } from 'electron'

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type MediaType = (typeof MEDIA_TYPES)[number]

const PROMPT = `Chép lại nguyên văn toàn bộ chữ trong ảnh (thường là lời bài hát, câu Kinh Thánh hoặc thông báo của hội thánh).
- Giữ đúng dấu tiếng Việt và xuống dòng như trong ảnh.
- Mỗi khổ / đoạn cách nhau đúng một dòng trống.
- Bỏ số trang, tiêu đề đầu/chân trang, hợp âm và ký hiệu nhạc.
- Chỉ trả về phần chữ, không giải thích.`

// OCR runs in main so the API key never reaches page scripts. Key: from settings, else the SDK's env/profile lookup.
export function registerOcrIpc(): void {
  ipcMain.handle('ocr:image', async (_e, apiKey: string, mediaType: MediaType, data: string) => {
    try {
      if (!MEDIA_TYPES.includes(mediaType)) throw new Error('Định dạng ảnh không hỗ trợ')
      const client = new Anthropic({ apiKey: apiKey || undefined })
      const res = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
              { type: 'text', text: PROMPT }
            ]
          }
        ]
      })
      if (res.stop_reason === 'refusal') throw new Error('AI từ chối đọc ảnh này')
      const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
      return { ok: true, text }
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: 'API key không hợp lệ' }
      if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'Gọi quá nhiều, thử lại sau ít phút' }
      if (e instanceof Anthropic.APIConnectionError) return { ok: false, error: 'Không kết nối được máy chủ AI' }
      return { ok: false, error: (e as Error).message }
    }
  })
}
