import { useCallback } from 'react';
import { useFund } from '@/contexts/FundContext';
import { activityService, CreateActivityInput } from '@/services/ActivityService';
import { useToast } from '@/hooks/use-toast';

export function useActivityTracking() {
  const { selectedFund } = useFund();
  const { toast } = useToast();

  const logActivity = useCallback(async (input: Omit<CreateActivityInput, 'fund_id'>) => {
    if (!selectedFund?.id) {
      console.warn('No fund selected for activity logging');
      return null;
    }

    try {
      const result = await activityService.createActivity({
        ...input,
        fund_id: selectedFund.id
      });

      if (!result) {
        throw new Error('Failed to log activity');
      }

      return result;
    } catch (error) {
      console.error('Error logging activity:', error);
      toast({
        title: 'Activity Log Error',
        description: 'Failed to log activity. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [selectedFund?.id, toast]);

  // Helper methods for common activities
  const logDealCreated = useCallback((dealId: string, companyName: string, context?: Record<string, any>) => {
    return logActivity({
      activity_type: 'deal_created',
      title: `New deal created: ${companyName}`,
      description: `Created a new deal for ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { company_name: companyName, ...context },
      priority: 'medium',
      tags: ['deal', 'created']
    });
  }, [logActivity]);

  const logDealStageChanged = useCallback((dealId: string, companyName: string, fromStage: string, toStage: string) => {
    return logActivity({
      activity_type: 'deal_stage_changed',
      title: `Deal moved: ${companyName}`,
      description: `Moved ${companyName} from ${fromStage} to ${toStage}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { 
        company_name: companyName,
        stage_from: fromStage,
        stage_to: toStage
      },
      change_data: {
        from: fromStage,
        to: toStage
      },
      priority: 'medium',
      tags: ['deal', 'stage_change', fromStage, toStage]
    });
  }, [logActivity]);

  const logDealUpdated = useCallback((dealId: string, companyName: string, changes: Record<string, any>) => {
    return logActivity({
      activity_type: 'deal_updated',
      title: `Deal updated: ${companyName}`,
      description: `Updated details for ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { company_name: companyName },
      change_data: changes,
      priority: 'low',
      tags: ['deal', 'updated']
    });
  }, [logActivity]);

  const logDealDeleted = useCallback((companyName: string, context?: Record<string, any>) => {
    return logActivity({
      activity_type: 'deal_deleted',
      title: `Deal deleted: ${companyName}`,
      description: `Deleted deal for ${companyName}`,
      resource_type: 'deal',
      context_data: { company_name: companyName, ...context },
      priority: 'medium',
      tags: ['deal', 'deleted']
    });
  }, [logActivity]);

  const logDealNoteAdded = useCallback((dealId: string, companyName: string) => {
    return logActivity({
      activity_type: 'deal_note_added',
      title: `Note added to ${companyName}`,
      description: `Added a new note to ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal_note',
      resource_id: dealId,
      context_data: { company_name: companyName },
      priority: 'low',
      tags: ['deal', 'note']
    });
  }, [logActivity]);

  const logDocumentUploaded = useCallback((dealId: string, companyName: string, fileName: string, documentType?: string) => {
    return logActivity({
      activity_type: 'document_uploaded',
      title: `Document uploaded for ${companyName}`,
      description: `Uploaded ${fileName} for ${companyName}`,
      deal_id: dealId,
      resource_type: 'document',
      resource_id: dealId,
      context_data: { 
        company_name: companyName,
        file_name: fileName,
        document_type: documentType
      },
      priority: 'low',
      tags: ['deal', 'document', documentType].filter(Boolean)
    });
  }, [logActivity]);

  const logDocumentAnalyzed = useCallback((dealId: string, companyName: string, fileName: string, analysisType: string) => {
    return logActivity({
      activity_type: 'deal_updated',
      title: `Document analyzed for ${companyName}`,
      description: `Completed ${analysisType} analysis of ${fileName}`,
      deal_id: dealId,
      resource_type: 'document',
      resource_id: dealId,
      context_data: { 
        company_name: companyName,
        file_name: fileName,
        analysis_type: analysisType
      },
      priority: 'medium',
      tags: ['deal', 'document', 'analysis', analysisType]
    });
  }, [logActivity]);

  return {
    logActivity,
    logDealCreated,
    logDealStageChanged,
    logDealUpdated,
    logDealDeleted,
    logDealNoteAdded,
    logDocumentUploaded,
    logDocumentAnalyzed
  };
}