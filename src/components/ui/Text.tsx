import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts, type as scale } from '@/theme/tokens'

type Variant = 'body' | 'small' | 'xs' | 'title' | 'heading' | 'subheading' | 'reading' | 'label'
type Tone = 'ink' | 'muted' | 'faint' | 'action' | 'danger' | 'onAction' | 'onHabit'

export interface TextProps extends RNTextProps {
  variant?: Variant
  tone?: Tone
  /** Literata instead of Figtree: for the user's writing, dates and headings. */
  serif?: boolean
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
}

// title/heading/subheading/reading are serif, as on the web (font-serif); the rest are Figtree.
const variants: Record<Variant, { size: TextStyle; serif: boolean; weight: NonNullable<TextProps['weight']> }> = {
  title: { size: { ...scale['4xl'], letterSpacing: -0.6 }, serif: true, weight: 'medium' },
  heading: { size: scale['2xl'], serif: true, weight: 'regular' },
  subheading: { size: scale.xl, serif: true, weight: 'regular' },
  reading: { size: { fontSize: 18, lineHeight: 32 }, serif: true, weight: 'regular' },
  body: { size: scale.base, serif: false, weight: 'regular' },
  label: { size: scale.sm, serif: false, weight: 'medium' },
  small: { size: scale.sm, serif: false, weight: 'regular' },
  xs: { size: scale.xs, serif: false, weight: 'regular' },
}

function family(serif: boolean, weight: NonNullable<TextProps['weight']>): string {
  if (serif) return weight === 'regular' ? fonts.serif : weight === 'medium' ? fonts.serifMedium : fonts.serifSemiBold
  return { regular: fonts.sans, medium: fonts.sansMedium, semibold: fonts.sansSemiBold, bold: fonts.sansBold }[weight]
}

/** All text in the app: the right font, size and colour token, so screens never pick raw values. */
export function Text({ variant = 'body', tone = 'ink', serif, weight, style, ...props }: TextProps) {
  const { colors } = useTheme()
  const v = variants[variant]
  const color = {
    ink: colors.ink,
    muted: colors.inkMuted,
    faint: colors.inkFaint,
    action: colors.action,
    danger: colors.danger,
    onAction: colors.onAction,
    onHabit: colors.onHabit,
  }[tone]
  return <RNText {...props} style={[v.size, { fontFamily: family(serif ?? v.serif, weight ?? v.weight), color }, style]} />
}
