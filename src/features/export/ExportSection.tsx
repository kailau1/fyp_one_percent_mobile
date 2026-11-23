import { useMutation } from '@tanstack/react-query'
import { File, Paths } from 'expo-file-system'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { FileText, Share2 } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Text } from '@/components/ui/Text'
import { toast } from '@/components/ui/Toast'
import { fetchAllEntries } from './api'
import { journalToHtml } from './html'
import { journalFileName, journalToMarkdown } from './markdown'

type Format = 'markdown' | 'pdf'

/** Writes the export to a file and opens the phone's share sheet (save to Files, email it, and so on). */
async function exportJournal(format: Format, includeFeedback: boolean): Promise<number> {
  const entries = await fetchAllEntries()
  if (entries.length === 0) return 0
  if (format === 'markdown') {
    const file = new File(Paths.cache, journalFileName())
    if (file.exists) file.delete()
    file.create()
    await file.write(journalToMarkdown(entries, { includeFeedback }))
    await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', dialogTitle: 'Your One Percent journal', UTI: 'net.daringfireball.markdown' })
  } else {
    const { uri } = await Print.printToFileAsync({ html: journalToHtml(entries, { includeFeedback }) })
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Your One Percent journal', UTI: 'com.adobe.pdf' })
  }
  return entries.length
}

/** "Your journal": every entry as one Markdown file or a PDF, shared through the phone (the web downloads). */
export function ExportSection() {
  const [includeFeedback, setIncludeFeedback] = useState(true)
  const run = useMutation({
    mutationFn: (format: Format) => exportJournal(format, includeFeedback),
    onSuccess: (count) => {
      if (count === 0) toast('There are no entries to export yet.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <View accessibilityLabel="Your journal" style={{ gap: 12 }}>
      <Text variant="heading" role="heading" aria-level={2}>
        Your journal
      </Text>
      <Text tone="muted">Keep a copy of everything you’ve written, as a Markdown file or a PDF.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Switch value={includeFeedback} onValueChange={setIncludeFeedback} label="Include AI feedback" />
        <Text>Include AI feedback</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Button variant="secondary" icon={Share2} onPress={() => run.mutate('markdown')} loading={run.isPending && run.variables === 'markdown'} disabled={run.isPending}>
          Markdown file
        </Button>
        <Button variant="secondary" icon={FileText} onPress={() => run.mutate('pdf')} loading={run.isPending && run.variables === 'pdf'} disabled={run.isPending}>
          PDF
        </Button>
      </View>
    </View>
  )
}
