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
            The v1 IC workflow generates simple deal memos and manages basic sub-stages; richer memos and greater time savings will come as analysis and scoring mature. Collaboration features are launching soon.
          </p>
        </div>
      </div>
      <RedesignedICPage />
    </div>
  );
}