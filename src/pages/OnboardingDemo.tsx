import React from 'react';
import { FundOnboardingDashboard } from '@/components/onboarding/FundOnboardingDashboard';

export default function OnboardingDemo() {
  // MAD Hyperscalers Fund ID
  const madHyperscalersFundId = 'bb53614c-0015-46b0-b298-b9af1c2c8425';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <FundOnboardingDashboard fundId={madHyperscalersFundId} />
    </div>
  );
}