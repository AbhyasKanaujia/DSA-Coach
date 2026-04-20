import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Simple BroadcastChannel polyfill
class BroadcastChannelPolyfill {
  constructor(name) {
    this.name = name;
    this.listeners = [];
  }

  postMessage(message) {
    this.listeners.forEach(listener => listener({ data: message }));
  }

  addEventListener(type, listener) {
    if (type === 'message') {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === 'message') {
      this.listeners = this.listeners.filter(l => l !== listener);
    }
  }

  close() {
    this.listeners = [];
  }
}

global.BroadcastChannel = BroadcastChannelPolyfill;