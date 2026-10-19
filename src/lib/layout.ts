import type { Entry } from '../data/types.ts'

export type Mode = 'chrono' | 'release'
export type Point = { x: number; y: number }
/** A labelled guide line at `pos` along its axis, in viewBox units. */
export type Guide = { pos: number; label: string }
/** Dashed branch from an alternate-universe entry back to the main thread. */
export type AltLink = { id: string; anchor: string }

export type ChartLayout = {
  /** viewBox size. */
  width: number
  height: number
  /** Positions of the visible entries, in viewBox units. */
  positions: Map<string, Point>
  /** Visible entries in data order (paint order). */
  shown: Entry[]
  /** Visible entries in reading order: along x on desktop, down the page on mobile. */
  sequence: Entry[]
  /** Visible main-timeline ids the thread passes through, in story order. */
  thread: string[]
  altLinks: AltLink[]
  /** Visible alternates of each line (e.g. the X-Men films), in story order, drawn as their own dashed thread. */
  lines: string[][]
  xGuides: Guide[]
  yGuides: Guide[]
}

type Visible = (e: Entry) => boolean

const DESKTOP = { width: 1200, height: 600, pad: 40 }
/** The off-grid band, relative to the title it branches from: where it starts (just left of it, so the branch
 *  drops straight down), how far below it hangs, and how much higher each later release sits. It spreads its
 *  titles evenly, at most `maxStep` apart, no closer than `edge` to the chart's right side. */
const BAND = { gap: -10, drop: 50, rise: 18, maxStep: 30, edge: 30 }
const MOBILE = { width: 400, padX: 36, padY: 44, pitch: 48 }
const KEY_YEARS = [1943, 1995, 2010, 2012, 2014, 2016, 2018, 2023, 2025, 2026]

export const storyOrder = (entries: readonly Entry[]) => [...entries].sort((a, b) => a.o - b.o)
export const releaseOrder = (entries: readonly Entry[]) => [...entries].sort((a, b) => a.rel.localeCompare(b.rel))
const releaseYear = (e: Entry) => e.rel.slice(0, 4)
const everyThirdYear = (year: string) => +year % 3 === 0

/** Labels for the story axis: key in-universe years in story mode, every third release year in release mode. */
const storyAxis = (mode: Mode) =>
  mode === 'chrono'
    ? { label: (e: Entry) => String(e.year), qualifies: (year: string) => KEY_YEARS.includes(+year) }
    : { label: releaseYear, qualifies: everyThirdYear }

/** A guide at the first entry of each qualifying year, optionally at least `gap` units after the previous guide. */
function guides(
  seq: readonly Entry[],
  pos: (i: number) => number,
  { label, qualifies }: { label: (e: Entry) => string; qualifies: (year: string) => boolean },
  gap?: number,
): Guide[] {
  const out: Guide[] = []
  const seen = new Set<string>()
  seq.forEach((e, i) => {
    const year = label(e)
    if (seen.has(year) || !qualifies(year)) return
    if (gap !== undefined && out.length && pos(i) - out[out.length - 1].pos <= gap) return
    seen.add(year)
    out.push({ pos: pos(i), label: year })
  })
  return out
}

/** The thread runs through visible main-timeline entries in story order. Each visible alternate branches
 *  off the title it names in `branchFrom` while that is visible, else the nearest visible main-timeline
 *  entry before it, else (with none before it, e.g. under a phase filter) the next one after it.
 *  Alternates sharing a `line` join up in story order instead, and only the first of them branches off. */
function threadAndBranches(chrono: readonly Entry[], visible: Visible) {
  const thread: string[] = []
  const altLinks: AltLink[] = []
  const lines = new Map<string, string[]>()
  const byId = new Map(chrono.map((e) => [e.id, e]))
  let anchor: string | null = null
  let waiting: string[] = []
  for (const e of chrono) {
    if (!visible(e)) continue
    if (!e.alt) {
      thread.push(e.id)
      anchor = e.id
      for (const id of waiting) altLinks.push({ id, anchor: e.id })
      waiting = []
      continue
    }
    const line = e.line ? lines.get(e.line) : undefined
    if (line) {
      line.push(e.id)
      continue
    }
    if (e.line) lines.set(e.line, [e.id])
    const named = e.branchFrom ? byId.get(e.branchFrom) : undefined
    const from = named && visible(named) ? named.id : anchor
    if (from) altLinks.push({ id: e.id, anchor: from })
    else waiting.push(e.id)
  }
  return { thread, altLinks, lines: [...lines.values()] }
}

/** The Fox films aren't on Marvel's timeline, so they take no slot on the desktop grid; nor does anything sharing
 *  a line with them (Deadpool & Wolverine), which joins their band. */
function offGridTest(all: readonly Entry[]) {
  const foxLines = new Set(all.filter((e) => e.fox && e.line).map((e) => e.line))
  return (e: Entry) => !!e.fox || (!!e.line && foxLines.has(e.line))
}

/** Off-grid titles hang in a band below the title the first of them branches from (else the nearest grid title
 *  before it): story order across, from right under that title towards the right edge, and release order up. */
function band(all: readonly Entry[], offGrid: (e: Entry) => boolean, gridAt: (id: string) => Point | undefined, right: number) {
  const members = storyOrder(all.filter(offGrid))
  const out = new Map<string, Point>()
  if (!members.length) return out
  const first = members[0]
  const before = storyOrder(all).filter((e) => !offGrid(e) && e.o < first.o).at(-1)
  const named = first.branchFrom ? gridAt(first.branchFrom) : undefined
  const anchor = named ?? (before ? gridAt(before.id) : undefined)
  if (!anchor) return out
  const rank = new Map(releaseOrder(members).map((e, i) => [e.id, i]))
  const x0 = anchor.x + BAND.gap
  const step = members.length > 1 ? Math.min(BAND.maxStep, (right - x0) / (members.length - 1)) : 0
  const top = anchor.y + BAND.drop
  members.forEach((e, i) => {
    out.set(e.id, { x: x0 + i * step, y: top + (members.length - 1 - rank.get(e.id)!) * BAND.rise })
  })
  return out
}

/** Story (or release) order along x, release date up y, in a 1200×600 viewBox; off-grid titles sit in a band. */
export function desktopLayout(all: readonly Entry[], mode: Mode, visible: Visible): ChartLayout {
  const { width, height, pad } = DESKTOP
  const offGrid = offGridTest(all)
  const grid = all.filter((e) => !offGrid(e))
  const chrono = storyOrder(grid)
  const release = releaseOrder(grid)
  const xs = mode === 'chrono' ? chrono : release
  const n = Math.max(1, grid.length - 1)
  const px = (i: number) => pad + (i / n) * (width - 2 * pad)
  const py = (i: number) => height - pad - (i / n) * (height - 2 * pad)

  // Slots span every loaded grid entry, so filtering hides dots without moving the rest.
  const slotX = new Map(xs.map((e, i) => [e.id, px(i)]))
  const slotY = new Map(release.map((e, i) => [e.id, py(i)]))
  const gridAt = (id: string) => (slotX.has(id) ? { x: slotX.get(id)!, y: slotY.get(id)! } : undefined)
  const banded = band(all, offGrid, gridAt, width - BAND.edge)
  const positions = new Map<string, Point>()
  for (const e of all) {
    const p = gridAt(e.id) ?? banded.get(e.id)
    if (p && visible(e)) positions.set(e.id, p)
  }

  return {
    width,
    height,
    positions,
    shown: all.filter(visible),
    sequence: (mode === 'chrono' ? storyOrder(all) : releaseOrder(all)).filter(visible),
    ...threadAndBranches(storyOrder(all), visible),
    xGuides: guides(xs, px, storyAxis(mode), 60),
    yGuides: guides(release, py, { label: releaseYear, qualifies: everyThirdYear }),
  }
}

/** Story (or release) order down the page at a fixed pitch, release date across. Lays out visible entries only. */
export function mobileLayout(all: readonly Entry[], mode: Mode, visible: Visible): ChartLayout {
  const { width, padX, padY, pitch } = MOBILE
  const chrono = storyOrder(all)
  const release = releaseOrder(all)
  const down = (mode === 'chrono' ? chrono : release).filter(visible)
  const across = release.filter(visible)
  const n = Math.max(1, down.length - 1)
  const mx = (i: number) => padX + (i / n) * (width - 2 * padX)
  const my = (i: number) => padY + i * pitch

  const slotX = new Map(across.map((e, i) => [e.id, mx(i)]))
  const positions = new Map(down.map((e, i): [string, Point] => [e.id, { x: slotX.get(e.id)!, y: my(i) }]))

  return {
    width,
    height: padY * 2 + Math.max(0, down.length - 1) * pitch,
    positions,
    shown: all.filter(visible),
    sequence: down,
    ...threadAndBranches(chrono, visible),
    xGuides: guides(across, mx, { label: releaseYear, qualifies: everyThirdYear }, 40),
    yGuides: guides(down, my, storyAxis(mode), 60),
  }
}

const r = (n: number) => Math.round(n * 100) / 100

/** Catmull-Rom spline through every point, as cubic Bézier segments. */
export function curve(pts: readonly Point[]): string {
  if (!pts.length) return ''
  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C ${r(p1.x + (p2.x - p0.x) / 6)} ${r(p1.y + (p2.y - p0.y) / 6)}, ${r(p2.x - (p3.x - p1.x) / 6)} ${r(p2.y - (p3.y - p1.y) / 6)}, ${r(p2.x)} ${r(p2.y)}`
  }
  return d
}

/** Straight segments through every point. */
export function polyline(pts: readonly Point[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'} ${r(p.x)} ${r(p.y)}`).join(' ')
}

/** Branch from main-thread anchor `a` out to alternate `b`, bending along `axis` (y on desktop, x on mobile). */
export function altLinkPath(a: Point, b: Point, axis: 'x' | 'y'): string {
  if (axis === 'y') {
    const bend = (b.y - a.y) * 0.9
    return `M ${r(a.x)} ${r(a.y)} C ${r(a.x)} ${r(a.y + bend)}, ${r(b.x)} ${r(b.y - bend * 0.2)}, ${r(b.x)} ${r(b.y)}`
  }
  const bend = (b.x - a.x) * 0.9
  return `M ${r(a.x)} ${r(a.y)} C ${r(a.x + bend)} ${r(a.y)}, ${r(b.x - bend * 0.2)} ${r(b.y)}, ${r(b.x)} ${r(b.y)}`
}
