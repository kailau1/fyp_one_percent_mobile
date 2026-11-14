import '@testing-library/react-native/extend-expect';
import Constants from 'expo-constants';

// A fixed API base URL for every test. jest-expo's Constants.expoConfig is a real object we
// can extend; replacing the whole module would break expo-font / @expo/vector-icons.
(Constants.expoConfig as { extra?: Record<string, unknown> }).extra = { BASE_URL: 'http://api.test' };

// jest-expo's native mock makes ExpoFontLoader.getLoadedFonts() return undefined, which crashes
// @expo/vector-icons when an icon renders. Fonts don't matter in tests, so report them as loaded.
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Speed: icons and markdown are heavy to load and render, and no test asserts on how they
// look. Icons render nothing; markdown renders its source as plain text so content is still checkable.
jest.mock('@expo/vector-icons', () => {
  const icon = () => null;
  Object.assign(icon, { glyphMap: {} });
  return new Proxy({ __esModule: true }, { get: (target, key) => (key in target ? (target as any)[key] : icon) });
});

jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ children }: { children: string }) => React.createElement(Text, null, children) };
});
