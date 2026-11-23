/** Query keys for habit data (the same keys as the web app's habits/hooks.ts). */
export const habitKeys = {
  all: ['habits'] as const,
  history: ['habit-history'] as const,
  recentHistory: ['habit-history', 'recent'] as const,
  historyOf: (id: string) => ['habit-history', id] as const,
}
