// Manual trigger for safe mode test
import { autoSelectVCDealAndRunSafeModeTest } from '@/utils/safeModeUtils';

console.log('🔄 Manually triggering safe mode test...');

autoSelectVCDealAndRunSafeModeTest().then(result => {
  if (result.success) {
    console.log('✅ Safe mode test completed successfully:', result);
    console.log('📋 Selected deal:', result.deal?.company_name);
    console.log('📊 Analysis result:', result.result);
  } else {
    console.error('❌ Safe mode test failed:', result.error);
  }
}).catch(error => {
  console.error('💥 Safe mode test error:', error);
});