/**
 * Jest Polyfills - Runs before Jest environment setup
 * Required for MSW 2.x to work with JSDOM environment
 * @see https://mswjs.io/docs/faq#requestresponsetextencoder-is-not-defined-jest
 */

const { TextDecoder, TextEncoder } = require('node:util');
const { ReadableStream, TransformStream } = require('node:stream/web');
const { BroadcastChannel, MessageChannel, MessagePort } = require('node:worker_threads');

// Polyfill TextEncoder/TextDecoder
Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
  BroadcastChannel: { value: BroadcastChannel },
  MessageChannel: { value: MessageChannel },
  MessagePort: { value: MessagePort },
});

// Use cross-fetch which works better with MSW in JSDOM
// cross-fetch uses XMLHttpRequest in browser-like environments
// and node-fetch in Node.js, both of which MSW can intercept
require('cross-fetch/polyfill');
