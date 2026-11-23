/**
 * Design tokens: the same values as the web app (one_percent_web/src/index.css), so the two apps
 * look like one product. Components use these names, never raw colours; dark mode is just the
 * second set of values.
 *
 * Sky is the brand blue; Action is its darker partner for anything pressable (Sky alone fails
 * contrast on light backgrounds); Sunrise is reserved for streaks and "done", so it always means progress.
 */
export interface Palette {
  paper: string
  surface: string
  sunken: string
  ink: string
  inkStrong: string
  inkMuted: string
  inkFaint: string
  line: string
  sky: string
  skyWash: string
  action: string
  actionPressed: string
  onAction: string
  sunrise: string
  sunriseWash: string
  danger: string
  dangerWash: string
  warningWash: string
  warningLine: string
  /** Text on a habit's own pastel colour: dark in both themes, because the pastels don't change. */
  onHabit: string
}

export const light: Palette = {
  paper: '#f3f6f9',
  surface: '#ffffff',
  sunken: '#e9eef3',
  ink: '#17263a',
  inkStrong: '#17263a',
  inkMuted: '#56667a',
  inkFaint: '#8593a4',
  line: '#d8e0e9',
  sky: '#74b7e2',
  skyWash: '#e3f0f9',
  action: '#2b6ca3',
  actionPressed: '#235a8a',
  onAction: '#ffffff',
  sunrise: '#e9a23b',
  sunriseWash: '#fbf0dc',
  danger: '#b3372f',
  dangerWash: '#fbe9e7',
  warningWash: '#fdf3d9',
  warningLine: '#e6c878',
  onHabit: '#17263a',
}

export const dark: Palette = {
  paper: '#0f1b2b',
  surface: '#16263a',
  sunken: '#0b1522',
  ink: '#e6edf5',
  inkStrong: '#ffffff',
  inkMuted: '#9fb0c3',
  inkFaint: '#6f8298',
  line: '#27394f',
  sky: '#74b7e2',
  skyWash: '#1b3350',
  action: '#86c3ea',
  actionPressed: '#a3d2f0',
  onAction: '#0f1b2b',
  sunrise: '#f0b254',
  sunriseWash: '#3a2e17',
  danger: '#f08b82',
  dangerWash: '#3b1f1f',
  warningWash: '#33290f',
  warningLine: '#6b5621',
  onHabit: '#17263a',
}

/** Radius follows importance: small controls < cards < large panels (web: 0.5 / 0.875 / 1.25rem). */
export const radius = { control: 8, card: 14, panel: 20, full: 999 } as const

/** Spacing steps, in points (Tailwind's 4-point scale, as the web uses). */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const

/** Side padding of every screen (the web uses 20px on phones). */
export const gutter = 20

/** The smallest comfortable tap target. */
export const minTouch = 44

/**
 * Figtree for the interface; Literata (made for long reading) for the user's writing, dates and
 * titles, as on the web. React Native picks a weight by font file, so each weight is a family.
 */
export const fonts = {
  sans: 'Figtree_400Regular',
  sansMedium: 'Figtree_500Medium',
  sansSemiBold: 'Figtree_600SemiBold',
  sansBold: 'Figtree_700Bold',
  serif: 'Literata_400Regular',
  serifMedium: 'Literata_500Medium',
  serifSemiBold: 'Literata_600SemiBold',
} as const

/** The type scale (web Tailwind sizes, with matching line heights). */
export const type = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
} as const
