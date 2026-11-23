import MarkdownDisplay from '@ronradtke/react-native-markdown-display'
import { useMemo } from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts } from '@/theme/tokens'

/** AI feedback (Markdown) in the app's type: Figtree at 15px with relaxed lines, like the web's feedback-prose. */
export function Markdown({ children }: { children: string }) {
  const { colors } = useTheme()
  const style = useMemo(
    () => ({
      body: { color: colors.ink, fontFamily: fonts.sans, fontSize: 15, lineHeight: 28 },
      paragraph: { marginTop: 0, marginBottom: 12 },
      strong: { fontFamily: fonts.sansSemiBold, fontWeight: 'normal' as const },
      em: { fontStyle: 'italic' as const },
      bullet_list: { marginBottom: 12 },
      ordered_list: { marginBottom: 12 },
      list_item: { marginBottom: 4 },
      heading1: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, marginBottom: 8 },
      heading2: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, marginBottom: 8 },
      heading3: { fontFamily: fonts.sansSemiBold, fontSize: 15, marginBottom: 6 },
      link: { color: colors.action },
      blockquote: { backgroundColor: colors.sunken, borderLeftColor: colors.sky, borderLeftWidth: 2, paddingHorizontal: 12, marginBottom: 12 },
      code_inline: { backgroundColor: colors.sunken, color: colors.ink },
    }),
    [colors],
  )
  return <MarkdownDisplay style={style}>{children}</MarkdownDisplay>
}
