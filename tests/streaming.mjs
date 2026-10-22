/** Wire-format and cancellation contracts; no browser or GPU needed. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { load } from './helpers.mjs'

test('old bridge is tried once for streams, then WAV fallback remains available', async () => {
  const calls = []
  const { ttsStream, tts } = await load('bridge.ts', {
    fetch: async url => {
      calls.push(url)
      return url.endsWith('/stream')
        ? { status: 404 }
        : { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }
    },
  })
  assert.equal(await ttsStream('one'), null)
  assert.equal(await ttsStream('two'), null)
  assert.equal((await tts('two')).byteLength, 4)
  assert.equal(calls.length, 2)
})

test('failed turn endpoint gives a silence fallback', async () => {
  const { turnCheck } = await load('bridge.ts', {
    fetch: async () => { throw new Error('offline') },
  })
  assert.equal(await turnCheck(new ArrayBuffer(2)), null)
})

class AudioContext {
  currentTime = 1
  state = 'running'
  destination = {}
  played = []
  createBuffer(channels, length, rate) {
    return {
      duration: length / rate,
      copyToChannel: samples => this.played.push(Array.from(samples)),
    }
  }
  createBufferSource() {
    return {
      connect() {},
      start() { queueMicrotask(() => this.onended?.()) },
      stop() {},
      onended: null,
    }
  }
  async close() {}
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('odd PCM byte boundaries preserve little-endian samples', async () => {
  const { ReplySpeaker } = await load('voice/speaker.ts', { AudioContext })
  const speaker = new ReplySpeaker()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([0xff]))
      controller.enqueue(new Uint8Array([0x7f, 0x00]))
      controller.enqueue(new Uint8Array([0x80]))
      controller.close()
    },
  })
  await speaker.speakStream(stream)
  await tick()
  assert.deepEqual(speaker.ctx.played.flat(), [32767 / 32768, -1])
  speaker.dispose()
})

test('stop cancels a pending stream and releases the speaking state', async () => {
  let cancelled = false
  const stream = new ReadableStream({ cancel() { cancelled = true } })
  const { ReplySpeaker } = await load('voice/speaker.ts', { AudioContext })
  const speaker = new ReplySpeaker()
  const reading = speaker.speakStream(stream)
  await tick()
  assert.equal(speaker.speaking, true)
  speaker.stop()
  await reading
  await tick()
  assert.equal(cancelled, true)
  assert.equal(speaker.speaking, false)
  speaker.dispose()
})
