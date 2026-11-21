import { useMemo } from 'react'
import { View } from 'react-native'
import Svg, { Rect, Text as SvgText } from 'react-native-svg'
import { Text } from '@/components/ui/Text'
import { toDayNumber } from '@/features/habits/streaks'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts } from '@/theme/tokens'
import { compounded } from './activity'

const STEP = 3 // viewBox units per day: a 2-unit mark and a 1-unit gap
const TALL = 46
const SHORT = 10
const DAYS = 84 // the last twelve weeks: the web's narrow-screen ribbon

/**
 * The year so far, one mark per day, as on the web: each day you showed up is a taller mark, and
 * the line underneath says what that many days compound to. A phone shows the last twelve weeks.
 */
export function YearRibbon({ active, today, unavailable = false }: { active: Set<number>; today: Date; unavailable?: boolean }) {
  const { colors } = useTheme()
  const todayNumber = toDayNumber(today)
  const first = todayNumber - (DAYS - 1)
  const { daysSoFar, activeSoFar, labels } = useMemo(() => {
    const firstOfYear = toDayNumber(new Date(today.getFullYear(), 0, 1))
    let activeSoFar = 0
    for (let day = firstOfYear; day <= todayNumber; day++) if (active.has(day)) activeSoFar++
    const labels = [0, 4, 8].map((weeks): [number, string] => {
      const day = first + weeks * 7
      return [day, new Date(day * 86_400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })]
    })
    return { daysSoFar: todayNumber - firstOfYear + 1, activeSoFar, labels }
  }, [today, todayNumber, active, first])

  return (
    <View accessibilityLabel="Your year" style={{ gap: 16 }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={unavailable ? 'Your year so far isn’t loaded' : `You showed up on ${activeSoFar} of ${daysSoFar} days so far this year`}
      >
        <Svg width="100%" style={{ aspectRatio: (DAYS * STEP) / (TALL + 18) }} viewBox={`0 0 ${DAYS * STEP} ${TALL + 18}`}>
          {Array.from({ length: DAYS }, (_, i) => {
            const day = first + i
            const isActive = active.has(day)
            const isToday = day === todayNumber
            const height = isActive ? TALL : SHORT
            return (
              <Rect
                key={day}
                x={i * STEP}
                y={TALL - height}
                width={STEP - 1}
                height={height}
                rx={1}
                fill={isToday ? colors.sunrise : isActive ? colors.sky : colors.inkFaint}
                opacity={isToday || isActive ? 1 : 0.45}
              />
            )
          })}
          {labels.map(([day, label]) => (
            <SvgText key={day} x={(day - first) * STEP} y={TALL + 15} fill={colors.inkMuted} fontFamily={fonts.sans} fontSize={9}>
              {label}
            </SvgText>
          ))}
        </Svg>
      </View>
      <Text serif style={{ fontSize: 20, lineHeight: 32 }}>
        {unavailable ? (
          <Text tone="muted" serif style={{ fontSize: 20 }}>
            Your year so far isn’t loaded.
          </Text>
        ) : activeSoFar === 0 ? (
          'Every mark is a day. Write an entry or tick a habit to make today’s the first tall one.'
        ) : (
          `You’ve shown up on ${activeSoFar} ${activeSoFar === 1 ? 'day' : 'days'} this year. One percent better each of those days compounds to ${compounded(activeSoFar).toFixed(2)}×.`
        )}
      </Text>
    </View>
  )
}
