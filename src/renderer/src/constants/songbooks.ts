// Well-known Vietnamese hymnals. Songs may also use any other book name.
export const SONGBOOKS = [
  { name: 'Thánh Ca', short: 'TC' },
  { name: 'Biệt Thánh Ca', short: 'BTC' },
  { name: 'Tôn Vinh Chúa Hằng Hữu', short: 'TVCHH' }
] as const

export const OTHER_SONGBOOK = 'Khác'

// Old app versions stored a single `category` slug instead of songbooks.
export const LEGACY_CATEGORY_TO_BOOK: Record<string, string> = {
  'thanh-ca': 'Thánh Ca',
  'biet-thanh-ca': 'Biệt Thánh Ca',
  tvchh: 'Tôn Vinh Chúa Hằng Hữu'
}

export const songbookShort = (book: string) => SONGBOOKS.find((b) => b.name === book)?.short ?? book
