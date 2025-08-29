import { useState, useCallback } from 'react';
import { simplePermissionService, SimplePermissionCheck } from '@/services/SimplePermissionService';

export const useSimplePermissions = () => {
  const [loading, setLoading] = useState(false);

  const checkDealAccess = useCallback(async (dealId: string): Promise<SimplePermissionCheck> => {
    setLoading(true);
    try {
      return await simplePermissionService.checkDealAccess(dealId);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDocumentUploadPermission = useCallback(async (dealId: string): Promise<SimplePermissionCheck> => {
    setLoading(true);
    try {
      return await simplePermissionService.checkDocumentUploadPermission(dealId);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      return await simplePermissionService.getUserInfo();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkDealAccess,
    checkDocumentUploadPermission,
    getUserInfo,
    loading
  };
};