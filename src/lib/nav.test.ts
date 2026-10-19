import { describe, expect, it } from 'vitest'
import { stepFocus } from './nav.ts'

const ids = ['a', 'b', 'c']

describe('stepFocus', () => {
  it('moves forward with right and down arrows', () => {
    expect(stepFocus(ids, 'b', 'ArrowRight')).toBe('c')
    expect(stepFocus(ids, 'b', 'ArrowDown')).toBe('c')
  })

  it('moves back with left and up arrows', () => {
    expect(stepFocus(ids, 'b', 'ArrowLeft')).toBe('a')
    expect(stepFocus(ids, 'b', 'ArrowUp')).toBe('a')
  })

  it('stops at either end', () => {
    expect(stepFocus(ids, 'c', 'ArrowRight')).toBe('c')
    expect(stepFocus(ids, 'a', 'ArrowLeft')).toBe('a')
  })

  it('jumps to the ends with Home and End', () => {
    expect(stepFocus(ids, 'b', 'Home')).toBe('a')
    expect(stepFocus(ids, 'b', 'End')).toBe('c')
  })

  it('ignores other keys', () => {
    expect(stepFocus(ids, 'b', 'Enter')).toBeNull()
  })

  it('starts from the first entry when the current one is gone', () => {
    expect(stepFocus(ids, 'zzz', 'ArrowRight')).toBe('a')
  })
})
