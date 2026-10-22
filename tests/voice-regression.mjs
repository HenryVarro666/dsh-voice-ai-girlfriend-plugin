// Run: node --test tests/voice-regression.mjs
// Fake only the capture clock; exercise the actual recorder and text modules.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { load } from './helpers.mjs'

const { splitSentences } = await load('voice/sentences.ts')
const { cleanReplyText } = await load('voice/clean.ts')

test('lists keep separate speech boundaries and omit code', () => {
  const text = '1. 先吃饭\n2) 再休息\n3、 明天继续\n```js\nconst secret = 1'
  const clean = cleanReplyText(text, 2000, true)
  assert.equal(clean, '先吃饭\n再休息\n明天继续\n')
  assert.deepEqual(Array.from(splitSentences(clean).sentences), [
    '先吃饭', '再休息', '明天继续',
  ])
  assert.equal(splitSentences(clean).partial, null)
})

test('streamed prefixes never change emitted sentences; chunks stay bounded', () => {
  const inputs = [
    '今天加班辛苦啦，先去吃点热的，然后早点休息。',
    '1. 先吃饭\n2. 再休息\n',
    '这是一段没有任何标点的文字'.repeat(25),
    '数字是1,000，时间是10:30。',
  ]
  for (const raw of inputs) {
    let previous = []
    for (let i = 0; i <= raw.length; i++) {
      const prefix = cleanReplyText(raw.slice(0, i), 10000, true)
      const current = Array.from(splitSentences(prefix).sentences)
      assert.deepEqual(current.slice(0, previous.length), previous, `unstable prefix ${i}`)
      assert.ok(current.every(s => Array.from(s).length <= 60))
      previous = current
    }
  }
})

async function recorder(check) {
  let now = 0
  const events = []
  const { MicRecorder } = await load('voice/recorder.ts', {
    performance: { now: () => now },
    setTimeout: () => 1,
    clearTimeout: () => {},
  })
  const r = new MicRecorder({
    turnCheck: check,
    turnSilenceMs: 500,
    incompleteSilenceMs: 1200,
    minSilenceMs: 1800,
    onUtterance: (pcm, text) => events.push({ bytes: pcm.byteLength, text, at: now }),
  })
  const chunk = (at, voice = false) => {
    now = at
    r.onLevel(voice ? 0.1 : 0)
    r.onChunk(new ArrayBuffer(1280))
  }
  return { r, events, chunk }
}
const tick = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

test('complete turn finishes at the 500 ms check and reuses transcript', async () => {
  const { events, chunk } = await recorder(async () => ({ complete: true, text: '你好' }))
  chunk(0, true)
  chunk(499)
  await tick()
  assert.equal(events.length, 0)
  chunk(500)
  await tick()
  assert.equal(events.length, 1)
  assert.equal(events[0].text, '你好')
})

test('incomplete turn waits to 1200 ms', async () => {
  const { events, chunk } = await recorder(async () => ({ complete: false }))
  chunk(0, true)
  chunk(500)
  await tick()
  chunk(1199)
  assert.equal(events.length, 0)
  chunk(1200)
  assert.equal(events.length, 1)
})

test('unavailable turn service falls back to the original 1800 ms', async () => {
  const { events, chunk } = await recorder(async () => null)
  chunk(0, true)
  chunk(500)
  await tick()
  chunk(1200)
  assert.equal(events.length, 0)
  chunk(1800)
  assert.equal(events.length, 1)
})

test('resumed speech invalidates an outstanding complete verdict', async () => {
  let answer
  const { events, chunk } = await recorder(
    () => new Promise(resolve => { answer = resolve }),
  )
  chunk(0, true)
  chunk(500)
  chunk(600, true)
  answer({ complete: true, text: 'stale' })
  await tick()
  assert.equal(events.length, 0)
})

test('idle silence is bounded by pre-roll instead of being uploaded', async () => {
  const { r, chunk } = await recorder()
  for (let i = 0; i < 1000; i++) chunk(i * 40)
  assert.ok(r.chunkBytes <= 16000 + 1280)
})
