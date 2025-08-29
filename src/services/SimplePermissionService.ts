import { supabase } from "@/integrations/supabase/client";

export interface SimplePermissionCheck {
  canAccess: boolean;
  userOrganizationId?: string;
  dealOrganizationId?: string;
  reason?: string;
}

export class SimplePermissionService {
  /**
   * Check if current user can access a deal based on organization matching
   */
  async checkDealAccess(dealId: string): Promise<SimplePermissionCheck> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return {
          canAccess: false,
          reason: 'User not authenticated'
        };
      }

      // Check if user is Reuben admin
      const userEmail = user.data.user.email;
      const isReubenAdmin = userEmail?.includes('@goreuben.com') || userEmail?.includes('@reuben.com');
      
      if (isReubenAdmin) {
        return {
          canAccess: true,
          reason: 'Reuben admin access'
        };
      }

      // Get user's profile to find their organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role, is_deleted')
        .eq('user_id', user.data.user.id)
        .single();

      if (!profile || profile.is_deleted) {
        return {
          canAccess: false,
          reason: 'User profile not found or deleted'
        };
      }

      // Get deal and fund information to find organization
      const { data: deal } = await supabase
        .from('deals')
        .select(`
          id,
          fund_id,
          funds (
            organization_id
          )
        `)
        .eq('id', dealId)
        .single();

      if (!deal) {
        return {
          canAccess: false,
          reason: 'Deal not found'
        };
      }

      const dealOrganizationId = (deal.funds as any)?.organization_id;
      
      // Check if organizations match
      const canAccess = profile.organization_id === dealOrganizationId;

      // Add debugging
      console.log('🔍 [SimplePermissionService] Deal access check:', {
        dealId,
        userOrgId: profile.organization_id,
        dealOrgId: dealOrganizationId,
        userRole: profile.role,
        canAccess,
        userEmail
      });

      return {
        canAccess,
        userOrganizationId: profile.organization_id,
        dealOrganizationId,
        reason: canAccess ? 'Organization access granted' : 'Organization access denied'
      };

    } catch (error) {
      console.error('Error checking deal access:', error);
      return {
        canAccess: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Check if current user can upload documents based on organization and role
   */
  async checkDocumentUploadPermission(dealId: string): Promise<SimplePermissionCheck> {
    try {
      const dealAccess = await this.checkDealAccess(dealId);
      
      if (!dealAccess.canAccess) {
        return dealAccess;
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return {
          canAccess: false,
          reason: 'User not authenticated'
        };
      }

      // Check if user is Reuben admin (can always upload)
      const userEmail = user.data.user.email;
      const isReubenAdmin = userEmail?.includes('@goreuben.com') || userEmail?.includes('@reuben.com');
      
      if (isReubenAdmin) {
        return {
          canAccess: true,
          reason: 'Reuben admin upload permission'
        };
      }

      // Get user role to check upload permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.data.user.id)
        .single();

      if (!profile) {
        return {
          canAccess: false,
          reason: 'User profile not found'
        };
      }

      // Check role-based upload permissions
      const canUpload = ['super_admin', 'admin', 'fund_manager', 'analyst'].includes(profile.role);

      return {
        canAccess: canUpload,
        userOrganizationId: dealAccess.userOrganizationId,
        dealOrganizationId: dealAccess.dealOrganizationId,
        reason: canUpload ? 'Role-based upload permission granted' : 'Insufficient role for upload'
      };

    } catch (error) {
      console.error('Error checking document upload permission:', error);
      return {
        canAccess: false,
        reason: 'Error checking upload permissions'
      };
    }
  }

  /**
   * Get user's organization and role information
   */
  async getUserInfo(): Promise<{ organizationId?: string; role?: string; isReubenAdmin: boolean }> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return { isReubenAdmin: false };
      }

      const userEmail = user.data.user.email;
      const isReubenAdmin = userEmail?.includes('@goreuben.com') || userEmail?.includes('@reuben.com');

      if (isReubenAdmin) {
        return { 
          isReubenAdmin: true,
          organizationId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'super_admin'
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('user_id', user.data.user.id)
        .single();

      return {
        isReubenAdmin: false,
        organizationId: profile?.organization_id,
        role: profile?.role
      };

    } catch (error) {
      console.error('Error getting user info:', error);
      return { isReubenAdmin: false };
    }
  }
}

export const simplePermissionService = new SimplePermissionService();