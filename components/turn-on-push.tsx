'use client'

import { useState, useSyncExternalStore } from 'react'

import { subscribeAction } from '@/app/actions/push'

/**
 * ⚠⚠ **`useSyncExternalStore`, NOT AN EFFECT THAT SETS STATE.** What is being
 * read is a browser value that does not exist on the server, and it decides
 * whether this component renders **at all** — so unlike `AskThem`, where the
 * label was the same either way and the whole flag could be deleted, the branch
 * really is in the markup here and has to be hydration-safe.
 *
 * `getServerSnapshot` is `false`, so the server and the first client paint agree
 * that there is nothing to draw; the real answer arrives in the same commit as
 * hydration rather than in a second render. **That is what the lint rule against
 * setting state in an effect is asking for**, and reaching for it was the right
 * answer rather than a suppression.
 *
 * ⚠ **`Notification.permission` emits no event**, so the store has no genuine
 * subscription — `notify` is called by hand once the browser's dialogue has been
 * answered, which is the only moment the value can change while this is mounted.
 */
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  for (const listener of listeners) listener()
}

/** A boolean, so `useSyncExternalStore` can compare snapshots by value. */
const canAsk = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  typeof Notification !== 'undefined' &&
  Notification.permission === 'default'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The offer to be told — earned push, 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The permission prompt, asked at the one moment it can be honest.**
 *
 * ⚠⚠ **AT THE FIRST CONVERGENCE, NEVER AT LAUNCH.** Amendment 10 asks for push
 * that is *earned*: *permission is requested only after a person can understand
 * the value.* That has a specific moment, and it is the first convergence they
 * receive **in the app** — it is the only point at which the browser's dialogue
 * can be truthful about what it will deliver, because the thing it will deliver
 * is on screen behind it. **Asking at launch spends the one request a browser
 * ever gives you on somebody who has nothing to be notified about**, and a
 * denial is permanent in a way nothing in this app can undo.
 *
 * ⚠ **So it renders inside the portal and nowhere else**, under the lines,
 * below the convergences it is about.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  When it says nothing
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Four silences, and every one of them is §6's *silence stays silent*.**
 * No support (no `PushManager`, which is every iOS browser that is not an
 * installed app); already granted; already denied; and the whole of the first
 * paint, before the browser has been asked anything. **A line explaining that
 * notifications are unavailable would be the interface explaining an absence**,
 * which this app forbids — and on iOS it would appear to everybody reading in a
 * tab, telling them to do something the line cannot describe.
 *
 * ⚠ **Denied is permanent and silent, deliberately.** Once a browser has been
 * told no it will not ask again, so a control that stayed would be a button
 * that cannot do what it says. The way back is the browser's own settings, and
 * this app is not going to write instructions for four of them.
 *
 * ⚠ **Read after mount, never during render.** `Notification.permission` does
 * not exist on the server; branching on it while rendering hydrates one way and
 * re-renders the other. ⚠ **Unlike `AskThem`, the branch really is in the
 * markup here** — the whole component is present or absent — so the state and
 * the effect are load-bearing rather than the flag that one deleted.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What it is not
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **No dismiss control, and no remembered dismissal.** It is one muted line
 * in a box somebody opened on purpose, and answering it either way — allow or
 * deny — retires it for good. **A dismissal that outlived the card would be a
 * third piece of per-device state to keep**, and the honest reading of somebody
 * ignoring it twice is that they have not decided yet.
 *
 * ⚠ **It never becomes a nag anywhere else.** §1 excludes generic
 * re-engagement, and a prompt on the record or the composer is exactly that
 * wearing a permission dialogue.
 */
export function TurnOnPush() {
  const askable = useSyncExternalStore(subscribe, canAsk, () => false)
  const [busy, setBusy] = useState(false)

  if (!askable) return null

  const turnOn = async () => {
    setBusy(true)
    try {
      /*
        ⚠⚠ **THE REGISTRATION AND THE PERMISSION ARE ONE GESTURE, AND THE ORDER
        MATTERS.** Safari grants a push permission only inside a user gesture, so
        the whole of this has to hang off the tap — awaiting the registration
        first is fine because it does not break the gesture, but showing any
        dialogue of our own before it would.
      */
      const registration = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) return

      const subscription = await registration.pushManager.subscribe({
        /*
          ⚠ **`true`, and there is no choice about it.** Chrome refuses a
          subscription that is not user-visible: a push that shows no
          notification is the shape used to track people silently, and the
          platform will not issue one. It also happens to be exactly what this
          product wants — every push here is a thing somebody asked to be told.
        */
        userVisibleOnly: true,
        applicationServerKey: key,
      })

      await subscribeAction(JSON.parse(JSON.stringify(subscription)))
    } catch {
      /*
        ⚠ **Silent, and that is the honest end.** The browser's own dialogue is
        the only feedback that matters here: if it was dismissed there is
        nothing to report, and if the subscribe failed there is nothing this
        line can offer that retrying the tap does not. §6 again.
      */
    } finally {
      setBusy(false)
      /*
        ⚠ **The one moment the permission can change while this is mounted.**
        Answering the browser's dialogue either way retires this line for good;
        `notify` is what makes the already-open card notice, rather than the
        reader seeing a control that can no longer do anything until the portal
        is closed and opened again.
      */
      notify()
    }
  }

  return (
    <p className="text-muted mt-4 text-[0.8125rem]">
      {/*
        ⚠ **The state and the verb, as two things** — design rule 1, the same
        division the lock makes in the console. The sentence says what will
        happen; the word says what the tap does. ⚠ **It says *when this
        happens*, pointing at the convergence above it**, because a sentence
        about notifications in the abstract is the launch prompt this exists to
        avoid.
      */}
      <span className="name-mark">Juce</span> can tell you when this happens, even when it
      is closed.
      <button
        type="button"
        onClick={turnOn}
        disabled={busy}
        aria-label="Turn on notifications for convergences and requests"
        className="text-chrome tap-target ms-2 transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        Turn on
      </button>
    </p>
  )
}
