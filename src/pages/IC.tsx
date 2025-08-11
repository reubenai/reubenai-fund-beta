import React from 'react';
import RedesignedICPage from '@/components/ic/RedesignedICPage';

export default function IC() {
  return (
    <div className="space-y-6">
      {/* Beta v1 Notice */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-2">Beta v1 Notice</h3>
          <p className="text-sm text-muted-foreground">
            In v1 of the Investment Committee workflows, simple deal memo can be generated along with basic IC sub-stages. As our analysis and scoring capabilities deepen, IC memo generation will improve, and time saved across IC preparation will become clearer.
          </p>
        </div>
      </div>
      <RedesignedICPage />
    </div>
  );
}