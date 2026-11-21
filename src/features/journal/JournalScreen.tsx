import { router } from 'expo-router'
import { Plus, Search } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, SectionList, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { JournalEntry } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { formatDay, formatMonth, parseDateTime } from '@/lib/dates'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts, gutter, radius } from '@/theme/tokens'
import { useEntryPages } from './hooks'

/** The first couple of lines of an entry, on one line. */
function excerpt(content: string): string {
  return content.replace(/\s+/g, ' ').trim().slice(0, 140)
}

/** Groups entries (already newest first) under "Month Year" headings, keeping their order. */
function groupByMonth(entries: JournalEntry[]): { title: string; data: JournalEntry[] }[] {
  const groups: { title: string; data: JournalEntry[] }[] = []
  for (const entry of entries) {
    const date = parseDateTime(entry.createdAt)
    const month = date ? formatMonth(date) : 'Undated'
    const last = groups[groups.length - 1]
    if (last?.title === month) last.data.push(entry)
    else groups.push({ title: month, data: [entry] })
  }
  return groups
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const { colors } = useTheme()
  const date = parseDateTime(entry.createdAt)
  const title = entry.title?.trim() || 'Untitled'
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.sunken }]}
    >
      <View style={styles.rowTop}>
        <Text serif weight="medium" numberOfLines={1} style={{ flex: 1, fontSize: 17, lineHeight: 24 }}>
          {title}
        </Text>
        {date && (
          <Text variant="small" tone="muted">
            {formatDay(date)}
          </Text>
        )}
      </View>
      <Text variant="small" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
        {excerpt(entry.content ?? '')}
      </Text>
    </Pressable>
  )
}

/**
 * The journal: entries newest first, grouped by month, searched on the server (so search covers
 * every entry, not just the ones loaded) and loaded a page at a time as you scroll.
 */
export function JournalScreen() {
  const { colors } = useTheme()
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim())
  const { data, error, isPending, refetch, isFetching, isRefetching, isFetchingNextPage, isPlaceholderData, hasNextPage, fetchNextPage } =
    useEntryPages(search)

  // If the journal changed between page loads, pages can overlap by an entry: show each once.
  const entries = useMemo(
    () => data && [...new Map(data.pages.flatMap((page) => page.items).map((entry) => [entry.id, entry])).values()],
    [data],
  )
  const sections = useMemo(() => (entries ? groupByMonth(entries) : []), [entries])
  const total = data?.pages[0]?.totalItems ?? 0
  const searching = search !== ''
  const stale = isPlaceholderData || query.trim() !== search

  const header = (
    <View>
      <View style={styles.header}>
        <Text variant="title" role="heading" aria-level={1}>
          Journal
        </Text>
        <Button size="sm" icon={Plus} onPress={() => router.push('/journal/new')}>
          New entry
        </Button>
      </View>
      {/* No search box until there's something to search. */}
      {(searching || (entries && entries.length > 0)) && (
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Search size={16} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search entries"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Search entries"
            maxLength={200}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            style={{ flex: 1, color: colors.ink, fontFamily: fonts.sans, fontSize: 15, paddingVertical: 8 }}
          />
        </View>
      )}
      {error && <ErrorState compact={Boolean(entries)} error={error} onRetry={() => refetch()} retrying={isFetching} style={{ marginBottom: 12 }} />}
      {isPending && (
        <View role="status" aria-label="Loading entries" style={{ gap: 20, paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ gap: 8 }}>
              <Skeleton width="66%" height={20} />
              <Skeleton />
            </View>
          ))}
        </View>
      )}
      {!searching && entries && entries.length === 0 && !stale && (
        <EmptyState
          title="Your journal is empty"
          action={<Button onPress={() => router.push('/journal/new')}>Write your first entry</Button>}
        >
          Entries you write appear here, newest first.
        </EmptyState>
      )}
      {searching && !stale && entries && (
        <Text variant="small" tone="muted" role="status" style={{ paddingBottom: 4 }}>
          {total === 0 ? `No entries match “${search}”.` : `${total} ${total === 1 ? 'entry matches' : 'entries match'} “${search}”`}
        </Text>
      )}
    </View>
  )

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => <EntryRow entry={item} />}
        renderSectionHeader={({ section }) => (
          <Text variant="small" weight="medium" tone="muted" role="heading" style={[styles.month, { backgroundColor: colors.paper }]}>
            {section.title}
          </Text>
        )}
        ListHeaderComponent={header}
        ListFooterComponent={
          hasNextPage && !stale ? (
            <View style={{ paddingTop: 12 }}>
              <Button variant="secondary" size="sm" onPress={() => fetchNextPage()} loading={isFetchingNextPage} style={{ alignSelf: 'stretch' }}>
                {isFetchingNextPage ? 'Loading…' : 'Older entries'}
              </Button>
            </View>
          ) : undefined
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !stale) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={() => void refetch()} tintColor={colors.inkMuted} />}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, stale ? { opacity: 0.6 } : undefined]}
        accessibilityLabel="Entries"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, marginBottom: 12 },
  month: { paddingTop: 16, paddingBottom: 6 },
  row: { paddingVertical: 10, paddingHorizontal: 8, marginHorizontal: -8, borderRadius: radius.control },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
})
