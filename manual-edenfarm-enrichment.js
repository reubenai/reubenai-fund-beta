// Manual script to trigger enrichment for EdenFarm deal
// Run this in browser console to manually process the existing EdenFarm deal

const manualEnrichmentForEdenFarm = async () => {
  try {
    console.log('🔧 Manual EdenFarm Enrichment Started...');
    
    // EdenFarm deal data from database query
    const edenFarmData = {
      dealId: '86faf37c-b3a4-4b11-9ea0-fa9e852e3efe',
      fundId: '151483bd-b6f5-4deb-86c3-3d25dc551029',
      companyName: 'EdenFarm',
      linkedinUrl: 'https://www.linkedin.com/company/pt-eden-pangan-indonesia',
      crunchbaseUrl: 'https://www.crunchbase.com/organization/eden-farm-indonesian',
      website: 'https://edenfarm.id', // Assumed based on company name
      founderName: 'EdenFarm Founder' // Placeholder - update if founder name is available
    };

    console.log('📋 EdenFarm Data:', edenFarmData);

    // Get auth token from localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') && key.includes('auth')
    );
    
    let authToken = null;
    for (const key of authKeys) {
      try {
        const authData = JSON.parse(localStorage.getItem(key) || '{}');
        if (authData.access_token) {
          authToken = authData.access_token;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!authToken) {
      console.error('❌ No auth token found. Make sure you are logged in.');
      return;
    }

    console.log('🔑 Auth token found, calling background enrichment...');

    const response = await fetch('https://bueuioozcgmedkuxawju.supabase.co/functions/v1/background-deal-enrichment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjA2NDUsImV4cCI6MjA2OTQ5NjY0NX0.AXEaxUVew-7g8oyNHMdt0MSsxh9E3ykrQsgCYYOHY4Q'
      },
      body: JSON.stringify(edenFarmData)
    });

    console.log('📡 Response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Manual enrichment successful:', result);
      
      // Monitor progress
      console.log('⏳ Enrichment processes started. Check activity_events table for updates.');
      console.log('🔍 You can run this query to check progress:');
      console.log(`SELECT * FROM activity_events WHERE deal_id = '${edenFarmData.dealId}' ORDER BY created_at DESC;`);
      
    } else {
      const errorResult = await response.text();
      console.error('❌ Manual enrichment failed:', response.status, errorResult);
    }
    
    return response;
    
  } catch (error) {
    console.error('💥 Manual enrichment error:', error);
    return { error: error.message };
  }
};

// Auto-run the enrichment
console.log('🚀 Starting manual EdenFarm enrichment...');
manualEnrichmentForEdenFarm();