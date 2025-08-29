import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualWaterfallFixProps {
  dealId: string;
  dealName: string;
}

export function ManualWaterfallFix({ dealId, dealName }: ManualWaterfallFixProps) {
  const [isFixing, setIsFixing] = useState(false);

  const handleManualFix = async () => {
    setIsFixing(true);
    
    try {
      toast.info(`🔧 Starting manual waterfall fix for ${dealName}...`);
      
      const { data, error } = await supabase.functions.invoke('manual-waterfall-fix', {
        body: { dealId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`✅ Waterfall fix completed for ${dealName}`, {
          description: `Created ${data.dataPointsCreated} data points`
        });
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('Manual fix failed:', error);
      toast.error(`❌ Manual fix failed for ${dealName}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-2">Manual Waterfall Fix</h3>
      <p className="text-sm text-yellow-700 mb-3">
        This will manually trigger waterfall processing and data integration for {dealName}.
      </p>
      <Button 
        onClick={handleManualFix}
        disabled={isFixing}
        variant="outline"
        size="sm"
      >
        {isFixing ? "Fixing..." : `Fix ${dealName} Waterfall`}
      </Button>
    </div>
  );
}