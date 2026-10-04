import test from 'node:test'
import assert from 'node:assert/strict'
import { scrollMotion } from './scrollMotion.ts'

const options = { preset: 'title', depth: 108, shift: 34, stagger: 0, compact: false }

test('scroll choreography retraces its exact path when direction reverses', () => {
  const first = scrollMotion(1000, 160, 900, 700, 0, options)
  scrollMotion(1000, 160, 900, 1200, 0, options)
  assert.deepEqual(scrollMotion(1000, 160, 900, 700, 0, options), first)
  assert.notEqual(scrollMotion(1000, 160, 900, 820, 0, options).y, first.y)
})

test('type resolves at reading height and mobile reduces depth travel', () => {
  const desktop = scrollMotion(1000, 160, 900, 700, 0, options)
  const mobile = scrollMotion(1000, 160, 900, 700, 0, { ...options, compact: true })
  assert.equal(desktop.opacity, 1)
  assert.equal(desktop.reveal, 1)
  assert.ok(Math.abs(mobile.y) < Math.abs(desktop.y) * .5)
})

test('every content preset retains full contrast and text size throughout scrolling', () => {
  for (const preset of ['title', 'body', 'meta', 'panel', 'line', 'item']) {
    for (const compact of [false, true]) {
      for (const scroll of [-10000, 0, 150, 350, 700, 1000, 1100, 1300, 2000, 50000]) {
        const value = scrollMotion(1000, 160, 900, scroll, 160, { ...options, preset, compact })
        assert.equal(value.opacity, 1, `${preset} at ${scroll}`)
        assert.equal(value.scale, 1, `${preset} at ${scroll}`)
      }
    }
  }
})

test('divider draws without adding movement to its child labels', () => {
  const entering = scrollMotion(1000, 40, 900, 150, 0, { ...options, preset: 'line' })
  const reading = scrollMotion(1000, 40, 900, 700, 0, { ...options, preset: 'line' })
  for (const value of [entering, reading]) {
    assert.equal(value.x, 0)
    assert.equal(value.y, 0)
    assert.equal(value.rotate, 0)
    assert.equal(value.skew, 0)
  }
  assert.ok(reading.reveal > entering.reveal)
})

test('extreme scroll and velocity remain bounded and finite', () => {
  for (const scroll of [-10000, 0, 2000, 50000]) {
    const value = scrollMotion(1000, 0, 900, scroll, 2000, options)
    assert.ok(Object.values(value).every(Number.isFinite))
    assert.equal(value.opacity, 1)
    assert.ok(Math.abs(value.skew) <= 1.25)
    assert.ok(value.reveal >= 0 && value.reveal <= 1)
  }
})
