import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from '@/hooks/useErrorHandler'
import { initPostHog } from '@/lib/analytics/posthog'

// Ensure React is available globally to prevent null reference errors
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Double-check React is properly loaded
if (!React || !React.useState) {
  console.error('Critical: React is not properly loaded');
  throw new Error('React failed to load properly');
}

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize analytics (safe no-op if no key configured)
initPostHog();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
