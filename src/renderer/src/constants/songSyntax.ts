export const NEW_SONG_TEMPLATE = `# Tên bài hát
## Author: Tác giả
## Key: G
## Songbook: Thánh Ca 1
## Order: Verse 1, Chorus, Verse 2, Chorus

[Verse 1]
Lời khúc 1…

[Chorus]
Lời điệp khúc…

[Verse 2]
Lời khúc 2…
`

// Short reference shown next to the song editor.
export const SYNTAX_HELP: [string, string][] = [
  ['# Tên bài', 'Tiêu đề'],
  ['## Author: …', 'Tác giả'],
  ['## Key: G', 'Giọng'],
  ['## Songbook: Thánh Ca 123', 'Sách & số bài (có thể nhiều dòng)'],
  ['## Copyright: …  /  ## CCLI: …', 'Bản quyền'],
  ['## Order: Verse 1, Chorus, …', 'Thứ tự hát — mỗi đoạn chỉ viết một lần'],
  ['[Verse 1]  [Chorus]  [Bridge]', 'Tên đoạn (cũng nhận: Điệp khúc, Câu nối, Intro, Tag…)'],
  ['---', 'Dòng này tách lời dịch (song ngữ) phía dưới']
]
