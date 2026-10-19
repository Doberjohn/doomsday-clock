import { Fragment } from 'react'
import { useNow } from '../hooks/useNow.ts'
import { countdown, DOOMSDAY } from '../lib/countdown.ts'
import { cx } from '../lib/cx.ts'
import './Countdown.css'

const UNITS = ['months', 'days', 'hours', 'minutes', 'seconds'] as const
const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({ compact = false }: { compact?: boolean }) {
  const left = countdown(useNow(), DOOMSDAY)
  return (
    <div
      className={cx('countdown', compact && 'countdown--compact')}
      role="timer"
      aria-label="Countdown to Avengers: Doomsday, December 18, 2026"
    >
      <div className="countdown__tagline">Doomsday is coming</div>
      <div className="countdown__units">
        {UNITS.map((unit, i) => (
          <Fragment key={unit}>
            {i > 0 && (
              <div className="countdown__sep" aria-hidden="true">
                :
              </div>
            )}
            <div className="countdown__unit">
              <div className="countdown__value">{pad(left[unit])}</div>
              <div className="countdown__label">{unit}</div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
