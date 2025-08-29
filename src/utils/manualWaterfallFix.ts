import { WaterfallProcessingService } from "@/services/waterfallProcessingService";
import { DealDataIntegrationService } from "@/services/dealDataIntegrationService";

/**
 * Manual utility to fix waterfall processing for specific deals
 * This is for one-time fixes when the monitoring system missed completions
 */
export async function manuallyFixWaterfallProcessing(dealId: string, fundId: string, organizationId: string, fundType: 'vc' | 'pe') {
  console.log(`🔧 Manually fixing waterfall processing for deal ${dealId}`);
  
  try {
    // Force check engine completion with new logic
    const status = await WaterfallProcessingService.getWaterfallStatus(dealId);
    console.log('Current status:', status);
    
    // Manually trigger data integration
    const result = await DealDataIntegrationService.integrateDealData({
      dealId,
      fundId,
      organizationId,
      fundType,
      triggerReason: 'manual_fix'
    });
    
    console.log('✅ Manual integration result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Manual fix failed:', error);
    throw error;
  }
}

// Pre-configured function for Panggilin specifically
export async function fixPanggilinWaterfall() {
  return manuallyFixWaterfallProcessing(
    '0c5d6f85-f7e8-4e6e-bba1-28b231d1d388', // Panggilin deal ID
    '151483bd-b6f5-4deb-86c3-3d25dc551029', // Fund ID  
    'db3b0ed3-036f-4811-9ebc-69fdb09f628b', // Organization ID
    'vc' // Fund type
  );
}