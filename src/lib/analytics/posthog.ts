import posthog, { PostHog } from 'posthog-js';

let initialized = false;
let client: PostHog | null = null;

// Read key/host from localStorage so you can configure at runtime without env vars
const DEFAULT_POSTHOG_KEY = 'phc_IK3qYZ8E4Z8YHqxOH1SGn9XmF254o6BJjrorg2Xd0VW';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

const getKey = () =>
  (localStorage.getItem('posthog_key') || DEFAULT_POSTHOG_KEY).trim();
const getHost = () =>
  (localStorage.getItem('posthog_host') || DEFAULT_POSTHOG_HOST).trim();

export function initPostHog() {
  try {
    if (initialized) return client;
    const apiKey = getKey();
    const apiHost = getHost();

    if (!apiKey) {
      // No key configured yet – safe no-op
      console.info('[PostHog] Skipped init – no API key found. Add one via localStorage key "posthog_key".');
      return null;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      autocapture: true,
      capture_pageview: false, // we manually track SPA route changes
      capture_pageleave: true,
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie',
      disable_session_recording: false,
      // Respect Do Not Track
      opt_out_capturing_by_default: !!(navigator as any).doNotTrack,
    });

    // Basic error forwarding
    window.addEventListener('error', (e) => {
      try {
        posthog.capture('client_error', {
          message: e.message,
          filename: (e as any).filename,
          lineno: (e as any).lineno,
          colno: (e as any).colno,
        });
      } catch {}
    });

    window.addEventListener('unhandledrejection', (e) => {
      try {
        posthog.capture('unhandled_promise_rejection', {
          reason: (e as PromiseRejectionEvent).reason?.toString?.(),
        });
      } catch {}
    });

    initialized = true;
    client = posthog;
    console.info('[PostHog] Initialized');
    return client;
  } catch (err) {
    console.warn('[PostHog] Init failed', err);
    return null;
  }
}

export const isPostHogEnabled = () => initialized && !!client;

export function identifyUser(id?: string, properties?: Record<string, any>) {
  if (!isPostHogEnabled() || !id) return;
  try {
    posthog.identify(id, properties);
  } catch {}
}

export function setUserProperties(properties: Record<string, any>) {
  if (!isPostHogEnabled()) return;
  try {
    const id = (posthog as any).get_distinct_id?.();
    posthog.identify(id, properties);
  } catch {}
}

export function setFundGroup(fundId?: string, properties?: Record<string, any>) {
  if (!isPostHogEnabled() || !fundId) return;
  try {
    posthog.group('fund', fundId);
    if (properties) {
      // @ts-ignore
      posthog.groupIdentify('fund', fundId, properties);
    }
  } catch {}
}

export function capturePageview(props?: Record<string, any>) {
  if (!isPostHogEnabled()) return;
  try {
    posthog.capture('$pageview', {
      path: window.location.pathname + window.location.search,
      title: document.title,
      ...props,
    });
  } catch {}
}

export function captureEvent(event: string, properties?: Record<string, any>) {
  if (!isPostHogEnabled()) return;
  try {
    posthog.capture(event, properties);
  } catch {}
}

export function shutdownPostHog() {
  try {
    posthog.reset();
    initialized = false;
    client = null;
  } catch {}
}
