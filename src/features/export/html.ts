import type { JournalEntry } from '@/api/types'
import { formatLongDate } from '@/lib/dates'
import { entryTitle, writtenOn } from './markdown'

/** Text made safe for HTML. */
function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Plain paragraphs from text, keeping single line breaks. */
function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** The little Markdown AI feedback uses: paragraphs, **bold**, *italic* and "- " lists. */
function feedbackHtml(markdown: string): string {
  const inline = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
  return markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n')
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`
      return `<p>${lines.map(inline).join('<br>')}</p>`
    })
    .join('')
}

/**
 * A journal as a printable page, the same layout as the web app's print page: Literata, black on
 * white, each entry kept whole where it fits. expo-print turns it into a PDF.
 */
export function journalToHtml(entries: JournalEntry[], { includeFeedback }: { includeFeedback: boolean }, exportedAt: Date = new Date()): string {
  const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
  const body = entries
    .map((entry) => {
      const date = writtenOn(entry)
      const feedback = includeFeedback && entry.llmResponse?.trim() ? `<aside><h2>Feedback</h2>${feedbackHtml(entry.llmResponse)}</aside>` : ''
      return `<article><h1>${escape(entryTitle(entry))}</h1>${date ? `<p class="date">${escape(date)}</p>` : ''}<div class="text">${paragraphs(entry.content ?? '')}</div>${feedback}</article>`
    })
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Literata:opsz,wght@7..72,400;7..72,500&display=swap" rel="stylesheet">
<style>
  @page { margin: 22mm 20mm; }
  body { font-family: Literata, Georgia, serif; color: #000; background: #fff; font-size: 12pt; line-height: 1.6; }
  header { border-bottom: 1px solid #ccc; padding-bottom: 16pt; margin-bottom: 28pt; }
  header .title { font-size: 26pt; font-weight: 500; margin: 0; }
  header p, .date { font-family: Figtree, sans-serif; color: #555; font-size: 10pt; }
  article { break-inside: avoid; margin-bottom: 32pt; }
  h1 { font-size: 18pt; font-weight: 500; margin: 0 0 4pt; }
  .text p { margin: 0 0 8pt; }
  aside { margin-top: 12pt; padding-left: 12pt; border-left: 2px solid #999; font-family: Figtree, sans-serif; font-size: 10.5pt; }
  aside h2 { font-size: 10pt; text-transform: none; color: #555; margin: 0 0 4pt; }
</style></head><body>
<header><p class="title">One Percent journal</p><p>Exported ${escape(formatLongDate(exportedAt))}. ${count}.</p></header>
${body}
</body></html>`
}
