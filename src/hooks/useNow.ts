import { useEffect, useState } from 'react'

/** The current time, updated on each second boundary. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(new Date())
        schedule()
      }, 1000 - (Date.now() % 1000))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])
  return now
}
