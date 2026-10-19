export type Countdown = { months: number; days: number; hours: number; minutes: number; seconds: number }

/** Avengers: Doomsday opens Dec 18, 2026, 00:00 US Eastern. */
export const DOOMSDAY = new Date('2026-12-18T05:00:00Z')

/** Whole UTC calendar months such that now + months ≤ target, then the remainder as days/hours/minutes/seconds. */
export function countdown(now: Date, target: Date): Countdown {
  if (target.getTime() <= now.getTime()) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const plusMonths = (m: number) => {
    const d = new Date(now)
    d.setUTCMonth(d.getUTCMonth() + m)
    return d
  }
  let months = (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + target.getUTCMonth() - now.getUTCMonth()
  let anchor = plusMonths(months)
  if (anchor.getTime() > target.getTime()) anchor = plusMonths(--months)

  let rem = Math.floor((target.getTime() - anchor.getTime()) / 1000)
  const days = Math.floor(rem / 86400)
  rem -= days * 86400
  const hours = Math.floor(rem / 3600)
  rem -= hours * 3600
  const minutes = Math.floor(rem / 60)
  return { months, days, hours, minutes, seconds: rem - minutes * 60 }
}
