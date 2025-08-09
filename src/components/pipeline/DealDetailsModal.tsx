import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Globe, 
  Linkedin, 
  ExternalLink,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { EditDealModal } from './EditDealModal';
import { EnhancedDealDetailsModal } from './EnhancedDealDetailsModal';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';

interface DealDetailsModalProps {
  deal: BaseDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated?: () => void;
  onDealDeleted?: () => void;
}

export function DealDetailsModal({ 
  deal, 
  open, 
  onOpenChange, 
  onDealUpdated, 
  onDealDeleted 
}: DealDetailsModalProps) {
  // Use the enhanced modal for better functionality
  return (
    <EnhancedDealDetailsModal
      deal={deal as any}
      open={open}
      onOpenChange={onOpenChange}
      onDealUpdated={onDealUpdated}
    />
  );
}