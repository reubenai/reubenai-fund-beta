import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFund } from '@/contexts/FundContext';
import { capturePageview, identifyUser, isPostHogEnabled, setFundGroup, setUserProperties } from '@/lib/analytics/posthog';

export function PostHogRouterTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const { selectedFund } = useFund();

  // Identify user
  useEffect(() => {
    if (!user) return;
    identifyUser(user.id, {
      email: (user as any).email,
    });
  }, [user]);

  // Group by fund
  useEffect(() => {
    if (!selectedFund) return;
    setFundGroup(selectedFund.id, { name: selectedFund.name });
    // Helpful to set a user property for active fund as well
    setUserProperties({ active_fund_id: selectedFund.id, active_fund_name: selectedFund.name });
  }, [selectedFund]);

  // Track page views on route change
  useEffect(() => {
    if (!isPostHogEnabled()) return;
    capturePageview({
      route: location.pathname,
    });
  }, [location]);

  return null;
}
