// jest-expo's preset, plus: MSW 3 (the fake backend in tests) ships some dependencies only as ES
// modules (.mjs), so those go through the same Babel transform as the app's own code.
const preset = require('jest-expo/jest-preset')

const jsTransform = preset.transform['\\.[jt]sx?$']

module.exports = {
  preset: 'jest-expo',
  transform: { ...preset.transform, '\\.mjs$': jsTransform },
  moduleFileExtensions: [...(preset.moduleFileExtensions ?? ['ts', 'tsx', 'js', 'jsx', 'json']), 'mjs'],
  // Expo Router's renderRouter turns fake timers on with these defaults: they advance with the real
  // clock, and the microtask/immediate queues that Node's fetch and MSW rely on stay real, so requests
  // complete in whole-app tests.
  fakeTimers: { advanceTimers: true, doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] },
  // whole-app tests render every route and layout; the first one in a file also compiles them
  testTimeout: 30000,
  setupFiles: ['<rootDir>/src/test/fetch.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  globalSetup: '<rootDir>/src/test/globalSetup.js',
  // node_modules aren't compiled, except React Native/Expo packages (shipped as untranspiled JS) and
  // any .mjs file (the pattern below only matches .js/.ts files, so .mjs files are always transformed)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|lucide-react-native|msw|@msw/.*|@mswjs/.*|until-async|@open-draft/until|cookie|standard-navigation|@ronradtke/.*).+\\.[jt]sx?$',
  ],
}
