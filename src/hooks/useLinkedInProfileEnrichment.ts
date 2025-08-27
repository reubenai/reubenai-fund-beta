import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfileEnrichmentRequest {
  dealId: string;
  firstName: string;
  lastName: string;
}

export interface ProfileEnrichmentResult {
  success: boolean;
  data?: any;
  error?: string;
  dataSource: string;
  trustScore: number;
  dataQuality: number;
}

export const useLinkedInProfileEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<ProfileEnrichmentResult | null>(null);
  const { toast } = useToast();

  const splitName = (fullName: string): { firstName: string; lastName: string } => {
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) {
      return { firstName: '', lastName: '' };
    }
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' };
    }
    // First name is the first part, last name is everything else joined
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    return { firstName, lastName };
  };

  const enrichProfile = async (dealId: string, founderName: string): Promise<ProfileEnrichmentResult | null> => {
    if (!founderName.trim()) {
      toast({
        title: "Missing Information",
        description: "Founder name is required for profile enrichment",
        variant: "destructive",
      });
      return null;
    }

    const { firstName, lastName } = splitName(founderName);
    
    if (!firstName || !lastName) {
      toast({
        title: "Invalid Name Format", 
        description: "Please provide both first and last name for profile enrichment",
        variant: "destructive",
      });
      return null;
    }

    setIsEnriching(true);
    setEnrichmentResult(null);

    try {
      console.log(`🚀 Starting LinkedIn profile enrichment for: ${firstName} ${lastName}`);
      
      const { data, error } = await supabase.functions.invoke(
        'brightdata-linkedin-profile-enrichment',
        {
          body: {
            dealId,
            firstName,
            lastName
          }
        }
      );

      if (error) {
        console.error('❌ Profile enrichment error:', error);
        toast({
          title: "Profile Enrichment Failed",
          description: error.message || "Failed to enrich founder profile",
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Profile enrichment completed:', data);
      setEnrichmentResult(data);
      
      if (data.success) {
        toast({
          title: "Profile Enriched Successfully", 
          description: `Successfully enriched profile for ${firstName} ${lastName}`,
        });
      } else {
        toast({
          title: "Profile Enrichment Issue",
          description: data.error || "Profile enrichment completed with warnings",
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Profile enrichment exception:', error);
      toast({
        title: "Profile Enrichment Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive", 
      });
      return null;
    } finally {
      setIsEnriching(false);
    }
  };

  const triggerProfileEnrichment = async (dealId: string, founderName: string) => {
    const result = await enrichProfile(dealId, founderName);
    return result;
  };

  // Function to get existing profile enrichment data for a deal
  const getProfileEnrichmentData = async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_enrichment_linkedin_profile_export')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching profile enrichment data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching profile enrichment data:', error);
      return null;
    }
  };

  return {
    isEnriching,
    enrichmentResult,
    enrichProfile,
    triggerProfileEnrichment,
    getProfileEnrichmentData,
    splitName
  };
};