// Runs before every test file's imports (jest "setupFiles"), so MSW is built on these classes.
//
// jest-expo's global fetch is Expo's native-backed one, which returns empty responses under Jest.
// Tests use Node's standard fetch (undici) instead; MSW intercepts it, so no request leaves the machine.

// undici records request timings through Node's performance API, which React Native's test
// environment doesn't have (and it reads it as it loads, so this comes first); timings don't matter here.
if (typeof globalThis.performance.markResourceTiming !== 'function') globalThis.performance.markResourceTiming = () => {}

// Node's own web streams, text codecs and Blob: fetch bodies are streams, and undici and MSW must
// share one implementation (the environment's polyfills would leave bodies unreadable).
const streams = require('node:stream/web')
const { TextEncoder, TextDecoder } = require('node:util')
const { Blob } = require('node:buffer')
Object.assign(globalThis, {
  ReadableStream: streams.ReadableStream,
  WritableStream: streams.WritableStream,
  TransformStream: streams.TransformStream,
  TextEncoder,
  TextDecoder,
  Blob,
})

const undici = require('undici')

Object.assign(globalThis, {
  fetch: undici.fetch,
  Headers: undici.Headers,
  Request: undici.Request,
  Response: undici.Response,
  FormData: undici.FormData,
})
