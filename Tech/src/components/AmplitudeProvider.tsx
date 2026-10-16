'use client'

import { useEffect } from 'react'
import { initAmplitude, initMixpanel, initPostHog, initRudderStack, initPolarisBeacon } from '@/lib/analytics'

export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const amplitudeKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
    if (amplitudeKey) initAmplitude(amplitudeKey)

    const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    if (mixpanelToken) initMixpanel(mixpanelToken)

    const rudderWriteKey = process.env.NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY
    const rudderDataPlaneUrl = process.env.NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL
    if (rudderWriteKey && rudderDataPlaneUrl) initRudderStack(rudderWriteKey, rudderDataPlaneUrl)

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
    if (posthogKey) initPostHog(posthogKey, posthogHost)

    const polarisBeaconKey = process.env.NEXT_PUBLIC_POLARIS_BEACON_KEY
    const polarisBeaconEndpoint =
      process.env.NEXT_PUBLIC_POLARIS_BEACON_ENDPOINT ?? 'https://demo.trydep.com/api/collect'
    if (polarisBeaconKey) initPolarisBeacon(polarisBeaconKey, polarisBeaconEndpoint)
  }, [])

  return <>{children}</>
}
