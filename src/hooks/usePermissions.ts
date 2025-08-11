import { useUserRole, UserRole } from './useUserRole';

export interface PermissionMatrix {
  // Deal Management
  canViewDeals: boolean;
  canCreateDeals: boolean;
  canEditDeals: boolean;
  canDeleteDeals: boolean;
  canMoveDealsBetweenStages: boolean;
  
  // Document Management
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canDownloadDocuments: boolean;
  
  // Notes Management
  canViewNotes: boolean;
  canCreateNotes: boolean;
  canEditOwnNotes: boolean;
  canEditAllNotes: boolean;
  canDeleteOwnNotes: boolean;
  canDeleteAllNotes: boolean;
  
  // Fund Management
  canViewFunds: boolean;
  canCreateFunds: boolean;
  canEditFunds: boolean;
  canDeleteFunds: boolean;
  
  // Investment Strategy
  canViewStrategy: boolean;
  canConfigureStrategy: boolean;
  canEditThesis: boolean;
  
  // IC System
  canViewICMemos: boolean;
  canCreateICMemos: boolean;
  canEditICMemos: boolean;
  canSubmitForReview: boolean;
  canReviewMemos: boolean;
  canPublishMemos: boolean;
  canVoteOnDeals: boolean;
  canManageICMembers: boolean;
  
  // Batch Operations
  canBatchUpload: boolean;
  canBatchOperations: boolean;
  
  // AI Features
  canUseAISourcing: boolean;
  canTriggerAnalysis: boolean;
  canConfigureAI: boolean;
  
  // Team Management
  canViewTeam: boolean;
  canInviteUsers: boolean;
  canManageUserRoles: boolean;
  
  // Admin Features
  canAccessAdmin: boolean;
  canManageOrganizations: boolean;
  canViewAnalytics: boolean;
  
  // Pipeline Management
  canEditStages: boolean;
  canDeleteStages: boolean;
  canCreateStages: boolean;
  
  // Additional Permissions
  canViewActivities: boolean;
  canViewAnalysis: boolean;
  canRestoreVersions: boolean;
}

const getRolePermissions = (role: UserRole, isSuperAdmin: boolean): PermissionMatrix => {
  // Super admins get everything
  if (isSuperAdmin) {
    return {
      canViewDeals: true,
      canCreateDeals: true,
      canEditDeals: true,
      canDeleteDeals: true,
      canMoveDealsBetweenStages: true,
      canViewDocuments: true,
      canUploadDocuments: true,
      canDeleteDocuments: true,
      canDownloadDocuments: true,
      canViewNotes: true,
      canCreateNotes: true,
      canEditOwnNotes: true,
      canEditAllNotes: true,
      canDeleteOwnNotes: true,
      canDeleteAllNotes: true,
      canViewFunds: true,
      canCreateFunds: true,
      canEditFunds: true,
      canDeleteFunds: true,
      canViewStrategy: true,
      canConfigureStrategy: true,
      canEditThesis: true,
      canViewICMemos: true,
      canCreateICMemos: true,
      canEditICMemos: true,
      canSubmitForReview: true,
      canReviewMemos: true,
      canPublishMemos: true,
      canVoteOnDeals: true,
      canManageICMembers: true,
      canBatchUpload: true,
      canBatchOperations: true,
      canUseAISourcing: true,
      canTriggerAnalysis: true,
      canConfigureAI: true,
      canViewTeam: true,
      canInviteUsers: true,
      canManageUserRoles: true,
      canAccessAdmin: true,
      canManageOrganizations: true,
      canViewAnalytics: true,
      canEditStages: false, // Disabled platform-wide
      canDeleteStages: false, // Disabled platform-wide
      canCreateStages: false, // Disabled platform-wide
      canViewActivities: true,
      canViewAnalysis: true,
      canRestoreVersions: true,
    };
  }

  // Role-based permissions
  switch (role) {
    case 'admin':
      return {
        canViewDeals: true,
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: true,
        canMoveDealsBetweenStages: true,
        canViewDocuments: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canDownloadDocuments: true,
        canViewNotes: true,
        canCreateNotes: true,
        canEditOwnNotes: true,
        canEditAllNotes: true,
        canDeleteOwnNotes: true,
        canDeleteAllNotes: true,
        canViewFunds: true,
        canCreateFunds: true,
        canEditFunds: true,
        canDeleteFunds: true,
        canViewStrategy: true,
        canConfigureStrategy: true,
        canEditThesis: true,
        canViewICMemos: true,
        canCreateICMemos: true,
        canEditICMemos: true,
        canSubmitForReview: true,
        canReviewMemos: true,
        canPublishMemos: true,
        canVoteOnDeals: true,
        canManageICMembers: true,
        canBatchUpload: true,
        canBatchOperations: true,
        canUseAISourcing: true,
        canTriggerAnalysis: true,
        canConfigureAI: true,
        canViewTeam: true,
        canInviteUsers: true,
        canManageUserRoles: true,
        canAccessAdmin: true,
        canManageOrganizations: true, // FIXED: Admins can manage organizations
        canViewAnalytics: true,
        canEditStages: false,
        canDeleteStages: false,
        canCreateStages: false,
        canViewActivities: true,
        canViewAnalysis: true,
        canRestoreVersions: true,
      };

    case 'fund_manager':
      return {
        canViewDeals: true,
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: true,
        canMoveDealsBetweenStages: true,
        canViewDocuments: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canDownloadDocuments: true,
        canViewNotes: true,
        canCreateNotes: true,
        canEditOwnNotes: true,
        canEditAllNotes: false,
        canDeleteOwnNotes: true,
        canDeleteAllNotes: false,
        canViewFunds: true,
        canCreateFunds: true,
        canEditFunds: true,
        canDeleteFunds: false,
        canViewStrategy: true,
        canConfigureStrategy: true,
        canEditThesis: true,
        canViewICMemos: true,
        canCreateICMemos: true,
        canEditICMemos: true,
        canSubmitForReview: true,
        canReviewMemos: true,
        canPublishMemos: true,
        canVoteOnDeals: true,
        canManageICMembers: true,
        canBatchUpload: true,
        canBatchOperations: true,
        canUseAISourcing: true,
        canTriggerAnalysis: true,
        canConfigureAI: false,
        canViewTeam: true,
        canInviteUsers: true,
        canManageUserRoles: true,
        canAccessAdmin: false,
        canManageOrganizations: false,
        canViewAnalytics: true,
        canEditStages: false,
        canDeleteStages: false,
        canCreateStages: false,
        canViewActivities: true,
        canViewAnalysis: true,
        canRestoreVersions: true,
      };

    case 'analyst':
      return {
        canViewDeals: true,
        canCreateDeals: true,
        canEditDeals: true,
        canDeleteDeals: false,
        canMoveDealsBetweenStages: true,
        canViewDocuments: true,
        canUploadDocuments: true,
        canDeleteDocuments: false,
        canDownloadDocuments: true,
        canViewNotes: true,
        canCreateNotes: true,
        canEditOwnNotes: true,
        canEditAllNotes: false,
        canDeleteOwnNotes: false,
        canDeleteAllNotes: false,
        canViewFunds: true,
        canCreateFunds: false, // FIXED: Analysts cannot create funds
        canEditFunds: false,
        canDeleteFunds: false,
        canViewStrategy: true,
        canConfigureStrategy: true, // FIXED: Analysts can configure strategy
        canEditThesis: false,
        canViewICMemos: true,
        canCreateICMemos: true,
        canEditICMemos: true,
        canSubmitForReview: true,
        canReviewMemos: false,
        canPublishMemos: false,
        canVoteOnDeals: true,
        canManageICMembers: false,
        canBatchUpload: true,
        canBatchOperations: false,
        canUseAISourcing: true,
        canTriggerAnalysis: true,
        canConfigureAI: false,
        canViewTeam: false,
        canInviteUsers: false,
        canManageUserRoles: false,
        canAccessAdmin: false,
        canManageOrganizations: false,
        canViewAnalytics: false,
        canEditStages: false,
        canDeleteStages: false,
        canCreateStages: false,
        canViewActivities: true,
        canViewAnalysis: true,
        canRestoreVersions: true,
      };

    case 'viewer':
    default:
      return {
        canViewDeals: true,
        canCreateDeals: false, // FIXED: Viewers cannot create deals
        canEditDeals: false, // FIXED: Viewers cannot edit deals
        canDeleteDeals: false,
        canMoveDealsBetweenStages: false, // FIXED: Viewers cannot move deals
        canViewDocuments: true, // FIXED: Viewers can view documents
        canUploadDocuments: false, // FIXED: Viewers cannot upload documents
        canDeleteDocuments: false, // FIXED: Viewers cannot delete documents
        canDownloadDocuments: false, // FIXED: Viewers are eyes-only
        canViewNotes: true,
        canCreateNotes: false, // FIXED: Viewers cannot create notes
        canEditOwnNotes: false,
        canEditAllNotes: false,
        canDeleteOwnNotes: false,
        canDeleteAllNotes: false,
        canViewFunds: true,
        canCreateFunds: false,
        canEditFunds: false,
        canDeleteFunds: false,
        canViewStrategy: true,
        canConfigureStrategy: false,
        canEditThesis: false,
        canViewICMemos: true,
        canCreateICMemos: false,
        canEditICMemos: false, // FIXED: Viewers cannot edit IC memos
        canSubmitForReview: false,
        canReviewMemos: false,
        canPublishMemos: false,
        canVoteOnDeals: true, // FIXED: Viewers can vote if deal is already in voting
        canManageICMembers: false,
        canBatchUpload: false, // FIXED: Viewers cannot batch upload
        canBatchOperations: false,
        canUseAISourcing: false,
        canTriggerAnalysis: false,
        canConfigureAI: false,
        canViewTeam: false,
        canInviteUsers: false,
        canManageUserRoles: false,
        canAccessAdmin: false,
        canManageOrganizations: false,
        canViewAnalytics: false,
        canEditStages: false,
        canDeleteStages: false,
        canCreateStages: false,
        canViewActivities: true,
        canViewAnalysis: true,
        canRestoreVersions: false, // Viewers cannot restore versions
      };
  }
};

export const usePermissions = (): PermissionMatrix & { 
  role: UserRole; 
  loading: boolean;
  hasPermission: (permission: keyof PermissionMatrix) => boolean;
} => {
  const { role, isSuperAdmin, loading } = useUserRole();

  const permissions = getRolePermissions(role, isSuperAdmin);

  const hasPermission = (permission: keyof PermissionMatrix): boolean => {
    return permissions[permission];
  };

  return {
    ...permissions,
    role,
    loading,
    hasPermission,
  };
};