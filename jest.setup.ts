import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// TODO: Remove after upgrading to Expo SDK 55 — the streams polyfill crash is fixed there.
// Restore Node's native ReadableStream — Expo's polyfill (expo/virtual/streams.js)
// crashes axios's fetch adapter self-test at import time with
// "Cannot cancel a stream that already has a reader".
const { ReadableStream: NodeReadableStream } = require('node:stream/web');
globalThis.ReadableStream = NodeReadableStream;
