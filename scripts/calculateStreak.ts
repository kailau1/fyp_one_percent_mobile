import { HabitHistory } from '@/context/HabitsContext';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Converts a date to a whole "day number" so calendar days can be compared with simple
 * arithmetic, without timezone or daylight-saving surprises.
 *
 * - Strings like "2025-04-20" (what the API sends) are read as that calendar day. Note that
 *   `new Date("2025-04-20")` would parse as *UTC* midnight, which is the previous evening in
 *   timezones west of UTC and an hour early during BST: that was the source of streak bugs.
 * - Date objects are read as the device's local calendar day.
 */
export function toDayNumber(date: string | Date): number {
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
    if (match) {
      return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / MS_PER_DAY;
    }
    date = new Date(date);
  }
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;
}

/** The set of distinct days on which the habit was completed. */
function completedDays(history: HabitHistory[]): Set<number> {
  return new Set(history.filter((h) => h.completed).map((h) => toDayNumber(h.date)));
}

/**
 * Number of consecutive days, ending today, on which the habit was completed.
 *
 * If today hasn't been completed *yet*, the streak still counts up to yesterday: you haven't
 * broken it until the day is over. Duplicate records for the same day count once, and the
 * input order doesn't matter.
 *
 * @param today injectable "now" so the function is deterministic in tests
 */
export function calculateCurrentStreak(history: HabitHistory[], today: Date = new Date()): number {
  const days = completedDays(history);
  const todayNumber = toDayNumber(today);

  let cursor = days.has(todayNumber) ? todayNumber : todayNumber - 1;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}

/** The longest run of consecutive completed days anywhere in the history. */
export function calculateLongestStreak(history: HabitHistory[]): number {
  const days = [...completedDays(history)].sort((a, b) => a - b);

  let longest = 0;
  let current = 0;
  for (let i = 0; i < days.length; i++) {
    current = i > 0 && days[i] === days[i - 1] + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
