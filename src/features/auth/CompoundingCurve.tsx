import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts } from '@/theme/tokens'

/**
 * The idea behind the name, drawn to scale: 1% better each day for a year is 1.01^365 ≈ 37.8×.
 * The curve looks flat for months and then takes off, which is the point. (Same drawing as the web.)
 */
const DAYS = 365
const WIDTH = 480
const HEIGHT = 300
const FINAL = Math.pow(1.01, DAYS)

function pointAt(day: number): [number, number] {
  const x = (day / DAYS) * WIDTH
  const y = HEIGHT - ((Math.pow(1.01, day) - 1) / (FINAL - 1)) * HEIGHT
  return [x, y]
}

const path = Array.from({ length: DAYS + 1 }, (_, day) => {
  const [x, y] = pointAt(day)
  return `${day === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ')
const [endX, endY] = pointAt(DAYS)

export function CompoundingCurve() {
  const { colors } = useTheme()
  return (
    <Svg
      width="100%"
      style={{ aspectRatio: (WIDTH + 56) / (HEIGHT + 56) }}
      viewBox={`-8 -24 ${WIDTH + 56} ${HEIGHT + 56}`}
      accessibilityRole="image"
      accessibilityLabel="A curve of one percent daily improvement over a year, ending 37.8 times higher"
    >
      {Array.from({ length: 53 }, (_, week) => (
        <Line
          key={week}
          x1={(week / 52) * WIDTH}
          x2={(week / 52) * WIDTH}
          y1={HEIGHT + 8}
          y2={HEIGHT + (week % 4 === 0 ? 18 : 13)}
          stroke={colors.ink}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      <Line x1={0} x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke={colors.ink} strokeOpacity={0.25} strokeDasharray="2 6" />
      <Path d={path} fill="none" stroke={colors.sky} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={endX} cy={endY} r={7} fill={colors.sunrise} />
      <SvgText x={endX - 14} y={endY - 2} textAnchor="end" fill={colors.ink} fontFamily={fonts.serif} fontSize={22}>
        37.8×
      </SvgText>
      <SvgText x={0} y={HEIGHT + 34} fill={colors.ink} opacity={0.6} fontFamily={fonts.sans} fontSize={11}>
        Day 1
      </SvgText>
      <SvgText x={WIDTH} y={HEIGHT + 34} textAnchor="end" fill={colors.ink} opacity={0.6} fontFamily={fonts.sans} fontSize={11}>
        Day 365
      </SvgText>
    </Svg>
  )
}
