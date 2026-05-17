import { Song } from '../../types'

export const SECTION_COLORS: Record<Song['slides'][0]['sectionType'], string> = {
  verse:        'section-verse',
  chorus:       'section-chorus',
  bridge:       'section-bridge',
  'pre-chorus': 'section-pre-chorus',
  intro:        'section-intro',
  outro:        'section-outro',
  tag:          'section-tag'
}

export const SECTION_DOT_COLORS: Record<Song['slides'][0]['sectionType'], string> = {
  verse:        'bg-blue-500',
  chorus:       'bg-orange-500',
  bridge:       'bg-purple-500',
  'pre-chorus': 'bg-green-500',
  intro:        'bg-teal-500',
  outro:        'bg-rose-500',
  tag:          'bg-pink-500'
}

export const CATEGORY_LABELS: Record<Song['category'], string> = {
  'thanh-ca':      'Thánh Ca',
  'biet-thanh-ca': 'Biệt Thánh Ca',
  'tvchh':         'TVCHH',
  'custom':        'Khác'
}

export const CATEGORY_BADGE: Record<Song['category'], string> = {
  'thanh-ca':      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40',
  'biet-thanh-ca': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700/40',
  'tvchh':         'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40',
  'custom':        'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/40'
}

export const MARKDOWN_SYNTAX_GUIDE = `# Song Markdown Syntax Guide

## File Structure:
\`\`\`
# Song Title
## Author: Author Name
## Key: G

[Verse 1]
Line 1 of verse
Line 2 of verse

[Chorus]
Chorus line 1
Chorus line 2

[Bridge]
Bridge content
\`\`\`

## Section Types:
- \`[Verse 1]\`, \`[Verse 2]\` → Verse (🔵 blue)
- \`[Chorus]\` → Chorus (🟠 orange)
- \`[Bridge]\` → Bridge (🟣 purple)
- \`[Pre-Chorus]\` or \`[PC]\` → Pre-chorus (🟢 green)
- \`[Intro]\` → Intro (🩵 teal)
- \`[Outro]\` → Outro (🔴 rose)
- \`[Tag]\` → Tag (🩷 pink)
`
