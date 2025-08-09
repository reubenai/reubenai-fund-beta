-- Run the deal data fixer to resolve missing company names and enhanced_analysis
SELECT supabase.functions.invoke('deal-data-fixer', '{}');