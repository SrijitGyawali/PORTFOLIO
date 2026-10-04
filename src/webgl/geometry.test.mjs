import test from 'node:test'
import assert from 'node:assert/strict'
import { createField, exchangePacket, fieldPosition, sampleField } from './geometry.ts'

test('every chapter has compatible finite vertices and valid shared edges', () => {
  for (const mobile of [false, true]) {
    const field = createField(mobile)
    assert.equal(field.targets.length, 10)
    assert.ok(field.count < 65536, '16-bit indices must address every particle')
    for (const target of field.targets) {
      assert.equal(target.length, field.count * 3)
      assert.ok(target.every(Number.isFinite))
    }
    assert.ok(field.edges.every(index => index >= 0 && index < field.count))
  }
})

test('chapter endpoints resolve exactly and remain deterministic after reverse traversal', () => {
  const field = createField(true)
  const output = new Float32Array(field.count * 3)
  for (let chapter = 0; chapter < 10; chapter++) {
    sampleField(field, chapter, output, false)
    assert.deepEqual(output, field.targets[chapter])
  }
  sampleField(field, 3.775, output, false)
  const forward = new Float32Array(output)
  sampleField(field, 6.8, output, false)
  sampleField(field, 3.775, output, false)
  assert.deepEqual(output, forward)
  assert.deepEqual(createField(true).targets[0], field.targets[0])
})

test('reduced motion resolves directly to a static formation without scattering', () => {
  const field = createField(true)
  const output = new Float32Array(field.count * 3)
  const result = sampleField(field, 4.6, output, true)
  assert.equal(result.dispersion, 0)
  assert.deepEqual(output, field.targets[4])
  sampleField(field, -10, output, false)
  assert.deepEqual(output, field.targets[0])
  sampleField(field, 50, output, false)
  assert.deepEqual(output, field.targets[9])
})

test('mobile reduces geometry and contact collapses to one quiet point', () => {
  const desktop = createField(false)
  const mobile = createField(true)
  assert.ok(mobile.count < desktop.count * .5)
  assert.ok(mobile.targets[9].every(coordinate => Math.abs(coordinate) < .018))
})

test('project geometry stays resolved while its main content is being read', () => {
  const field = createField(true)
  const output = new Float32Array(field.count * 3)
  sampleField(field, 4.5, output, false)
  assert.deepEqual(output, field.targets[4])
  const moving = sampleField(field, 4.775, output, false)
  assert.ok(moving.dispersion > .6)
  assert.notDeepEqual(output, field.targets[4])
})

test('the cache coordinate remains unchanged through a chapter hold and advances during transitions', () => {
  assert.equal(fieldPosition(4.01, false), fieldPosition(4.5, false))
  assert.ok(fieldPosition(4.8, false) > fieldPosition(4.7, false))
  assert.equal(fieldPosition(4.8, true), 4)
})

test('opposing orders converge at the core and a matched trade leaves it', () => {
  const buy = new Float32Array(3)
  const sell = new Float32Array(3)
  const trade = new Float32Array(3)
  exchangePacket(0, 0, buy)
  exchangePacket(1, 0, sell)
  assert.ok(buy[0] < 0 && sell[0] > 0)
  exchangePacket(0, 1, buy)
  exchangePacket(1, 1, sell)
  exchangePacket(2, 0, trade)
  assert.deepEqual(buy, sell)
  assert.ok(trade.every((coordinate, axis) => Math.abs(coordinate - buy[axis]) < 1e-6))
  exchangePacket(2, 1, trade)
  assert.ok(trade[0] > 2)
})
