// Test script to validate background enrichment functionality
// Run this in browser console to test the background-deal-enrichment function

const testBackgroundEnrichment = async () => {
  try {
    console.log('🧪 Testing background enrichment...');
    
    const testData = {
      dealId: 'test-deal-id-123',
      fundId: 'test-fund-id-456',
      companyName: 'Test Company',
      website: 'https://test-company.com',
      linkedinUrl: 'https://linkedin.com/company/test-company',
      crunchbaseUrl: 'https://crunchbase.com/organization/test-company',
      founderName: 'John Doe'
    };

    const response = await fetch('https://bueuioozcgmedkuxawju.supabase.co/functions/v1/background-deal-enrichment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-bueuioozcgmedkuxawju-auth-token') || 'your-auth-token'}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Background enrichment test successful:', result);
    } else {
      console.error('❌ Background enrichment test failed:', result);
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Test error:', error);
    return { error: error.message };
  }
};

// Run the test
testBackgroundEnrichment();