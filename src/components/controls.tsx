import { useId } from 'react'
import type { EntryType } from '../data/types.ts'
import { cx } from '../lib/cx.ts'
import { TYPE_LABEL, TYPES } from '../lib/format.ts'
import type { Mode } from '../lib/layout.ts'
import './controls.css'

export function SearchField({ value, onChange, compact = false }: { value: string; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <label className={cx('search', compact && 'search--compact')}>
      <span className="search__pulse" aria-hidden="true" />
      <input
        className="search__input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SCAN THE MULTIVERSE"
        aria-label="Search titles"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
    </label>
  )
}

export function ModeToggle({ mode, onChange, labels, fill = false }: { mode: Mode; onChange: (mode: Mode) => void; labels: [chrono: string, release: string]; fill?: boolean }) {
  return (
    <div className={cx('segmented', fill && 'segmented--fill')} role="group" aria-label="Order">
      <button type="button" className="segmented__btn" aria-pressed={mode === 'chrono'} onClick={() => onChange('chrono')}>
        {labels[0]}
      </button>
      <button type="button" className="segmented__btn" aria-pressed={mode === 'release'} onClick={() => onChange('release')}>
        {labels[1]}
      </button>
    </div>
  )
}

const PHASES = [
  ['all', 'All'],
  ['1', 'I'],
  ['2', 'II'],
  ['3', 'III'],
  ['4', 'IV'],
  ['5', 'V'],
  ['6', 'VI'],
  ['0', 'Netflix / ABC'],
] as const

/** Phase filter. Additive: "All" clears, picking I then II shows both. */
export function PhaseChips({ phases, onToggle, alignEnd = false }: { phases: ReadonlySet<string>; onToggle: (phase: string) => void; alignEnd?: boolean }) {
  const labelId = useId()
  return (
    <div className={cx('phases', alignEnd && 'phases--end')} role="group" aria-labelledby={labelId}>
      <span id={labelId} className="phases__label">
        Phase
      </span>
      {PHASES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="chip-phase"
          aria-pressed={value === 'all' ? phases.size === 0 : phases.has(value)}
          onClick={() => onToggle(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** Type filter. No selection means every type is shown, so every chip reads as on. */
export function TypeChips({ types, onToggle }: { types: ReadonlySet<EntryType>; onToggle: (type: EntryType) => void }) {
  return TYPES.map((type) => (
    <button
      key={type}
      type="button"
      className={`chip-type t-${type}`}
      aria-pressed={types.size === 0 || types.has(type)}
      onClick={() => onToggle(type)}
    >
      <span className="chip-type__dot" aria-hidden="true" />
      {TYPE_LABEL[type]}
    </button>
  ))
}

export function FoxChip({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="chip-fox" aria-pressed={on} onClick={onToggle}>
      <span className="chip-fox__dot" aria-hidden="true" />
      X-Men universe
    </button>
  )
}

export function Progress({ done, total, compact = false }: { done: number; total: number; compact?: boolean }) {
  return (
    <div className={cx('progress', compact && 'progress--compact')}>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Titles watched"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="progress__bar" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <span className="progress__label">
        {done} / {total} watched
      </span>
    </div>
  )
}
