import { describe, expect, it } from 'vitest'
import { parseWatched, toggleWatched } from './watched.ts'

describe('parseWatched', () => {
  it('reads the stored id map', () => {
    expect(parseWatched('{"ragnarok":1,"loki":1}')).toEqual({ ragnarok: 1, loki: 1 })
  })

  it('starts empty when nothing is stored', () => {
    expect(parseWatched(null)).toEqual({})
  })

  it('starts empty when the stored value is corrupt or the wrong shape', () => {
    expect(parseWatched('{not json')).toEqual({})
    expect(parseWatched('[1,2]')).toEqual({})
    expect(parseWatched('5')).toEqual({})
    expect(parseWatched('null')).toEqual({})
  })
})

describe('toggleWatched', () => {
  it('marks an unwatched title without touching the original', () => {
    const before = { loki: 1 as const }
    expect(toggleWatched(before, 'ragnarok')).toEqual({ loki: 1, ragnarok: 1 })
    expect(before).toEqual({ loki: 1 })
  })

  it('unmarks a watched title', () => {
    expect(toggleWatched({ loki: 1, ragnarok: 1 }, 'loki')).toEqual({ ragnarok: 1 })
  })
})
