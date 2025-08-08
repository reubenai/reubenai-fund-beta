import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from '@/hooks/useErrorHandler'
import { initPostHog } from '@/lib/analytics/posthog'

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize analytics (safe no-op if no key configured)
initPostHog();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
