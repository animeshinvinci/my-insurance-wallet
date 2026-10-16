import * as amplitude from '@amplitude/analytics-browser'
import mixpanel from 'mixpanel-browser'
import { RudderAnalytics } from '@rudderstack/analytics-js'
import posthog from 'posthog-js'
import { initBeacon, identifyBeacon, trackBeacon, resetBeacon } from '@/lib/polaris-beacon'
import { logEvent } from '@/lib/actions/analytics'

function getSessionId(): string {
  const key = 'miw_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

let amplitudeInitialized = false
let mixpanelInitialized = false
let rudderInitialized = false
let posthogInitialized = false
let rudder: RudderAnalytics | null = null

export function initAmplitude(apiKey: string) {
  if (!apiKey || amplitudeInitialized) return
  amplitude.init(apiKey, {
    autocapture: {
      elementInteractions: false, // we track manually
      pageViews: false,
      sessions: false,
    },
    defaultTracking: false,
  })
  amplitudeInitialized = true
}

export function initMixpanel(token: string) {
  if (!token || mixpanelInitialized) return
  mixpanel.init(token, { persistence: 'localStorage' })
  mixpanelInitialized = true
}

export function initPostHog(apiKey: string, host: string) {
  if (!apiKey || posthogInitialized) return
  posthog.init(apiKey, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
  })
  posthogInitialized = true
}

export function initRudderStack(writeKey: string, dataPlaneUrl: string) {
  if (!writeKey || !dataPlaneUrl || rudderInitialized) return
  rudder = new RudderAnalytics()
  rudder.load(writeKey, dataPlaneUrl)
  rudderInitialized = true
}

export function initPolarisBeacon(apiKey: string, endpoint: string) {
  initBeacon(apiKey, endpoint)
}

export function identify(userId: string, userProps?: Record<string, string | boolean | number>) {
  if (amplitudeInitialized) {
    amplitude.setUserId(userId)
    if (userProps) {
      const identifyEvent = new amplitude.Identify()
      Object.entries(userProps).forEach(([key, value]) => {
        identifyEvent.set(key, value)
      })
      amplitude.identify(identifyEvent)
    }
  }

  if (mixpanelInitialized) {
    mixpanel.identify(userId)
    if (userProps) {
      mixpanel.people.set(userProps)
    }
  }

  if (rudderInitialized && rudder) {
    rudder.identify(userId, userProps)
  }

  if (posthogInitialized) {
    posthog.identify(userId, userProps)
  }

  identifyBeacon(userId, userProps)
}

export function track(event: string, props?: Record<string, string | boolean | number | null>) {
  if (amplitudeInitialized) {
    amplitude.track(event, props ?? undefined)
  }
  if (mixpanelInitialized) {
    mixpanel.track(event, props ?? undefined)
  }

  if (rudderInitialized && rudder) {
    rudder.track(event, props ?? undefined)
  }

  if (posthogInitialized) {
    posthog.capture(event, props ?? undefined)
  }

  trackBeacon(event, props ?? undefined)

  const { screen, label, ...rest } = (props ?? {}) as Record<string, string | boolean | number | null>
  logEvent(
    event,
    typeof screen === 'string' ? screen : null,
    typeof label === 'string' ? label : null,
    Object.keys(rest).length > 0 ? rest : null,
    getSessionId(),
  ).catch(() => {})
}

export function reset() {
  if (amplitudeInitialized) {
    const deviceId = amplitude.getDeviceId()
    amplitude.reset()
    if (deviceId) amplitude.setDeviceId(deviceId)
  }
  if (mixpanelInitialized) {
    mixpanel.reset()
  }

  if (rudderInitialized && rudder) {
    rudder.reset()
  }

  if (posthogInitialized) {
    posthog.reset()
  }

  resetBeacon()
}
