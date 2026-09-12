/**
 * The day a capture was written, as a key to group by and a word to print.
 *
 * ⚠ **This runs on the server and only on the server, and that is the whole
 * design of it.** Grouping by day is a formatting decision that depends on a
 * timezone, and the server's timezone and the browser's are not the same: on
 * Vercel the server is UTC and the handset it renders for is not. A page that
 * grouped on both sides would disagree about how many groups there are for
 * anything written after 23:00 local — a *structural* hydration mismatch, in a
 * list, which is the shape React cannot patch quietly.
 *
 * So the client never formats a date. The server stamps every line with the two
 * strings the page needs, and hands the client `todayKey` for the one line it
 * creates itself — see `components/page-screen.tsx`. A capture typed now joins
 * whatever group the server called today, rather than opening a second one.
 *
 * ⚠ **`stamp` in globals.css is §11's own reserved use for mono**, which is what
 * this is set in: the day is data the record already has, and it asks nothing of
 * anybody. Not a sort control and not a filter chip — a page you wrote does not
 * reorder itself, and a row of filters would be the organisation §2 says happens
 * after capture, being demanded before it.
 */

export type Day = {
  /** Stable across timezones only in the sense that one formatter made them all. */
  key: string
  /** *Today*, *Yesterday*, *18 August*, *2 September 2025*. */
  label: string
}

/**
 * ⚠ **`en-CA` is not a language choice.** It is the one common locale whose
 * numeric date format is ISO — `2026-08-23` — which makes the key sortable and
 * comparable as a plain string. The label below is `en-GB`, which is the app's
 * actual voice.
 */
function keyFormatter(timeZone: string | undefined) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * The stamps for a run of captures, computed once for the whole page.
 *
 * Taking the formatters out of the loop is not micro-optimisation: `Intl`
 * constructors are expensive enough that building four per line shows up on a
 * two-hundred-line page, and every line here shares the same three.
 *
 * `now` is a parameter rather than `new Date()` inside, so *today* is one
 * instant for the whole render — a page that straddled midnight while it was
 * being built would otherwise print two different todays.
 */
export function dayStamper(now: Date, timeZone: string | undefined) {
  const key = keyFormatter(timeZone)
  const thisYear = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'long',
  })
  const otherYear = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  /**
   * **The same day in numbers** — 12 September, directed: *the date of the
   * previous entry should read in numbers.*
   *
   * ⚠ **A second face for a date, not a second rule about days.** `stamp` is the
   * record's voice — *Today*, *Yesterday*, *5 September* — and it is what every
   * day heading and the console's own first word are drawn in. This is for the
   * **console's history**, where a run of worded dates after *Today* reads as
   * prose and a run of numbers reads as what it is: a list of days. Both come
   * off the same `timeZone` and the same instant, so the two can never disagree
   * about which day something happened on.
   *
   * ⚠⚠ **THE YEAR IS ALWAYS THERE, WHICH REVERSES `stamp`'s RULE ON PURPOSE.**
   * That rule reads: *a date carrying a year every time reads as a filing
   * reference; a date without one, three years back, reads as a lie.* **A
   * numeric date IS a filing reference** — that is the whole of what numbers
   * buy — and `05/09` with no year is the lie that rule is about, not the cure
   * for it.
   *
   * ⚠ **`en-GB` like everything else in this file**, so the order is the one the
   * rest of the app's dates are written in. Building the string by hand would
   * be picking a day/month order for the world.
   */
  const numbers = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  const todayKey = key.format(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = key.format(yesterday)
  const nowYear = todayKey.slice(0, 4)

  const stamp = (at: Date): Day => {
    const k = key.format(at)
    if (k === todayKey) return { key: k, label: 'Today' }
    if (k === yesterdayKey) return { key: k, label: 'Yesterday' }
    /*
      The year appears only when it is not this one. A date carrying a year every
      time reads as a filing reference; a date without one, three years back,
      reads as a lie.
    */
    return { key: k, label: (k.slice(0, 4) === nowYear ? thisYear : otherYear).format(at) }
  }

  /** One day, in numbers, with its key — so a caller can dedupe on the day. */
  const numeric = (at: Date) => ({ key: key.format(at), label: numbers.format(at) })

  return { todayKey, stamp, numeric }
}
