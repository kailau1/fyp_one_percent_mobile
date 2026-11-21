// jest-expo's preset, plus: MSW 3 (the fake backend in tests) ships some dependencies only as ES
// modules (.mjs), so those go through the same Babel transform as the app's own code.
const preset = require('jest-expo/jest-preset')

const jsTransform = preset.transform['\\.[jt]sx?$']

module.exports = {
  preset: 'jest-expo',
  transform: { ...preset.transform, '\\.mjs$': jsTransform },
  moduleFileExtensions: [...(preset.moduleFileExtensions ?? ['ts', 'tsx', 'js', 'jsx', 'json']), 'mjs'],
  setupFiles: ['<rootDir>/src/test/fetch.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  globalSetup: '<rootDir>/src/test/globalSetup.js',
  // node_modules aren't compiled, except React Native/Expo packages (shipped as untranspiled JS) and
  // any .mjs file (the pattern below only matches .js/.ts files, so .mjs files are always transformed)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|lucide-react-native|msw|@msw/.*|@mswjs/.*|until-async|@open-draft/until|cookie).+\\.[jt]sx?$',
  ],
}
