import { useMemo, useState } from 'react'
import logo from './assets/doomsday-logo.png'
import { Countdown } from './components/Countdown.tsx'
import { FoxChip, ModeToggle, PhaseChips, Progress, SearchField, TypeChips } from './components/controls.tsx'
import { DesktopChart } from './components/DesktopChart.tsx'
import { DetailModal } from './components/DetailModal.tsx'
import { EntryList } from './components/EntryList.tsx'
import { MobileChart } from './components/MobileChart.tsx'
import { entries } from './data/entries.ts'
import type { Entry, EntryType } from './data/types.ts'
import { useMediaQuery } from './hooks/useMediaQuery.ts'
import { useWatched } from './hooks/useWatched.ts'
import { cx } from './lib/cx.ts'
import { loadedEntries, matchesFilters } from './lib/filters.ts'
import { desktopLayout, mobileLayout, releaseOrder, storyOrder, type Mode } from './lib/layout.ts'
import './App.css'

const LOGO_ALT = "Marvel Studios' Avengers: Doomsday"

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

const rankById = (ordered: readonly Entry[]) => new Map(ordered.map((e, i) => [e.id, i + 1]))

export default function App() {
  const isMobile = useMediaQuery('(max-width: 720px)')
  const [mode, setMode] = useState<Mode>('chrono')
  const [types, setTypes] = useState<ReadonlySet<EntryType>>(() => new Set())
  const [phases, setPhases] = useState<ReadonlySet<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [fox, setFox] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [watched, toggleWatched] = useWatched()

  const all = useMemo(() => loadedEntries(entries, fox), [fox])
  const layout = useMemo(() => {
    const filters = { types, phases, query }
    const visible = (e: Entry) => matchesFilters(e, filters)
    return (isMobile ? mobileLayout : desktopLayout)(all, mode, visible)
  }, [isMobile, all, mode, types, phases, query])
  const ranks = useMemo(() => ({ story: rankById(storyOrder(all)), release: rankById(releaseOrder(all)) }), [all])

  const watchedCount = all.filter((e) => watched[e.id]).length
  const openEntry = all.find((e) => e.id === openId)
  const filtersActive = types.size > 0 || phases.size > 0
  const togglePhase = (phase: string) => setPhases((p) => (phase === 'all' ? new Set() : toggled(p, phase)))
  const toggleType = (type: EntryType) => setTypes((t) => toggled(t, type))
  const toggleFox = () => setFox((f) => !f)

  return (
    <div className="page">
      <div className="aura" aria-hidden="true">
        <div className="aura__orb aura__orb--a" />
        <div className="aura__orb aura__orb--b" />
      </div>
      <h1 className="sr-only">Doomsday Clock: every MCU title by story order and release date</h1>

      {isMobile ? (
        <>
          <header className="m-header">
            <img className="m-logo" src={logo} alt={LOGO_ALT} width={450} height={250} />
            <Countdown compact />
          </header>
          <main className="main">
            <div className="m-bar">
              <div className="m-bar__row">
                <ModeToggle mode={mode} onChange={setMode} labels={['Story', 'Release']} fill />
                <button
                  type="button"
                  className={cx('filters-btn', filtersActive && 'filters-btn--active')}
                  aria-expanded={filtersOpen}
                  aria-controls="filters"
                  aria-label={filtersActive ? 'Filters (active)' : 'Filters'}
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  {filtersActive ? 'Filters •' : 'Filters'}
                </button>
              </div>
              <SearchField value={query} onChange={setQuery} compact />
              {filtersOpen && (
                <div id="filters" className="m-filters">
                  <PhaseChips phases={phases} onToggle={togglePhase} />
                  <div className="chip-row">
                    <TypeChips types={types} onToggle={toggleType} />
                    <FoxChip on={fox} onToggle={toggleFox} />
                  </div>
                  <Progress done={watchedCount} total={all.length} compact />
                </div>
              )}
            </div>
            <MobileChart layout={layout} watched={watched} onOpen={setOpenId} />
            <EntryList sequence={layout.sequence} mode={mode} watched={watched} />
          </main>
        </>
      ) : (
        <>
          <header className="header">
            <div className="brand">
              <img className="logo" src={logo} alt={LOGO_ALT} width={450} height={250} />
              <Countdown />
            </div>
            <div className="panel">
              <div className="panel__row">
                <SearchField value={query} onChange={setQuery} />
                <ModeToggle mode={mode} onChange={setMode} labels={['Sacred Timeline', 'Release']} />
              </div>
              <PhaseChips phases={phases} onToggle={togglePhase} alignEnd />
              <div className="chip-row chip-row--end">
                <TypeChips types={types} onToggle={toggleType} />
                <span className="chip-divider" aria-hidden="true" />
                <FoxChip on={fox} onToggle={toggleFox} />
              </div>
            </div>
          </header>
          <main className="main">
            <DesktopChart layout={layout} watched={watched} onOpen={setOpenId} modalOpen={!!openEntry} />
            <EntryList sequence={layout.sequence} mode={mode} watched={watched} />
            <div className="progress-row">
              <Progress done={watchedCount} total={all.length} />
            </div>
          </main>
        </>
      )}

      <footer className="footer">
        Unofficial fan project, not affiliated with Marvel Studios or Disney. This product uses the TMDB API but is not
        endorsed or certified by TMDB.
      </footer>

      {openEntry && (
        <DetailModal
          key={openEntry.id}
          entry={openEntry}
          sheet={isMobile}
          watched={!!watched[openEntry.id]}
          storyRank={ranks.story.get(openEntry.id)!}
          releaseRank={ranks.release.get(openEntry.id)!}
          onToggleWatched={() => toggleWatched(openEntry.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}
