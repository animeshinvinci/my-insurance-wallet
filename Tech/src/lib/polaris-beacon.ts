// DepSmith sink for src/lib/analytics.ts — a thin adapter over the published
// @depsmith/depsmith-sdk web SDK.
//
// This file used to be a hand-rolled reimplementation of the ingest wire protocol,
// because the SDK was not on a registry we could install from. It now is, and the
// real client adds what the copy never had: retries with backoff, a queue that
// survives a reload, batching + gzip, sessions with inactivity rotation,
// consent/DNT handling and UTM attribution. Its wire format is the SDK's own, so it
// cannot drift from the collector the way a transcribed copy can.
//
// analytics.ts is the only caller; components never import this directly.
import { DepsmithSdk, type Properties } from '@depsmith/depsmith-sdk'

// Off unless opted in, matching every other sink in analytics.ts: page views here
// are explicit `view-*` events from PageViewTracker, and autocapture would add
// $page_view / click events on top of them.
const AUTOCAPTURE = process.env.NEXT_PUBLIC_POLARIS_BEACON_AUTOCAPTURE === 'true'

let ready = false

// Carry the existing visitor across the swap. The hand-rolled client kept its
// anonymous id under `pb_anonymous_id`; the SDK uses `depsmith_anonymous_id`.
// Without this every returning logged-out visitor counts as a new person on the
// first load after deploy. Runs only while the SDK has no id, so it is idempotent;
// the legacy key is left in place so a rollback keeps the same id.
//
// `pb_user_id` needs no migration: AmplitudeIdentify calls identify() on every
// protected-layout load, so the SDK learns the user id from the app.
function migrateLegacyAnonymousId(): void {
  try {
    const ls = window.localStorage
    if (ls.getItem('depsmith_anonymous_id')) return
    const legacy = ls.getItem('pb_anonymous_id')
    if (legacy) ls.setItem('depsmith_anonymous_id', legacy)
  } catch {
    // private mode / quota — a fresh anonymous id is the acceptable fallback
  }
}

export function initBeacon(apiKey: string, endpoint: string): void {
  if (ready || !apiKey || !endpoint || typeof window === 'undefined') return
  migrateLegacyAnonymousId()
  // The SDK appends `/e/` to the endpoint itself. init() returns null rather than
  // throwing on bad config, so analytics can never take the app down; every call
  // below is then a no-op.
  ready =
    DepsmithSdk.init({
      apiKey,
      endpoint: endpoint.replace(/\/+$/, ''),
      autocapture: AUTOCAPTURE,
    }) !== null
}

export function identifyBeacon(userId: string, traits?: Properties): void {
  if (ready) DepsmithSdk.identify(userId, traits)
}

export function trackBeacon(event: string, properties?: Properties): void {
  if (ready) DepsmithSdk.track(event, properties)
}

// Clears the user and rotates the anonymous id, so events after logout are not
// linked to the person who just left — same contract as the hand-rolled reset().
export function resetBeacon(): void {
  if (ready) DepsmithSdk.reset()
}
